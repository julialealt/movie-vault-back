import { db } from '../db'
import { movies } from '../db/schema'
import { logAction } from '../lib/dynamo'

interface CreateMovieRequest {
  title: string
  synopsis: string
  coverKey: string
  rating: number
}

export async function createMovie({
  title,
  synopsis,
  coverKey,
  rating,
}: CreateMovieRequest) {
  const result = await db
    .insert(movies)
    .values({
      title,
      synopsis,
      coverKey,
      rating,
    })
    .returning()

  const movie = result[0]

  await logAction('CREATE', movie.id, movie)

  return {
    movie,
  }
}
