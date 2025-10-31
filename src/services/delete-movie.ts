import { eq } from 'drizzle-orm'
import { db } from '../db'
import { movies } from '../db/schema'
import { logAction } from '../lib/dynamo'

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

  await logAction('DELETE', id, movieToDelete)

  return {
    deletedCoverKey: movieToDelete.coverKey,
  }
}
