import { desc } from 'drizzle-orm'
import { db } from '../db'
import { movies } from '../db/schema'

export async function listMovies() {
  const movieList = await db.query.movies.findMany({
    orderBy: [desc(movies.createdAt)],
  })

  return {
    movies: movieList,
  }
}
