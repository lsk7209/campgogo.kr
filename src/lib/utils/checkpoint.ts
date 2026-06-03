import { db } from "@/lib/db/client";
import { collectCheckpoints } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export class Checkpoint {
  constructor(private readonly jobName: string) {}

  async load(): Promise<{ cursor: string | null; processed: number }> {
    const row = await db
      .select()
      .from(collectCheckpoints)
      .where(eq(collectCheckpoints.jobName, this.jobName))
      .get();

    if (!row) {
      return { cursor: null, processed: 0 };
    }

    return {
      cursor: row.lastCursor ?? null,
      processed: row.processed ?? 0,
    };
  }

  async save(cursor: string, processed: number): Promise<void> {
    await db
      .insert(collectCheckpoints)
      .values({
        jobName: this.jobName,
        lastCursor: cursor,
        processed,
        status: "running",
      })
      .onConflictDoUpdate({
        target: collectCheckpoints.jobName,
        set: {
          lastCursor: cursor,
          processed,
          status: "running",
        },
      });
  }

  async complete(processed: number): Promise<void> {
    await db
      .insert(collectCheckpoints)
      .values({
        jobName: this.jobName,
        lastCursor: null,
        processed,
        status: "completed",
      })
      .onConflictDoUpdate({
        target: collectCheckpoints.jobName,
        set: {
          lastCursor: null,
          processed,
          status: "completed",
          errorMessage: null,
        },
      });
  }

  async fail(error: string): Promise<void> {
    await db
      .insert(collectCheckpoints)
      .values({
        jobName: this.jobName,
        status: "failed",
        errorMessage: error,
      })
      .onConflictDoUpdate({
        target: collectCheckpoints.jobName,
        set: {
          status: "failed",
          errorMessage: error,
        },
      });
  }
}
