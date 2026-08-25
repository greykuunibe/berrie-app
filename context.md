# Berrie — Project Context

## Current Phase
Phase 1 — Infrastructure (complete) → Phase 2 next

## What's Built
- **Design system**: Tailwind v4 tokens, colors, shadows, squircle utility — complete
- **Button**: Animated, async state machine (idle → processing → success/failed) — complete
- **Input**: Pure rendering primitive, label + error support — complete
- **Icon**: 50+ semantic icons from heroicons + lucide-react — complete
- **WindowTitleBar**: Frameless Tauri titlebar with native controls — complete
- **UILibrary**: Dev component showcase page (route: `#/ui-library`) — complete
- **React Router**: Hash-mode router wired in App.tsx (react-router-dom v7) — complete
- **Zustand stores**: bible, notes, resources, search, ui — complete (empty shells)
- **TypeScript types**: bible, notes, resources, user entity types — complete
- **AppLayout**: WindowTitleBar + Sidebar + `<Outlet />` wrapper — complete
- **Sidebar**: Icon nav (Bible, Notes, Resources, Search, Settings, Profile) — complete
- **Placeholder pages**: BibleLibrary, Notes, Search, Settings — complete
- **useTauri hook**: Typed wrappers for Tauri commands — complete
- **Rust/SQLite**: rusqlite bundled, Database state, db/mod.rs, schema.rs, seed.rs — complete
- **SQL schema**: All tables (translations, books, chapters, verses, resources, commentaries, lexicons, notes, note_blocks, files, user) + FTS5 virtual tables — complete
- **Book seeding**: All 66 Bible books with metadata seeded on first launch — complete
- **Tauri commands**: get_books, get_chapters, get_verses — wired and registered

## What's Next (Phase 2 — Bible Core)
- BibleLibrary page: OT/NT tabs, book grid with BookCard components
- Chapter navigation: calendar-style chapter selector
- Scripture Reader: verse list with proper typography
- Verse interaction: select, highlight, copy
- Translation switcher

## Known Issues / Decisions Pending
- KJV verse text NOT seeded — needs import from `scrollmapper/bible_databases`
  - Download the SQLite dump, write a Rust seeding function to import verses + chapters from it
- `Translation`, `Note`, `NoteBlock` Rust structs have dead_code warnings — expected, used in Phase 2+

## Architecture
- State: Zustand stores at `src/stores/`
- Types: `src/types/`
- Hooks: `src/hooks/useTauri.ts`
- Pages: `src/pages/`
- Shell: `src/components/shell/` (WindowTitleBar, Sidebar, AppLayout)
- Rust: `src-tauri/src/` → main.rs, db/, commands/, models/
- DB file: `{app_data_dir}/berrie.db` (created on first launch)

## Last Changed
2026-08-23 — Phase 1 complete: router, stores, types, shell layout, SQLite schema, book seeding, Tauri commands
