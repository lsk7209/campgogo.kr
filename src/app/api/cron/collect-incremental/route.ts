import { db } from "@/lib/db/client";
import { campsites, dataSources } from "@/lib/db/schema";
import { GoCampingClient, normalizeGoCampingItem, parseGoCampingItem } from "@/lib/api/gocamping";
import { classifyCampsite } from "@/lib/curation/classify";
import { calcFitScore } from "@/lib/curation/fit-score";
import { classifyChabakTrust } from "@/lib/curation/chabak-trust";
import { calcDistanceFromCities } from "@/lib/curation/distance";
import { Checkpoint } from "@/lib/utils/checkpoint";

export const runtime = "nodejs";
export const maxDuration = 300;

const SOURCE_ID = "gocamping";
const PAGE_SIZE = 100;
const MAX_ITEMS_PER_RUN = 200;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GOCAMPING_API_KEY;
  if (!apiKey) {
    return Response.json({ skipped: true, reason: "GOCAMPING_API_KEY not set" });
  }

  // Upsert data source record
  await db
    .insert(dataSources)
    .values({
      id: SOURCE_ID,
      name: "고캠핑 (GoCamping)",
      url: "https://apis.data.go.kr/B551011/GoCamping",
      license: "공공누리 제1유형",
      lastFetchedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: dataSources.id,
      set: { lastFetchedAt: new Date() },
    });

  const checkpoint = new Checkpoint("collect-gocamping");
  const state = await checkpoint.load();

  // cursor = page number string; null or "done" → restart cycle from page 1
  const startPage =
    state.cursor && state.cursor !== "done" ? parseInt(state.cursor, 10) : 1;

  const client = new GoCampingClient(apiKey);
  let pageNo = startPage;
  let processedThisRun = 0;
  let upserted = 0;

  try {
    while (processedThisRun < MAX_ITEMS_PER_RUN) {
      const body = await client.fetchPage(pageNo, PAGE_SIZE);
      const rawItems = body.items?.item ?? [];

      if (rawItems.length === 0) {
        await checkpoint.complete(processedThisRun);
        return Response.json({ done: true, cycleComplete: true, upserted, processed: processedThisRun });
      }

      for (const raw of rawItems) {
        if (processedThisRun >= MAX_ITEMS_PER_RUN) break;

        const item = parseGoCampingItem(raw);
        if (!item) { processedThisRun++; continue; }

        const norm = normalizeGoCampingItem(item, SOURCE_ID);

        // Fix double-stringify: normalizeGoCampingItem pre-stringifies JSON fields
        const photosObj = norm.photos ? JSON.parse(norm.photos as string) : null;
        const rawDataObj = norm.rawData ? JSON.parse(norm.rawData as string) : null;
        const facilitiesObj = norm.facilities as unknown as Record<string, boolean>;

        const classified = classifyCampsite({
          operatorType: norm.operatorType,
          type: norm.type,
          name: norm.name,
          facilities: facilitiesObj as unknown as null,
          rawData: rawDataObj,
        });

        // Initial chabak trust level from induty
        let chabakTrustLevel: string | null = null;
        if (classified.isChabak) {
          const induty = String(item.induty ?? "");
          const result = classifyChabakTrust(norm.id, classified.isPublic, induty, []);
          chabakTrustLevel = result.level;
        }

        // Compute fit score
        const fitScore = calcFitScore({
          isPublic: classified.isPublic,
          isFree: classified.isFree,
          isCheap: classified.isCheap,
          isChabak: classified.isChabak,
          chabakTrustLevel,
          facilities: facilitiesObj as unknown as null,
          photos: photosObj,
          operatorType: norm.operatorType,
          price1Night: null,
        });

        // Distance from major cities
        const distanceFromCities =
          norm.lat && norm.lng ? calcDistanceFromCities(norm.lat, norm.lng) : null;

        const now = new Date();

        await db
          .insert(campsites)
          .values({
            id: norm.id,
            sourceId: SOURCE_ID,
            externalId: norm.externalId,
            name: norm.name,
            nameNormalized: norm.nameNormalized,
            sido: norm.sido,
            gungu: norm.gungu,
            address: norm.address,
            lat: norm.lat,
            lng: norm.lng,
            type: norm.type,
            operator: norm.operator,
            operatorType: norm.operatorType,
            facilities: facilitiesObj as unknown as null,
            photos: photosObj,
            contact: norm.contact,
            reservationUrl: norm.reservationUrl,
            rawData: rawDataObj,
            isPublic: classified.isPublic,
            isFree: classified.isFree,
            isCheap: classified.isCheap,
            isChabak: classified.isChabak,
            chabakTrustLevel,
            distanceFromCities: distanceFromCities as unknown as null,
            fitScore,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: campsites.id,
            set: {
              name: norm.name,
              nameNormalized: norm.nameNormalized,
              sido: norm.sido,
              gungu: norm.gungu,
              address: norm.address,
              lat: norm.lat,
              lng: norm.lng,
              type: norm.type,
              operator: norm.operator,
              operatorType: norm.operatorType,
              facilities: facilitiesObj as unknown as null,
              photos: photosObj,
              contact: norm.contact,
              reservationUrl: norm.reservationUrl,
              rawData: rawDataObj,
              isPublic: classified.isPublic,
              isFree: classified.isFree,
              isCheap: classified.isCheap,
              isChabak: classified.isChabak,
              distanceFromCities: distanceFromCities as unknown as null,
              fitScore,
              updatedAt: now,
              // Preserve curated fields: chabakTrustLevel, chabakSource, chabakSourceDate,
              // uniquePoints, nearbyTourSpots — only set on new records (INSERT path above)
            },
          });

        upserted++;
        processedThisRun++;
      }

      // Check if this was the last page
      const isLastPage = pageNo >= Math.ceil(body.totalCount / PAGE_SIZE);
      if (isLastPage) {
        await checkpoint.complete(processedThisRun);
        return Response.json({ done: true, cycleComplete: true, upserted, processed: processedThisRun });
      }

      pageNo++;
      await new Promise((r) => setTimeout(r, 200));
    }

    // Paused mid-cycle — save next page as cursor
    await checkpoint.save(String(pageNo), processedThisRun);
    return Response.json({ done: false, nextPage: pageNo, upserted, processed: processedThisRun });
  } catch (err) {
    await checkpoint.fail(String(err));
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
