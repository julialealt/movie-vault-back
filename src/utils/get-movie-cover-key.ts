import { eq } from 'drizzle-orm'
import { db } from '../db'
import { movies } from '../db/schema'

export async function getMovieCoverKey(
  movieId: string
): Promise<string | null> {
  const movie = await db.query.movies.findFirst({
    where: eq(movies.id, movieId),
    columns: { coverKey: true },
  })
  return movie?.coverKey || null
}
