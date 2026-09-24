import { create } from "zustand";

interface ReaderUIStore {
  chapters: number[];
  activeChapter: number;
  onSelectChapter: (n: number) => void;
  leftPanelOpen: boolean;
  toggleLeftPanel: () => void;
  setReaderUI: (chapters: number[], activeChapter: number, onSelectChapter: (n: number) => void) => void;
  clearReaderUI: () => void;
}

export const useReaderUIStore = create<ReaderUIStore>((set) => ({
  chapters: [],
  activeChapter: 1,
  onSelectChapter: () => {},
  leftPanelOpen: true,
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  setReaderUI: (chapters, activeChapter, onSelectChapter) =>
    set({ chapters, activeChapter, onSelectChapter }),
  clearReaderUI: () => set({ chapters: [], activeChapter: 1, onSelectChapter: () => {} }),
}));
