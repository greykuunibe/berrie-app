# Architectural & Code Quality Audit — Berrie App

---

## 1. Executive Summary

Berrie is a Tauri v2 + Vite/React/TypeScript Bible app that is architecturally split between two data systems that do not talk to each other: a local Rust/SQLite backend (scaffolded but largely inactive) and a cloud Supabase JS client that handles everything the app actually does. This split creates the core structural tension behind all three pain points you listed.

**Structural health: Yellow-Red.** The frontend code is clean and well-organized. The Zustand stores are well-shaped. The component architecture (after recent refactoring) is flat and maintainable. But beneath that: the Rust backend is essentially dead code for the current app, the "local-first" feature is a UI stub with no implementation, two bugs make features silently non-functional, and there are no network guards — any Supabase outage or slow connection produces permanent loading spinners with no recovery path.

Primary bottlenecks in priority order:
1. Silent logic bugs in state (reorder, never-cleared dedup cache)
2. Unregistered Tauri command crashing desktop search
3. No timeout/retry on any network call
4. Completely absent offline layer despite full SQLite schema existing in Rust
5. Optimistic mutations with no rollback on failure

---

## 2. What Is Working Well

**Zustand store architecture** — Each domain (bible, notes, resources, annotations, tabs, UI, search) has a dedicated store with a clean interface. The separation is correct. Guard patterns (`if (get().isLoadingBooks) return`) prevent duplicate concurrent fetches in most stores.

**Annotation optimistic updates** (`annotation.store.ts:96–117`) — Highlights and reactions apply locally before the Supabase round-trip, so the UI feels instant. The pattern is sound; it just lacks rollback on failure.

**Commentary prefetching** (`Reader.tsx:88–97`) — Adjacent chapter commentary is prefetched before the user scrolls there. Cross-refs follow the same pattern after the recent refactor. This is the right local-first instinct applied correctly within the frontend.

**Verse cache** (`bible.service.ts:6–11`) — Module-level `Map` cache keyed by `translationId:chapterId` prevents redundant Supabase verse fetches within a session.

**Tab persistence** (`tabs.store.ts` + `zustand/persist`) — Tab state survives reloads. The `merge` function correctly re-hydrates default tabs even when stored state is present.

**WAL + foreign keys** (`db/schema.rs:5–6`) — SQLite is configured with `PRAGMA journal_mode=WAL` and `PRAGMA foreign_keys=ON`. This is the correct starting configuration for a desktop SQLite database.

**FTS5 virtual tables** (`db/schema.rs:127–129`) — Both `verses_fts` and `notes_fts` virtual tables are defined. This is the correct foundation for offline full-text search.

**ErrorBoundary at root** (`App.tsx:49–51`) — Unhandled render errors are caught. The router also has `errorElement: <RouteError />` on every route.

---

## 3. Critical Findings & Flaws

### A. State Management

---

#### CRITICAL — Shadow variable bug: reorderBlocks never works

**File:** `src/stores/notes.store.ts:148–153`

```typescript
// BEFORE (broken — `b` in the find callback shadows the outer `b`)
const ordered = [...get().blocks].sort((a, b) => {
  const posA = blocks.find((b) => b.id === a.id)?.position ?? a.position;
  const posB = blocks.find((b) => b.id === b.id)?.position ?? b.position;
  //                                        ^^^^^^^^^^^^^^^
  //                 `b.id === b.id` is ALWAYS true — finds first element, not b's entry
  return posA - posB;
});
```

`b` in `blocks.find((b) => ...)` shadows the outer sort parameter `b`. The expression `b.id === b.id` is a tautology — it always returns `true`, so `posB` is always the position of the first element in the `blocks` array. Drag-to-reorder is permanently broken.

```typescript
// AFTER
const ordered = [...get().blocks].sort((a, b) => {
  const posA = blocks.find((bb) => bb.id === a.id)?.position ?? a.position;
  const posB = blocks.find((bb) => bb.id === b.id)?.position ?? b.position;
  return posA - posB;
});
```

---

#### HIGH — `loadTranslations` has no concurrent call guard

