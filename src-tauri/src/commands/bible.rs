use rusqlite::params;
use tauri::State;

use crate::db::Database;
use crate::models::{Book, Chapter, Verse};

#[tauri::command]
pub fn get_books(db: State<'_, Database>) -> Result<Vec<Book>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, name, abbreviation, category, type, history, chapter_count, book_order
             FROM books ORDER BY book_order",
        )
        .map_err(|e| e.to_string())?;

    let books = stmt
        .query_map([], |row| {
            Ok(Book {
                id: row.get(0)?,
                name: row.get(1)?,
                abbreviation: row.get(2)?,
                category: row.get(3)?,
                testament: row.get(4)?,
                history: row.get(5)?,
                chapter_count: row.get(6)?,
                book_order: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(books)
}

#[tauri::command]
pub fn get_chapters(db: State<'_, Database>, book_id: i64) -> Result<Vec<Chapter>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, book_id, number
             FROM chapters WHERE book_id = ?1 ORDER BY number",
        )
        .map_err(|e| e.to_string())?;

    let chapters = stmt
        .query_map(params![book_id], |row| {
            Ok(Chapter {
                id: row.get(0)?,
                book_id: row.get(1)?,
                number: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(chapters)
}

#[tauri::command]
pub fn get_verses(
    db: State<'_, Database>,
    chapter_id: i64,
    translation_id: i64,
) -> Result<Vec<Verse>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, chapter_id, translation_id, number, text
             FROM verses
             WHERE chapter_id = ?1 AND translation_id = ?2
             ORDER BY number",
        )
        .map_err(|e| e.to_string())?;

    let verses = stmt
        .query_map(params![chapter_id, translation_id], |row| {
            Ok(Verse {
                id: row.get(0)?,
                chapter_id: row.get(1)?,
                translation_id: row.get(2)?,
                number: row.get(3)?,
                text: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(verses)
}
