import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/app/about/page.tsx", import.meta.url), "utf8");
const expected = 'alternates: { canonical: "https://campgogo.kr/about" }';

if (!source.includes(expected)) {
  throw new Error(`Missing exact /about canonical metadata: ${expected}`);
}

console.log("about canonical source check: PASS");
