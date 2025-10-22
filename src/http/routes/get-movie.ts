import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { getMovie } from '../../services/get-movie'

export const getMovieRoute: FastifyPluginAsyncZod = async app => {
  app.get(
    '/movies/:movieId',
    {
      schema: {
        params: z.object({
          movieId: z.cuid2('Invalid movie ID format'),
        }),
        response: {
          200: z.object({
            movie: z.object({
              id: z.string(),
              title: z.string(),
              synopsis: z.string(),
              coverKey: z.string(),
              rating: z.number(),
              createdAt: z.date(),
            }),
          }),
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
        const { movie } = await getMovie({ id: movieId })

        return reply.status(200).send({ movie })
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