**Files:** `src/stores/bible.store.ts:86–95`, `src/hooks/useBible.ts:12–14`

```typescript
// BEFORE — bible.store.ts (no guard)
loadTranslations: async () => {
  try {
    const translations = await fetchTranslations();
    ...
  }
}

// BEFORE — useBible.ts (no guard — fires on every hook mount)
if (store.translations.length === 0) {
  store.loadTranslations();  // no isLoadingTranslations check
}
```

When multiple components mount simultaneously, `loadTranslations` fires multiple concurrent Supabase calls. Each resolves and overwrites the previous result, wasting bandwidth.

```typescript
// AFTER — bible.store.ts: add isLoadingTranslations state and guard
isLoadingTranslations: false,

loadTranslations: async () => {
  if (get().isLoadingTranslations || get().translations.length > 0) return;
  set({ isLoadingTranslations: true });
  try {
    const translations = await fetchTranslations();
    const activeTranslation =
      translations.find((t) => t.abbreviation === "KJV") ?? translations[0] ?? null;
    set({ translations, activeTranslation, isLoadingTranslations: false });
  } catch (err) {
    set({ error: (err as Error).message, isLoadingTranslations: false });
  }
},
```

---

#### MEDIUM — `loadChapters` and `loadVerses` clear their arrays on fetch start, causing flash of empty state

**File:** `src/stores/bible.store.ts:65, 77`

```typescript
// BEFORE — clears chapters immediately, causing blank render during fetch
loadChapters: async (bookId: number) => {
  set({ isLoadingChapters: true, error: null, chapters: [] }); // ← clears immediately
  ...
},
```

```typescript
// AFTER — keep stale data visible until new data arrives
loadChapters: async (bookId: number) => {
  set({ isLoadingChapters: true, error: null }); // do NOT clear chapters yet
  try {
    const chapters = await fetchChapters(bookId);
    set({ chapters, isLoadingChapters: false });
  } catch (err) {
    set({ error: (err as Error).message, isLoadingChapters: false });
  }
},
```

---

#### MEDIUM — Annotation dedup cache never invalidates within a session

**File:** `src/stores/annotation.store.ts` (module level)

```typescript
// BEFORE — module-scope Set, never cleared, data goes stale within a session
const _loadedChapters = new Set<string>();

loadChapter: async (bookId, chapterNumber) => {
  const key = `${bookId}:${chapterNumber}`;
  if (_loadedChapters.has(key)) return;
  _loadedChapters.add(key);
  ...
}
```

Once a chapter's annotations are fetched, they are never refreshed for the lifetime of the JS module. If the user adds a highlight on device A while device B has the same chapter open, device B will never see it until a restart.

```typescript
// AFTER — add 5-min TTL
const _loadedChapters = new Map<string, number>(); // key → timestamp

loadChapter: async (bookId, chapterNumber) => {
  const key = `${bookId}:${chapterNumber}`;
  const last = _loadedChapters.get(key) ?? 0;
  if (Date.now() - last < 5 * 60 * 1000) return; // 5-min TTL
  _loadedChapters.set(key, Date.now());
  ...
}
```

---

#### LOW — setState called during render in Launcher

**File:** `src/App.tsx:13–15`

```typescript
// BEFORE — calling setDestination in the render body (not in useEffect)
function Launcher() {
  const [destination, setDestination] = useState<string | null>(null);
  if (!destination) {
    setDestination("/app"); // ← state update during render
  }
  if (!destination) return null;
  return <Navigate to={destination} replace />;
}
```

```typescript
// AFTER — no state needed
function Launcher() {
  return <Navigate to="/app" replace />;
}
```

---

### B. Network & Async Handling

---

#### CRITICAL — No timeout on any Supabase or IPC call — infinite loading states

Every service function (`fetchBooks`, `fetchCommentaryForChapter`, `fetchAnnotationsForChapter`, etc.) delegates directly to the Supabase client with no timeout. If Supabase is slow or unreachable, `isLoading*` flags never flip back to `false` — loading spinners are permanent with no error state set.

