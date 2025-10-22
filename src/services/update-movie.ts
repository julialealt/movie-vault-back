import { eq } from 'drizzle-orm'
import { db } from '../db'
import { movies } from '../db/schema'

interface UpdateMovieRequest {
  id: string
  title?: string
  synopsis?: string
  coverKey?: string
  rating?: number
}

export async function updateMovie({
  id,
  title,
  synopsis,
  coverKey,
  rating,
}: UpdateMovieRequest) {
  const valuesToUpdate: Partial<typeof movies.$inferInsert> = {}
  if (title !== undefined) valuesToUpdate.title = title
  if (synopsis !== undefined) valuesToUpdate.synopsis = synopsis
  if (coverKey !== undefined) valuesToUpdate.coverKey = coverKey
  if (rating !== undefined) valuesToUpdate.rating = rating

  if (Object.keys(valuesToUpdate).length === 0) {
    const currentMovie = await db.query.movies.findFirst({
      where: eq(movies.id, id),
    })
    if (!currentMovie) {
      throw new Error('Movie not found')
    }
    return { movie: currentMovie }
  }

  const result = await db
    .update(movies)
    .set(valuesToUpdate)
    .where(eq(movies.id, id))
    .returning()

  if (result.length === 0) {
    throw new Error('Movie not found')
  }

  const updatedMovie = result[0]

  return {
    movie: updatedMovie,
  }
}
