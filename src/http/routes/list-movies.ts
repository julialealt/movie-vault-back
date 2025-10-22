import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { listMovies } from '../../services/list-movies'

export const listMoviesRoute: FastifyPluginAsyncZod = async app => {
  app.get(
    '/movies',
    {
      schema: {
        response: {
          200: z.object({
            movies: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                synopsis: z.string(),
                coverKey: z.string(),
                rating: z.number(),
                createdAt: z.date(),
              })
            ),
          }),
          500: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (_, reply) => {
      try {
        const { movies } = await listMovies()

        return reply.status(200).send({ movies })
      } catch (error) {
        console.error(error)

        return reply.status(500).send({ message: 'Internal server error.' })
      }
    }
  )
}
