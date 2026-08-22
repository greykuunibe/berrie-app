import { Button } from "@components/primitives";
import { Icon } from "@Icons";
import type { IconComponent } from "@Icons";
import * as IconSet from "@components/primitives/Icons/Icons";
import { ComponentShowcase } from "./ComponentShowcase";
import { Check, Search } from "@Icons";

const ALL_ICONS = Object.entries(IconSet) as [string, IconComponent][];

export function UILibrary() {
  return (
    <div className="min-h-screen space-y-10 bg-white text-text-primary">
      <div className="flex items-center sticky top-0 justify-between w-full max-w-5xl mx-auto py-2">
        <h1 className="text-xl font-medium">UI Library</h1>
        <Button variant="primary" size="sm" icon={Search}>
          Search
        </Button>
      </div>
      <ComponentShowcase id="button" title="Button">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button icon={Check} variant="primary">
            Primary
          </Button>
          <Button icon={Check} variant="brand">
            Brand
          </Button>
          <Button icon={Check} variant="secondary">
            Secondary
          </Button>
          <Button icon={Check} variant="ghost">
            Ghost
          </Button>
        </div>
      </ComponentShowcase>

      <ComponentShowcase id="icons" title="Icons">
        <div className="grid w-full grid-cols-6 place-items-center gap-4">
          {ALL_ICONS.map(([name, IconComponent]) => (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex items-center justify-center w-16 h-16 bg-surface-1 border-b border-border-gray-1">
                <Icon key={name} icon={IconComponent} color="muted" size={16} />
              </div>
              <span className="text-xs font-medium text-text-primary">
                {name}
              </span>
            </div>
          ))}
        </div>
      </ComponentShowcase>
    </div>
  );
}
