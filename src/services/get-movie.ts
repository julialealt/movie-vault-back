import { eq } from 'drizzle-orm'
import { db } from '../db'
import { movies } from '../db/schema'

interface GetMovieRequest {
  id: string
}

export async function getMovie({ id }: GetMovieRequest) {
  const movie = await db.query.movies.findFirst({
    where: eq(movies.id, id),
  })

  if (!movie) {
    throw new Error('Movie not found')
  }

  return {
    movie,
  }
}
