import { ImageResponse } from "next/og";
import { LeafMark } from "@/lib/app-icon";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export function GET() {
  return new ImageResponse(<LeafMark size={192} />, size);
}
