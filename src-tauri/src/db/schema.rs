use rusqlite::{Connection, Result};

pub fn create_tables(conn: &Connection) -> Result<()> {
    conn.execute_batch("
        PRAGMA journal_mode=WAL;
        PRAGMA foreign_keys=ON;

        CREATE TABLE IF NOT EXISTS translations (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            abbreviation TEXT NOT NULL,
            source      TEXT NOT NULL DEFAULT '',
            licensing   TEXT NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS books (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            name          TEXT NOT NULL,
            abbreviation  TEXT NOT NULL,
            category      TEXT NOT NULL,
            type          TEXT NOT NULL,
            history       TEXT,
            chapter_count INTEGER NOT NULL DEFAULT 0,
            book_order    INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS chapters (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id     INTEGER NOT NULL REFERENCES books(id),
            number      INTEGER NOT NULL,
            verse_count INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS verses (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            chapter_id     INTEGER NOT NULL REFERENCES chapters(id),
            translation_id INTEGER NOT NULL REFERENCES translations(id),
            number         INTEGER NOT NULL,
            text           TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS resources (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            name          TEXT NOT NULL,
            type          TEXT NOT NULL,
            licensing     TEXT NOT NULL DEFAULT '',
            language      TEXT NOT NULL DEFAULT 'en',
            is_downloaded INTEGER NOT NULL DEFAULT 0,
            is_selected   INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS commentaries (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            resource_id INTEGER NOT NULL REFERENCES resources(id),
            name        TEXT NOT NULL,
            language    TEXT NOT NULL DEFAULT 'en',
            licensing   TEXT NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS commentary_entries (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            commentary_id INTEGER NOT NULL REFERENCES commentaries(id),
            book_id       INTEGER REFERENCES books(id),
            chapter_id    INTEGER REFERENCES chapters(id),
            verse_id      INTEGER REFERENCES verses(id),
            content       TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS lexicons (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            resource_id    INTEGER NOT NULL REFERENCES resources(id),
            word           TEXT NOT NULL,
            meaning        TEXT NOT NULL,
            strongs_number TEXT NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS lexicon_verse_refs (
            lexicon_id INTEGER NOT NULL REFERENCES lexicons(id),
            verse_id   INTEGER NOT NULL REFERENCES verses(id),
            PRIMARY KEY (lexicon_id, verse_id)
        );

        CREATE TABLE IF NOT EXISTS cross_references (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            from_verse_id  INTEGER NOT NULL REFERENCES verses(id),
            to_verse_id    INTEGER NOT NULL REFERENCES verses(id)
        );

        CREATE TABLE IF NOT EXISTS notes (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            title      TEXT NOT NULL DEFAULT 'Untitled',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS note_blocks (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            note_id  INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
            type     TEXT NOT NULL DEFAULT 'text',
            content  TEXT NOT NULL DEFAULT '',
            position INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS files (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT NOT NULL,
            type       TEXT NOT NULL,
            size       INTEGER NOT NULL DEFAULT 0,
            path       TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS user (
            id                     INTEGER PRIMARY KEY DEFAULT 1,
            email                  TEXT,
            full_name              TEXT,
            language               TEXT NOT NULL DEFAULT 'en',
            spell_checker_language TEXT NOT NULL DEFAULT 'en',
            default_translation_id INTEGER REFERENCES translations(id),
            text_size              TEXT NOT NULL DEFAULT 'md',
            line_spacing           TEXT NOT NULL DEFAULT 'normal',
            paragraphs             TEXT NOT NULL DEFAULT 'verses',
            created_at             TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at             TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE VIRTUAL TABLE IF NOT EXISTS verses_fts
            USING fts5(text, content='verses', content_rowid='id');

        CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts
            USING fts5(title, content='notes', content_rowid='id');

        CREATE INDEX IF NOT EXISTS idx_verses_chapter ON verses(chapter_id);
        CREATE INDEX IF NOT EXISTS idx_chapters_book ON chapters(book_id);
        CREATE INDEX IF NOT EXISTS idx_note_blocks_note ON note_blocks(note_id, position);
    ")?;

    Ok(())
}
