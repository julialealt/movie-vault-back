import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { createMovie } from '../../services/create-movie'

export const createMovieRoute: FastifyPluginAsyncZod = async app => {
  app.post(
    '/movies',
    {
      schema: {
        body: z.object({
          title: z.string().max(255),
          synopsis: z.string().max(2000),
          coverKey: z.string().max(255),
          rating: z.number().int().min(0).max(5),
        }),
        response: {
          201: z.object({
            movie: z.object({
              id: z.string(),
              title: z.string(),
              synopsis: z.string(),
              coverKey: z.string(),
              rating: z.number(),
              createdAt: z.date(),
            }),
          }),
          500: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { title, synopsis, coverKey, rating } = request.body

        const { movie } = await createMovie({
          title,
          synopsis,
          coverKey,
          rating,
        })

        return reply.status(201).send({ movie })
      } catch (error) {
        console.error(error)
        return reply.status(500).send({ message: 'Internal server error.' })
      }
    }
  )
}
