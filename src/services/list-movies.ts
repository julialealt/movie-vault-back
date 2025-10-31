import { desc } from 'drizzle-orm'
import { db } from '../db'
import { movies } from '../db/schema'
import { logAction } from '../lib/dynamo'

export async function listMovies() {
  const movieList = await db.query.movies.findMany({
    orderBy: [desc(movies.createdAt)],
  })

  await logAction('READ', null, {
    operation: 'listAll',
    count: movieList.length,
  })

  return {
    movies: movieList,
  }
}
