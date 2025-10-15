import z from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.url(),
  FRONTEND_URL: z.url().default('http://localhost:5173'),
})

export const env = envSchema.parse(process.env)
