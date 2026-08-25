import { EmptyState } from "@components/primitives";
import { Notes as NotesIcon } from "@Icons";

export function Notes() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <EmptyState
        icon={NotesIcon}
        title="No notes here"
        description="Create a note to capture your thoughts and insights"
        action={{ label: "Create a note", onClick: () => {} }}
      />
    </div>
  );
}
