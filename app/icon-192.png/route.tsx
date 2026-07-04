import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export async function GET() {
  const file = await readFile(join(process.cwd(), "public", "brand", "study-flow-logo-dark.png"));

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
