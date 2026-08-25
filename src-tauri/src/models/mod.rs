use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Translation {
    pub id: i64,
    pub abbreviation: String,
    pub title: String,
    pub language: String,
    pub license: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Book {
    pub id: i64,
    pub name: String,
    pub abbreviation: String,
    pub category: String,
    pub testament: String,
    pub history: Option<String>,
    pub book_order: i64,
    pub chapter_count: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Chapter {
    pub id: i64,
    pub book_id: i64,
    pub number: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Verse {
    pub id: i64,
    pub chapter_id: i64,
    pub translation_id: i64,
    pub number: i64,
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Note {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub is_deleted: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NoteBlock {
    pub id: String,
    pub note_id: String,
    pub block_type: String,
    pub content: String,
    pub position: i64,
}
