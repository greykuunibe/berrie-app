import { useEffect } from "react";
import { useNotesStore } from "@/stores/notes.store";

export function useNotes() {
  const store = useNotesStore();

  // Auto-load notes on first use
  useEffect(() => {
    if (store.notes.length === 0 && !store.isLoadingNotes) {
      store.loadNotes();
    }
  }, []);

  // Auto-load blocks when a note is selected
  useEffect(() => {
    if (store.currentNote && store.blocks.length === 0 && !store.isLoadingBlocks) {
      store.loadBlocks(store.currentNote.id);
    }
  }, [store.currentNote]);

  return store;
}
