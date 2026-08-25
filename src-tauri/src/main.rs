// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod models;

use db::Database;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()
                .expect("Failed to resolve app data directory");

            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data directory");

            let db_path = app_data_dir.join("berrie.db");
            let conn = db::open(&db_path)
                .expect("Failed to open database");

            app.manage(Database(std::sync::Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::bible::get_books,
            commands::bible::get_chapters,
            commands::bible::get_verses,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
