import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AccessibilitySettings } from "@/lib/types";

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function AccessibilityControls({
  value,
  onChange,
}: {
  value: AccessibilitySettings;
  onChange: (next: AccessibilitySettings) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <ToggleRow
        label="Reduce motion"
        description="Turns off animations and transitions."
        checked={value.reduceMotion}
        onChange={(v) => onChange({ ...value, reduceMotion: v })}
      />
      <ToggleRow
        label="Dyslexia-friendly font"
        description="Switches to a font with wider letter and word spacing."
        checked={value.dyslexiaFont}
        onChange={(v) => onChange({ ...value, dyslexiaFont: v })}
      />
      <ToggleRow
        label="Low-stimulation colors"
        description="Softens accent colors and contrast."
        checked={value.lowStimulation}
        onChange={(v) => onChange({ ...value, lowStimulation: v })}
      />
      <div className="flex items-center justify-between">
        <div>
          <Label>Text size</Label>
          <p className="text-xs text-muted-foreground">Applies everywhere in the app.</p>
        </div>
        <div className="flex gap-1">
          {(["normal", "large", "xlarge"] as const).map((size) => (
            <Button
              key={size}
              type="button"
              size="sm"
              variant={value.textSize === size ? "default" : "outline"}
              onClick={() => onChange({ ...value, textSize: size })}
            >
              {size === "normal" ? "A" : size === "large" ? "A+" : "A++"}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label>Line spacing</Label>
          <p className="text-xs text-muted-foreground">More breathing room between lines.</p>
        </div>
        <div className="flex gap-1">
          {(["normal", "relaxed"] as const).map((spacing) => (
            <Button
              key={spacing}
              type="button"
              size="sm"
              variant={value.lineSpacing === spacing ? "default" : "outline"}
              onClick={() => onChange({ ...value, lineSpacing: spacing })}
            >
              {spacing === "normal" ? "Normal" : "Relaxed"}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
