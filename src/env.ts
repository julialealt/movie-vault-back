import z from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.url(),
  FRONTEND_URL: z.url().default('http://localhost:5173'),

  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_SESSION_TOKEN: z.string(),

  AWS_BUCKET_NAME: z.string(),
  SNS_TOPIC_ARN: z.string(),
  SQS_QUEUE_URL: z.string(),
})

export const env = envSchema.parse(process.env)
