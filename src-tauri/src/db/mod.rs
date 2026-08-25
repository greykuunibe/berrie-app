pub mod schema;
pub mod seed;

use rusqlite::{Connection, Result};
use std::path::Path;

pub struct Database(pub std::sync::Mutex<Connection>);

pub fn open(db_path: &Path) -> Result<Connection> {
    let conn = Connection::open(db_path)?;
    schema::create_tables(&conn)?;
    migrate(&conn)?;
    seed::run(&conn)?;
    Ok(conn)
}

fn migrate(conn: &Connection) -> Result<()> {
    // Add book_order column to existing databases that don't have it
    let _ = conn.execute_batch("ALTER TABLE books ADD COLUMN book_order INTEGER NOT NULL DEFAULT 0;");
    Ok(())
}
