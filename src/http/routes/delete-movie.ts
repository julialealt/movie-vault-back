import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { deleteFromS3 } from '../../lib/s3'
import { deleteMovie } from '../../services/delete-movie'

export const deleteMovieRoute: FastifyPluginAsyncZod = async app => {
  app.delete(
    '/movies/:movieId',
    {
      schema: {
        params: z.object({
          movieId: z.cuid2('Invalid movie ID format'),
        }),
        response: {
          204: z.null(),
          404: z.object({
            message: z.string(),
          }),
          500: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { movieId } = request.params

      try {
        const { deletedCoverKey } = await deleteMovie({ id: movieId })

        if (deletedCoverKey) {
          console.log(`Deleting cover key from S3: ${deletedCoverKey}`)
          await deleteFromS3(deletedCoverKey)
        }

        return reply.status(204).send()
      } catch (error) {
        console.error(error)

        if (error instanceof Error && error.message === 'Movie not found') {
          return reply.status(404).send({ message: 'Movie not found.' })
        }

        return reply.status(500).send({ message: 'Internal server error.' })
      }
    }
  )
}
