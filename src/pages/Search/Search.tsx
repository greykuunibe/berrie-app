import { EmptyState } from "@components/primitives";
import { Search as SearchIcon } from "@Icons";

export function Search() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <EmptyState
        icon={SearchIcon}
        title="Search Berrie"
        description="Search across verses, notes, and resources"
      />
    </div>
  );
}
