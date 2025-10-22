import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { env } from '../env'

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
})

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
) {
  const command = new PutObjectCommand({
    Bucket: env.AWS_BUCKET_NAME,
    Key: key, // O nome/caminho do arquivo no bucket
    Body: body, // O conteúdo do arquivo (Buffer)
    ContentType: contentType, // O tipo MIME (ex: image/jpeg)
    // ACL: 'public-read', // Descomente se quiser que os arquivos sejam públicos por padrão
  })

  try {
    await s3Client.send(command)
    console.log(`Successfully uploaded ${key} to ${env.AWS_BUCKET_NAME}`)
  } catch (error) {
    console.error('Error uploading to S3:', error)
    throw new Error('S3 upload failed')
  }
}

export async function deleteFromS3(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: env.AWS_BUCKET_NAME,
    Key: key,
  })

  try {
    await s3Client.send(command)
    console.log(`Successfully deleted ${key} from ${env.AWS_BUCKET_NAME}`)
  } catch (error) {
    console.error('Error deleting from S3:', error)
    // Decide se quer lançar um erro ou apenas logar,
    // pois a falha ao deletar pode não ser crítica em todos os casos.
    // throw new Error('S3 delete failed');
  }
}

import { eq } from 'drizzle-orm'
import { db } from '../db'
import { movies } from '../db/schema'

export async function getMovieCoverKey(
  movieId: string
): Promise<string | null> {
  const movie = await db.query.movies.findFirst({
    where: eq(movies.id, movieId),
    columns: { coverKey: true },
  })
  return movie?.coverKey || null
}
