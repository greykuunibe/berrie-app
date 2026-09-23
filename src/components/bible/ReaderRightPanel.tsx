export interface ReaderRightPanelProps {
  bookId: number;
  chapterNumber: number;
}

export function ReaderRightPanel({ bookId: _bookId, chapterNumber: _chapterNumber }: ReaderRightPanelProps) {
  return (
    <div className="flex flex-col h-full min-w-64 shrink-0 overflow-y-auto scrollbar-none py-6 px-2 gap-4 ">
    </div>
  );
}
