import Link from "next/link";
import {
  RiImageLine,
  RiFileTextLine,
  RiStickyNoteLine,
  RiLinkM,
  RiArrowRightSLine,
} from "@remixicon/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { StudyPack } from "@/lib/types";
import { formatRelativeDate } from "@/lib/utils";

const SOURCE_ICONS: Record<StudyPack["sourceType"], typeof RiImageLine> = {
  photo: RiImageLine,
  file: RiFileTextLine,
  notes: RiStickyNoteLine,
  link: RiLinkM,
};

export function StudyPackList({
  packs,
  onEmptyAction,
  emptyLabel = "Generate one",
}: {
  packs: (StudyPack & { id: string })[];
  onEmptyAction?: () => void;
  emptyLabel?: string;
}) {
  if (packs.length === 0) {
    return (
      <Card className="flex flex-col gap-3 p-4">
        <p className="text-sm text-muted-foreground">You haven&apos;t generated any study packs yet.</p>
        <Button size="sm" onClick={onEmptyAction}>
          {emptyLabel}
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {packs.map((pack) => {
        const Icon = SOURCE_ICONS[pack.sourceType];
        return (
          <Link key={pack.id} href={`/pack/${pack.id}`}>
            <Card className="flex items-center justify-between p-3 transition-colors hover:border-primary">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{pack.topic}</p>
                  <p className="text-xs text-muted-foreground">{formatRelativeDate(pack.createdAt)}</p>
                </div>
              </div>
              <RiArrowRightSLine className="size-4 text-muted-foreground" />
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
