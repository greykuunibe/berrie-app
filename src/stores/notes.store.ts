import { create } from "zustand";
import type { Note, NoteBlock, NoteBlockType } from "@/types";
import {
  fetchNotes,
  fetchNoteBlocks,
  createNote as createNoteService,
  updateNote as updateNoteService,
  deleteNote as deleteNoteService,
  createBlock as createBlockService,
  updateBlock as updateBlockService,
  deleteBlock as deleteBlockService,
  reorderBlocks as reorderBlocksService,
} from "@/lib/notes.service";

interface NotesStore {
  // State
  notes: Note[];
  currentNote: Note | null;
  blocks: NoteBlock[];
  isLoadingNotes: boolean;
  isLoadingBlocks: boolean;
  error: string | null;

  // Actions
  loadNotes: () => Promise<void>;
  loadBlocks: (noteId: string) => Promise<void>;
  createNote: (title?: string) => Promise<Note | null>;
  updateNote: (id: string, updates: Partial<Pick<Note, "title">>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  selectNote: (note: Note) => void;
  createBlock: (block: {
    note_id: string;
    type: NoteBlockType;
    content: Record<string, unknown>;
    position: number;
  }) => Promise<NoteBlock | null>;
  updateBlock: (
    id: string,
    updates: Partial<Pick<NoteBlock, "content" | "position" | "type">>
  ) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  reorderBlocks: (blocks: Array<{ id: string; position: number }>) => Promise<void>;
  clearError: () => void;
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  currentNote: null,
  blocks: [],
  isLoadingNotes: false,
  isLoadingBlocks: false,
  error: null,

  loadNotes: async () => {
    if (get().isLoadingNotes) return;
    set({ isLoadingNotes: true, error: null });
    try {
      const notes = await fetchNotes();
      set({ notes, isLoadingNotes: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoadingNotes: false });
    }
  },

  loadBlocks: async (noteId: string) => {
    set({ isLoadingBlocks: true, error: null });
    try {
      const blocks = await fetchNoteBlocks(noteId);
      set({ blocks, isLoadingBlocks: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoadingBlocks: false });
    }
  },

  createNote: async (title = "Untitled") => {
    try {
      const note = await createNoteService(title);
      set((state) => ({ notes: [note, ...state.notes] }));
      return note;
    } catch (err) {
      set({ error: (err as Error).message });
      return null;
    }
  },

  updateNote: async (id, updates) => {
    try {
      const updated = await updateNoteService(id, updates);
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? updated : n)),
        currentNote: state.currentNote?.id === id ? updated : state.currentNote,
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  deleteNote: async (id) => {
    try {
      await deleteNoteService(id);
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        currentNote: state.currentNote?.id === id ? null : state.currentNote,
        blocks: state.currentNote?.id === id ? [] : state.blocks,
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  selectNote: (note) => set({ currentNote: note, blocks: [] }),

  createBlock: async (block) => {
    try {
      const newBlock = await createBlockService(block);
      set((state) => ({
        blocks: [...state.blocks, newBlock].sort((a, b) => a.position - b.position),
      }));
      return newBlock;
    } catch (err) {
      set({ error: (err as Error).message });
      return null;
    }
  },

  updateBlock: async (id, updates) => {
    try {
      const updated = await updateBlockService(id, updates);
      set((state) => ({
        blocks: state.blocks.map((b) => (b.id === id ? updated : b)),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  deleteBlock: async (id) => {
    try {
      await deleteBlockService(id);
      set((state) => ({ blocks: state.blocks.filter((b) => b.id !== id) }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  reorderBlocks: async (blocks) => {
    // Optimistic update first
    const ordered = [...get().blocks].sort((a, b) => {
      const posA = blocks.find((b) => b.id === a.id)?.position ?? a.position;
      const posB = blocks.find((b) => b.id === b.id)?.position ?? b.position;
      return posA - posB;
    });
    set({ blocks: ordered });
    try {
      await reorderBlocksService(blocks);
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  clearError: () => set({ error: null }),
}));
