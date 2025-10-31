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
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: 'public-read',
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
    throw new Error('S3 delete failed')
  }
}
