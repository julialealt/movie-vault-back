import type { Readable } from 'node:stream'
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs'
import sharp from 'sharp'
import { env } from './env'

const sqsClient = new SQSClient({ region: env.AWS_REGION })
const s3Client = new S3Client({ region: env.AWS_REGION })
const queueUrl = env.SQS_QUEUE_URL

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

async function processMessage(message: any) {
  console.log('Received message:', message.Body)
  const body = JSON.parse(message.Body)
  const bucket = body.bucket
  const key = body.key

  try {
    // 1. Baixar imagem do S3
    const getObjectCmd = new GetObjectCommand({ Bucket: bucket, Key: key })
    const { Body } = await s3Client.send(getObjectCmd)

    if (!Body) {
      throw new Error('Empty body received from S3')
    }

    const imageBuffer = await streamToBuffer(Body as Readable)

    // 2. Processar imagem (exemplo: redimensionar para largura máxima de 500px)
    const processedImageBuffer = await sharp(imageBuffer)
      .resize({ width: 500 })
      .toBuffer()

    // 3. (Opcional) Fazer upload da imagem processada (ex: sobrescrever a original)
    const putObjectCmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key, // Sobrescreve a original
      Body: processedImageBuffer,
      ContentType: 'image/jpeg', // Ou detectar/manter o original
    })
    await s3Client.send(putObjectCmd)
    console.log(`Processed and re-uploaded image: ${key}`)

    // 4. Deletar mensagem da fila SQS
    const deleteMessageCmd = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: message.ReceiptHandle,
    })
    await sqsClient.send(deleteMessageCmd)
    console.log(`Deleted message from SQS for key: ${key}`)
  } catch (error) {
    console.error(`Error processing message for key ${key}:`, error)
    // Implementar lógica de DLQ ou retry aqui, se necessário
  }
}

async function pollMessages() {
  while (true) {
    console.log('Polling SQS for messages...')
    const receiveMessageCmd = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
    })

    try {
      const { Messages } = await sqsClient.send(receiveMessageCmd)
      if (Messages && Messages.length > 0) {
        await Promise.all(Messages.map(processMessage))
      } else {
        console.log('No messages received.')
      }
    } catch (error) {
      console.error('Error polling SQS:', error)
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
}

pollMessages()
