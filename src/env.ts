import z from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.url(),
  FRONTEND_URL: z.url().default('http://localhost:5173'),

  AWS_BUCKET_NAME: z.string(),
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
})

export const env = envSchema.parse(process.env)
