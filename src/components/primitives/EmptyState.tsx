import { Button } from "@components/primitives/Button";
import type { IconComponent } from "@components/primitives/Icons";

export interface EmptyStateProps {
  icon: IconComponent;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 w-95.75 max-w-full">
      {/* Icon — large, surface-2 fill (decorative) */}
      <div className="w-20 h-20 flex items-center justify-center">
        <Icon
          width={60}
          height={60}
          className="text-surface-2"
          aria-hidden="true"
        />
      </div>

      {/* Text + action */}
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="flex flex-col items-center gap-2 w-full">
          <p className="text-lg text-text-primary text-center leading-none">
            {title}
          </p>
          {/* {description && (
            <p className="text-sm text-text-muted text-center leading-5 max-w-56">
              {description}
            </p>
          )} */}
        </div>

        {action && (
          <Button variant="secondary" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
