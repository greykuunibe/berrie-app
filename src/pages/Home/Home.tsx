import { useState } from "react";
import { FooterBlur } from "@components/primitives";
import { ToggleGroup } from "@components/primitives";
import { Bible, Notes as NotesIcon } from "@Icons";

export function Home() {
  const [section, setSection] = useState<"bible" | "notes">("bible");

  return (
    <div className="relative min-h-full">
      {/* Title row */}
      <div className="flex items-center justify-between py-16">
        <h2 className="text-2xl font-medium text-text-primary leading-none">Home</h2>
        <ToggleGroup
          variant="icon"
          value={section}
          onChange={(v) => setSection(v as "bible" | "notes")}
          options={[
            { icon: Bible,     label: "Bible", value: "bible" },
            { icon: NotesIcon, label: "Notes", value: "notes" },
          ]}
        />
      </div>

      <FooterBlur />
    </div>
  );
}
