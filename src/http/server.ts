import fastifyCors from '@fastify/cors'
import fastifyMultipart from '@fastify/multipart'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { env } from '../env'
import { createMovieRoute } from './routes/create-movie'
import { deleteMovieRoute } from './routes/delete-movie'
import { getMovieRoute } from './routes/get-movie'
import { listMoviesRoute } from './routes/list-movies'
import { updateMovieRoute } from './routes/update-movie'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.get('/health', async (_, reply) => {
  return reply.status(200).send({ status: 'ok' })
})

app.register(fastifyCors, {
  origin: env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
})

app.register(fastifyMultipart, {
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(createMovieRoute)
app.register(updateMovieRoute)
app.register(getMovieRoute)
app.register(deleteMovieRoute)
app.register(listMoviesRoute)

app
  .listen({
    port: 8080,
    host: '0.0.0.0',
  })
  .then(() => {
    console.log('HTTP server running!')
  })
