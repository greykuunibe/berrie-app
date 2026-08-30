import { Icon } from "@components/primitives/Icons";
import { Loader } from "@Icons";

export function Loading() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div
        className="flex items-center justify-center bg-surface-1 border border-border-gray-1 card-shadow rounded-xl"
        style={{ width: 200, height: 150 }}
      >
        <Icon icon={Loader} size={24} color="muted" className="animate-spin" />
      </div>
    </div>
  );
}
