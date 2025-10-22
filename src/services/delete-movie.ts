import { eq } from 'drizzle-orm'
import { db } from '../db'
import { movies } from '../db/schema'

interface DeleteMovieRequest {
  id: string
}

export async function deleteMovie({ id }: DeleteMovieRequest) {
  const movieToDelete = await db.query.movies.findFirst({
    where: eq(movies.id, id),
    columns: {
      coverKey: true,
    },
  })

  if (!movieToDelete) {
    throw new Error('Movie not found')
  }

  await db.delete(movies).where(eq(movies.id, id))

  return {
    deletedCoverKey: movieToDelete.coverKey,
  }
}
