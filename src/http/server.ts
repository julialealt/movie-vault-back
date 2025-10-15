import fastifyCors from '@fastify/cors'
import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { env } from '../env'
import { createMovieRoute } from './routes/create-movie'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.register(fastifyCors, {
  origin: env.FRONTEND_URL,
})

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(createMovieRoute)

app
  .listen({
    port: 8080,
  })
  .then(() => {
    console.log('HTTP server running!')
  })