```typescript
// AFTER — add withTimeout helper to src/lib/supabase.ts
export async function withTimeout<T>(promise: Promise<T>, ms = 10_000): Promise<T> {
  const timer = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out")), ms)
  );
  return Promise.race([promise, timer]);
}

// Usage in every service call:
const { data, error } = await withTimeout(
  supabase.from("commentary_entries").select("*").eq("chapter_id", chapterId),
  10_000
);
```

---

#### CRITICAL — Optimistic annotation mutations not rolled back on Supabase failure

**File:** `src/stores/annotation.store.ts:96–116`

```typescript
// BEFORE — optimistic add with no rollback; phantom highlight stays on failure
addHighlight: async (bookId, chapter, verse, start, end, color) => {
  const k = verseKey(bookId, chapter, verse);
  set(state => { /* optimistic update */ });
  const saved = await insertHighlight(...);
  if (saved) { /* patch dbId */ }
  // ← no else: failure ignored, highlight shows in UI but isn't in DB
},
```

```typescript
// AFTER — snapshot + rollback
addHighlight: async (bookId, chapter, verse, start, end, color) => {
  const k = verseKey(bookId, chapter, verse);
  const snapshot = get().highlights[k] ?? [];
  set(state => {
    const existing = (state.highlights[k] ?? []).filter(h => h.end <= start || h.start >= end);
    return { highlights: { ...state.highlights, [k]: [...existing, { start, end, color }] } };
  });
  const saved = await insertHighlight(bookId, chapter, verse, start, end, color);
  if (!saved) {
    set(state => ({ highlights: { ...state.highlights, [k]: snapshot } }));
    return;
  }
  set(state => ({
    highlights: {
      ...state.highlights,
      [k]: (state.highlights[k] ?? []).map(h =>
        h.start === start && h.end === end && h.color === color && !h.dbId
          ? { ...h, dbId: saved.id }
          : h,
      ),
    },
  }));
},
```

---

#### HIGH — Verse cache is unbounded and never expires

**File:** `src/lib/bible.service.ts:6–11`

```typescript
// BEFORE — grows forever, never evicted
const verseCache = new Map<string, Verse[]>();
```

Reading the entire Bible in one session with 5 translations would cache all 155,510 verse strings indefinitely.

```typescript
// AFTER — evict oldest entry when cap is reached
const MAX_CACHE_ENTRIES = 200;
const verseCache = new Map<string, Verse[]>();

// After caching a new result in fetchVerses:
if (verseCache.size > MAX_CACHE_ENTRIES) {
  const firstKey = verseCache.keys().next().value;
  if (firstKey) verseCache.delete(firstKey);
}
```

---

### C. Tauri / Rust Backend

---

#### CRITICAL — `full_text_search` is invoked but not registered

**File:** `src/hooks/useTauri.ts:22`

`invoke("full_text_search", { query })` is called, but `src-tauri/src/commands/mod.rs` only registers `get_books`, `get_chapters`, `get_verses`. On desktop, any search call throws a Tauri IPC error: `"command not found: full_text_search"`.

The FTS5 `verses_fts` virtual table exists in the schema — the command just needs to be implemented and registered:

```rust
// src-tauri/src/commands/search.rs
#[tauri::command]
pub fn full_text_search(
    db: State<'_, Database>,
    query: String,
) -> Result<Vec<VerseSearchResult>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT v.id, b.name, b.id, c.number, v.number, v.text
         FROM verses_fts f
         JOIN verses v ON v.rowid = f.rowid
         JOIN chapters c ON c.id = v.chapter_id
         JOIN books b ON b.id = c.book_id
         WHERE verses_fts MATCH ?1 LIMIT 30"
    ).map_err(|e| e.to_string())?;
    // ... collect and return results
}

// main.rs — add to invoke_handler
commands::search::full_text_search,
```

---

#### HIGH — All Tauri commands are synchronous, blocking the thread pool

**File:** `src-tauri/src/commands/bible.rs:8, 39, 64`

```rust
// BEFORE — synchronous; std::sync::Mutex means one DB query at a time
#[tauri::command]
pub fn get_books(db: State<'_, Database>) -> Result<Vec<Book>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    ...
}
```

