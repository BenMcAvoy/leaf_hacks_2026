import {
  RiFocus3Line,
  RiImageLine,
  RiBookOpenLine,
  RiChatSmileLine,
  RiCheckLine,
} from "@remixicon/react";
import { Card } from "@/components/ui/card";
import { LEARNING_STYLE_META, type LearningStyle } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLE_ICONS: Record<LearningStyle, React.ComponentType<{ className?: string }>> = {
  focusFlow: RiFocus3Line,
  picturePath: RiImageLine,
  clearRead: RiBookOpenLine,
  simpleSpeak: RiChatSmileLine,
};

export function LearningStyleSelector({
  value,
  onChange,
}: {
  value: LearningStyle | null;
  onChange: (style: LearningStyle) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {(Object.keys(LEARNING_STYLE_META) as LearningStyle[]).map((key) => {
        const meta = LEARNING_STYLE_META[key];
        const Icon = STYLE_ICONS[key];
        const selected = value === key;
        return (
          <Card
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "cursor-pointer gap-2 border-2 p-5 transition-colors",
              selected ? "border-primary bg-primary/5" : "border-transparent hover:border-border",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              {selected && <RiCheckLine className="size-5 text-primary" />}
            </div>
            <h3 className="font-medium">{meta.label}</h3>
            <p className="text-sm text-muted-foreground">{meta.tagline}</p>
            <p className="text-xs text-muted-foreground">{meta.description}</p>
          </Card>
        );
      })}
    </div>
  );
}
