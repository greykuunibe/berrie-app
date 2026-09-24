import { WifiOff } from "lucide-react";
import { Button } from "@components/primitives/Button";

export interface ConnectionErrorProps {
  onRetry?: () => void;
  message?: string;
}

export function ConnectionError({ onRetry, message }: ConnectionErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full h-full py-16">
      <WifiOff width={48} height={48} className="text-surface-2" aria-hidden="true" />
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-base text-text-primary text-center leading-none">
          Connection failed
        </p>
        <p className="text-sm text-text-muted text-center leading-5 max-w-56">
          {message ?? "Check your internet connection and try again."}
        </p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
