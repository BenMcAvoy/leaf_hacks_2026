import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const file = await readFile(join(process.cwd(), "public", "brand", "study-flow-logo-dark.png"));

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
