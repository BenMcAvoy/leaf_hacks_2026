import { ImageResponse } from "next/og";
import { LeafMark } from "@/lib/app-icon";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export function GET() {
  return new ImageResponse(<LeafMark size={512} />, size);
}