```rust
// AFTER — async with tokio-rusqlite for non-blocking queries
#[tauri::command]
pub async fn get_books(db: State<'_, Database>) -> Result<Vec<Book>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    ...
}
```

---

#### HIGH — Dual schema with no reconciliation: SQLite mirrors Supabase but is never used

The Rust SQLite schema defines tables for `verses`, `translations`, `commentaries`, `commentary_entries`, `lexicons`, `cross_references`, and `notes` — a full mirror of Supabase. The frontend fetches everything from Supabase exclusively. `useTauri.ts` provides `getBooks`, `getChapters`, `getVerses` IPC wrappers that `useBible.ts` never calls.

**Result:** The local DB is completely unused for app functionality. Every app launch opens SQLite, runs `CREATE TABLE IF NOT EXISTS` for 13 tables, migrates, seeds 66 books — then the frontend ignores all of it. This is the root cause of zero offline capability.

---

#### MEDIUM — DB seed runs on every app launch with no version guard

**File:** `src-tauri/src/db/mod.rs:13`

```rust
// BEFORE — seed::run fires unconditionally on every cold start
pub fn open(db_path: &Path) -> Result<Connection> {
    let conn = Connection::open(db_path)?;
    schema::create_tables(&conn)?;
    migrate(&conn)?;
    seed::run(&conn)?;
    Ok(conn)
}
```

```rust
// AFTER — guard against re-seeding
fn needs_seed(conn: &Connection) -> bool {
    conn.query_row(
        "SELECT COUNT(*) FROM books",
        [],
        |row| row.get::<_, i64>(0),
    ).unwrap_or(0) == 0
}

pub fn open(db_path: &Path) -> Result<Connection> {
    let conn = Connection::open(db_path)?;
    schema::create_tables(&conn)?;
    migrate(&conn)?;
    if needs_seed(&conn) { seed::run(&conn)?; }
    Ok(conn)
}
```

---

#### MEDIUM — Migration has no version tracking, silently swallows errors

**File:** `src-tauri/src/db/mod.rs:17–21`

```rust
// BEFORE — no version table; always returns Ok regardless of failure
fn migrate(conn: &Connection) -> Result<()> {
    let _ = conn.execute_batch(
        "ALTER TABLE books ADD COLUMN book_order INTEGER NOT NULL DEFAULT 0;"
    );
    Ok(())
}
```

Add a `schema_version` table and gate each migration on its version number so future schema changes can be applied exactly once.

---

### D. Persistence & Local-First

---

#### HIGH — `downloadResource` / `downloadTranslation` are UI stubs — nothing is downloaded

**File:** `src/stores/resources.store.ts:186–193`

```typescript
// BEFORE — only writes to localStorage; no file, no SQLite, no network request
downloadResource: (id) =>
  set(state => ({
    localResourceIds: state.localResourceIds.includes(id)
      ? state.localResourceIds
      : [...state.localResourceIds, id],
  })),
```

The "Download" button in `ResourceCard` calls this. A user who clicks Download sees the "Downloaded" badge but gets nothing stored locally. The feature is entirely cosmetic.

---

## 4. Local-First Architecture Recommendation

The target architecture has all structural pieces in place — they need to be connected:

```
User clicks "Download Translation"
        │
        ▼
Frontend: invoke("download_translation", { translationId })
        │
        ▼
Rust (tokio async task):
  1. Check if already downloaded (query local SQLite)
  2. Fetch all verses from Supabase REST API using reqwest
     (stream response — do NOT load 31k verses into memory at once)
  3. INSERT into local SQLite verses table in batches of 500
  4. Emit progress: app_handle.emit("download_progress", { pct })
  5. On complete: emit("download_complete", { translationId })
        │
        ▼
Frontend: listen("download_progress") → update progress bar
          listen("download_complete") → mark translation as local
        │
        ▼
bible.service.ts — single data source selector:
  isTauri() && isTranslationLocal(translationId)
    ? invoke("get_verses", { chapterId, translationId })   // local SQLite (instant)
    : supabase.from("verses").select(...)                   // cloud fallback
```

