import { useState } from "react";
import { ToggleGroup } from "@components/primitives";

export function Home() {
  const [section, setSection] = useState<"bible" | "notes">("bible");

  return (
    <div className="relative min-h-full">
      {/* Title row */}
      <div className="flex items-center justify-between py-16 px-24">
        <h2 className="text-2xl font-medium text-text-primary leading-none">Home</h2>
        <ToggleGroup
          variant="toggle"
          value={section}
          onChange={(v) => setSection(v as "bible" | "notes")}
          options={[
            { label: "Bible", value: "bible" },
            { label: "Notes", value: "notes" },
          ]}
        />
      </div>
    </div>
  );
}
