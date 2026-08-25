use rusqlite::{Connection, Result};

struct BookSeed {
    name: &'static str,
    abbreviation: &'static str,
    category: &'static str,
    testament: &'static str,
    chapter_count: i64,
    book_order: i64,
}

const BOOKS: &[BookSeed] = &[
    // Old Testament — Law
    BookSeed { name: "Genesis",          abbreviation: "Gen", category: "Law",              testament: "OT", chapter_count: 50,  book_order: 1  },
    BookSeed { name: "Exodus",           abbreviation: "Exo", category: "Law",              testament: "OT", chapter_count: 40,  book_order: 2  },
    BookSeed { name: "Leviticus",        abbreviation: "Lev", category: "Law",              testament: "OT", chapter_count: 27,  book_order: 3  },
    BookSeed { name: "Numbers",          abbreviation: "Num", category: "Law",              testament: "OT", chapter_count: 36,  book_order: 4  },
    BookSeed { name: "Deuteronomy",      abbreviation: "Deu", category: "Law",              testament: "OT", chapter_count: 34,  book_order: 5  },
    // Old Testament — History
    BookSeed { name: "Joshua",           abbreviation: "Jos", category: "History",          testament: "OT", chapter_count: 24,  book_order: 6  },
    BookSeed { name: "Judges",           abbreviation: "Jdg", category: "History",          testament: "OT", chapter_count: 21,  book_order: 7  },
    BookSeed { name: "Ruth",             abbreviation: "Rut", category: "History",          testament: "OT", chapter_count: 4,   book_order: 8  },
    BookSeed { name: "1 Samuel",         abbreviation: "1Sa", category: "History",          testament: "OT", chapter_count: 31,  book_order: 9  },
    BookSeed { name: "2 Samuel",         abbreviation: "2Sa", category: "History",          testament: "OT", chapter_count: 24,  book_order: 10 },
    BookSeed { name: "1 Kings",          abbreviation: "1Ki", category: "History",          testament: "OT", chapter_count: 22,  book_order: 11 },
    BookSeed { name: "2 Kings",          abbreviation: "2Ki", category: "History",          testament: "OT", chapter_count: 25,  book_order: 12 },
    BookSeed { name: "1 Chronicles",     abbreviation: "1Ch", category: "History",          testament: "OT", chapter_count: 29,  book_order: 13 },
    BookSeed { name: "2 Chronicles",     abbreviation: "2Ch", category: "History",          testament: "OT", chapter_count: 36,  book_order: 14 },
    BookSeed { name: "Ezra",             abbreviation: "Ezr", category: "History",          testament: "OT", chapter_count: 10,  book_order: 15 },
    BookSeed { name: "Nehemiah",         abbreviation: "Neh", category: "History",          testament: "OT", chapter_count: 13,  book_order: 16 },
    BookSeed { name: "Esther",           abbreviation: "Est", category: "History",          testament: "OT", chapter_count: 10,  book_order: 17 },
    // Old Testament — Poetry & Wisdom
    BookSeed { name: "Job",              abbreviation: "Job", category: "Poetry & Wisdom",  testament: "OT", chapter_count: 42,  book_order: 18 },
    BookSeed { name: "Psalms",           abbreviation: "Psa", category: "Poetry & Wisdom",  testament: "OT", chapter_count: 150, book_order: 19 },
    BookSeed { name: "Proverbs",         abbreviation: "Pro", category: "Poetry & Wisdom",  testament: "OT", chapter_count: 31,  book_order: 20 },
    BookSeed { name: "Ecclesiastes",     abbreviation: "Ecc", category: "Poetry & Wisdom",  testament: "OT", chapter_count: 12,  book_order: 21 },
    BookSeed { name: "Song of Solomon",  abbreviation: "Son", category: "Poetry & Wisdom",  testament: "OT", chapter_count: 8,   book_order: 22 },
    // Old Testament — Major Prophets
    BookSeed { name: "Isaiah",           abbreviation: "Isa", category: "Major Prophets",   testament: "OT", chapter_count: 66,  book_order: 23 },
    BookSeed { name: "Jeremiah",         abbreviation: "Jer", category: "Major Prophets",   testament: "OT", chapter_count: 52,  book_order: 24 },
    BookSeed { name: "Lamentations",     abbreviation: "Lam", category: "Major Prophets",   testament: "OT", chapter_count: 5,   book_order: 25 },
    BookSeed { name: "Ezekiel",          abbreviation: "Eze", category: "Major Prophets",   testament: "OT", chapter_count: 48,  book_order: 26 },
    BookSeed { name: "Daniel",           abbreviation: "Dan", category: "Major Prophets",   testament: "OT", chapter_count: 12,  book_order: 27 },
    // Old Testament — Minor Prophets
    BookSeed { name: "Hosea",            abbreviation: "Hos", category: "Minor Prophets",   testament: "OT", chapter_count: 14,  book_order: 28 },
    BookSeed { name: "Joel",             abbreviation: "Joe", category: "Minor Prophets",   testament: "OT", chapter_count: 3,   book_order: 29 },
    BookSeed { name: "Amos",             abbreviation: "Amo", category: "Minor Prophets",   testament: "OT", chapter_count: 9,   book_order: 30 },
    BookSeed { name: "Obadiah",          abbreviation: "Oba", category: "Minor Prophets",   testament: "OT", chapter_count: 1,   book_order: 31 },
    BookSeed { name: "Jonah",            abbreviation: "Jon", category: "Minor Prophets",   testament: "OT", chapter_count: 4,   book_order: 32 },
    BookSeed { name: "Micah",            abbreviation: "Mic", category: "Minor Prophets",   testament: "OT", chapter_count: 7,   book_order: 33 },
    BookSeed { name: "Nahum",            abbreviation: "Nah", category: "Minor Prophets",   testament: "OT", chapter_count: 3,   book_order: 34 },
    BookSeed { name: "Habakkuk",         abbreviation: "Hab", category: "Minor Prophets",   testament: "OT", chapter_count: 3,   book_order: 35 },
    BookSeed { name: "Zephaniah",        abbreviation: "Zep", category: "Minor Prophets",   testament: "OT", chapter_count: 3,   book_order: 36 },
    BookSeed { name: "Haggai",           abbreviation: "Hag", category: "Minor Prophets",   testament: "OT", chapter_count: 2,   book_order: 37 },
    BookSeed { name: "Zechariah",        abbreviation: "Zec", category: "Minor Prophets",   testament: "OT", chapter_count: 14,  book_order: 38 },
    BookSeed { name: "Malachi",          abbreviation: "Mal", category: "Minor Prophets",   testament: "OT", chapter_count: 4,   book_order: 39 },
    // New Testament — Gospels
    BookSeed { name: "Matthew",          abbreviation: "Mat", category: "Gospels",          testament: "NT", chapter_count: 28,  book_order: 40 },
    BookSeed { name: "Mark",             abbreviation: "Mar", category: "Gospels",          testament: "NT", chapter_count: 16,  book_order: 41 },
    BookSeed { name: "Luke",             abbreviation: "Luk", category: "Gospels",          testament: "NT", chapter_count: 24,  book_order: 42 },
    BookSeed { name: "John",             abbreviation: "Joh", category: "Gospels",          testament: "NT", chapter_count: 21,  book_order: 43 },
    // New Testament — Acts
    BookSeed { name: "Acts",             abbreviation: "Act", category: "Acts",             testament: "NT", chapter_count: 28,  book_order: 44 },
    // New Testament — Pauline Epistles
    BookSeed { name: "Romans",           abbreviation: "Rom", category: "Pauline Epistles", testament: "NT", chapter_count: 16,  book_order: 45 },
    BookSeed { name: "1 Corinthians",    abbreviation: "1Co", category: "Pauline Epistles", testament: "NT", chapter_count: 16,  book_order: 46 },
    BookSeed { name: "2 Corinthians",    abbreviation: "2Co", category: "Pauline Epistles", testament: "NT", chapter_count: 13,  book_order: 47 },
    BookSeed { name: "Galatians",        abbreviation: "Gal", category: "Pauline Epistles", testament: "NT", chapter_count: 6,   book_order: 48 },
    BookSeed { name: "Ephesians",        abbreviation: "Eph", category: "Pauline Epistles", testament: "NT", chapter_count: 6,   book_order: 49 },
    BookSeed { name: "Philippians",      abbreviation: "Phi", category: "Pauline Epistles", testament: "NT", chapter_count: 4,   book_order: 50 },
    BookSeed { name: "Colossians",       abbreviation: "Col", category: "Pauline Epistles", testament: "NT", chapter_count: 4,   book_order: 51 },
    BookSeed { name: "1 Thessalonians",  abbreviation: "1Th", category: "Pauline Epistles", testament: "NT", chapter_count: 5,   book_order: 52 },
    BookSeed { name: "2 Thessalonians",  abbreviation: "2Th", category: "Pauline Epistles", testament: "NT", chapter_count: 3,   book_order: 53 },
    BookSeed { name: "1 Timothy",        abbreviation: "1Ti", category: "Pauline Epistles", testament: "NT", chapter_count: 6,   book_order: 54 },
    BookSeed { name: "2 Timothy",        abbreviation: "2Ti", category: "Pauline Epistles", testament: "NT", chapter_count: 4,   book_order: 55 },
    BookSeed { name: "Titus",            abbreviation: "Tit", category: "Pauline Epistles", testament: "NT", chapter_count: 3,   book_order: 56 },
    BookSeed { name: "Philemon",         abbreviation: "Phm", category: "Pauline Epistles", testament: "NT", chapter_count: 1,   book_order: 57 },
    // New Testament — General Epistles
    BookSeed { name: "Hebrews",          abbreviation: "Heb", category: "General Epistles", testament: "NT", chapter_count: 13,  book_order: 58 },
    BookSeed { name: "James",            abbreviation: "Jas", category: "General Epistles", testament: "NT", chapter_count: 5,   book_order: 59 },
    BookSeed { name: "1 Peter",          abbreviation: "1Pe", category: "General Epistles", testament: "NT", chapter_count: 5,   book_order: 60 },
    BookSeed { name: "2 Peter",          abbreviation: "2Pe", category: "General Epistles", testament: "NT", chapter_count: 3,   book_order: 61 },
    BookSeed { name: "1 John",           abbreviation: "1Jo", category: "General Epistles", testament: "NT", chapter_count: 5,   book_order: 62 },
    BookSeed { name: "2 John",           abbreviation: "2Jo", category: "General Epistles", testament: "NT", chapter_count: 1,   book_order: 63 },
    BookSeed { name: "3 John",           abbreviation: "3Jo", category: "General Epistles", testament: "NT", chapter_count: 1,   book_order: 64 },
    BookSeed { name: "Jude",             abbreviation: "Jud", category: "General Epistles", testament: "NT", chapter_count: 1,   book_order: 65 },
    // New Testament — Prophecy
    BookSeed { name: "Revelation",       abbreviation: "Rev", category: "Prophecy",         testament: "NT", chapter_count: 22,  book_order: 66 },
];

pub fn seed_books(conn: &Connection) -> Result<()> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM books",
        [],
        |row| row.get(0),
    )?;

    if count > 0 {
        return Ok(());
    }

    let mut stmt = conn.prepare(
        "INSERT INTO books (name, abbreviation, category, type, chapter_count, book_order)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    )?;

    for book in BOOKS {
        stmt.execute(rusqlite::params![
            book.name,
            book.abbreviation,
            book.category,
            book.testament,
            book.chapter_count,
            book.book_order,
        ])?;
    }

    Ok(())
}

pub fn run(conn: &Connection) -> Result<()> {
    seed_books(conn)?;
    Ok(())
}