**Key rules:**

1. **Rust does all downloading** — `reqwest` + `tokio` in an `async` command, streaming to SQLite in batches with one transaction per batch.
2. **Frontend listens, never blocks** — progress via Tauri `app_handle.emit()`, consumed with `listen()` in a `useEffect` that returns `unlisten` as cleanup.
3. **`bible.service.ts` is the decision point** — one function, one interface, selects source based on `isTauri() && isLocal`. The rest of the app is unaware of the source.
4. **Annotations remain cloud-synced** — highlights/notes go to Supabase immediately. If offline, queue them in a local `pending_sync` SQLite table and flush on reconnect.
5. **Never block UI on network** — serve local data instantly, refresh cloud data in background, merge without disrupting scroll position.

---

## 5. Step-by-Step Remediation Plan

### Priority 1 — Fix silent bugs breaking existing features (< 1 day)

1. **`src/stores/notes.store.ts:150`** — Fix shadow variable in `reorderBlocks`. Change `blocks.find((b) =>` to `blocks.find((bb) =>` in both the `posA` and `posB` lines. Drag-to-reorder in Notes is currently permanently broken.

2. **`src/App.tsx:13–15`** — Replace the `Launcher` component with `return <Navigate to="/app" replace />`. Remove the `useState` and the render-time `setDestination` call.

3. **`src/hooks/useTauri.ts:22`** — Either implement and register `full_text_search` in Rust (recommended — the FTS5 table already exists), or remove the `invoke` call and guard the search code path in desktop mode to prevent the runtime crash.

### Priority 2 — Prevent infinite loading states (< 2 days)

4. **Add `withTimeout` wrapper** to `src/lib/supabase.ts`. Apply it to every Supabase call across all service files. Wire timeout errors into each store's `error` field so every `isLoading*` flag can always terminate.

5. **Add `isLoadingTranslations` guard** to `bible.store.ts:loadTranslations`. Match the pattern already used by `loadBooks`.

6. **Remove premature array clearing** from `loadChapters` and `loadVerses` in `bible.store.ts`. Delete `chapters: []` and `verses: []` from the `set({ isLoading: true })` calls to eliminate empty-state flashes.

### Priority 3 — Fix data integrity (< 2 days)

7. **Add rollback to all annotation optimistic updates** in `annotation.store.ts` — capture a snapshot before the optimistic `set`, restore it if the Supabase insert returns `null`.

8. **Add TTL to `_loadedChapters`** — replace `Set<string>` with `Map<string, number>` (key → timestamp), treat entries older than 5 minutes as stale so cross-device annotation changes become visible.

9. **Add LRU eviction to `verseCache`** in `bible.service.ts` — cap at 200 entries, evict the oldest when the limit is exceeded.

### Priority 4 — Activate the local layer (1–2 weeks)

10. **Bridge `bible.service.ts` to use Tauri IPC when local data exists** — `isTauri() && isTranslationLocal(id) ? invoke("get_verses", ...) : supabase...`. One-function change that immediately enables offline reading for downloaded translations.

11. **Implement the download pipeline in Rust** — `async fn download_translation` command using `reqwest` to stream verses from Supabase REST into SQLite in batches, emitting `download_progress` events.

12. **Wire frontend download progress** — `useEffect` with `await listen("download_progress", handler)`, store the returned `unlisten` function and call it in the cleanup return. Update `resources.store.ts:downloadResource` to call `invoke` instead of being a localStorage stub.

13. **Add a `pending_sync` SQLite table** for offline annotation writes — queue `insertHighlight`/`insertNote` locally when offline, flush to Supabase via a `sync_pending` Tauri command on reconnect.

14. **Migrate Rust commands to `async`** — add `tokio-rusqlite` to `Cargo.toml`, convert `std::sync::Mutex<Connection>` to an async-aware connection pool, convert all `pub fn` commands to `pub async fn`.

15. **Add schema version tracking** — create a `schema_version` table in `db/schema.rs`, gate `seed::run` on an empty books table, gate all future migrations on version numbers instead of silently swallowing `ALTER TABLE` errors.
