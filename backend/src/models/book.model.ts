import pool from "../config/db.js";

export interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  year: number | null;
  stock: number;
}

interface BookFilters {
  search?: string | undefined;
  page: number;
  limit: number;
}

export async function getAllBooks({ search, page, limit }: BookFilters) {
  let where = "";
  const values: string[] = [];

  if (search) {
    where = "WHERE title ILIKE $1 OR author ILIKE $1";
    values.push(`%${search}%`);
  }

  const offset = (page - 1) * limit;
  const countResult = await pool.query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM books ${where}`,
    values,
  );
  const result = await pool.query<Book>(
    `SELECT id, title, author, category, year, stock FROM books ${where}
     ORDER BY title, id
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset],
  );

  return { rows: result.rows, total: countResult.rows[0]?.total ?? 0 };
}

export async function getBookById(id: number) {
  const result = await pool.query<Book>(
    "SELECT id, title, author, category, year, stock FROM books WHERE id = $1",
    [id],
  );
  return result.rows[0] ?? null;
}

export async function insertBook(
  book: Omit<Book, "id" | "year"> & { year?: number | undefined },
) {
  const result = await pool.query<Book>(
    `INSERT INTO books (title, author, category, year, stock)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, author, category, year, stock`,
    [book.title, book.author, book.category, book.year ?? null, book.stock],
  );
  return result.rows[0];
}
