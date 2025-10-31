import type { Readable } from 'node:stream'
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import {
  DeleteMessageCommand,
  type Message,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs'
import sharp from 'sharp'
import { env } from './env'

interface SqsMessageBody {
  bucket: string
  key: string
}

const credentials = {
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
}
const sqsClient = new SQSClient({ region: env.AWS_REGION, credentials })
const s3Client = new S3Client({ region: env.AWS_REGION, credentials })
const queueUrl = env.SQS_QUEUE_URL

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

async function processMessage(message: Message) {
  if (!message.Body || !message.ReceiptHandle) {
    console.error('Mensagem SQS inválida recebida (sem Body ou ReceiptHandle).')
    return
  }

  const receiptHandle = message.ReceiptHandle
  let body: SqsMessageBody
  let bucket: string
  let key: string

  try {
    body = JSON.parse(message.Body) as SqsMessageBody
    bucket = body.bucket
    key = body.key
    if (!bucket || !key) {
      throw new Error(
        'Mensagem SQS com corpo malformado (faltando bucket ou key).'
      )
    }
  } catch (error) {
    console.error(
      `Falha ao parsear mensagem SQS. Mensagem será deletada para evitar DLQ: ${message.Body}`,
      error
    )
    const deleteMessageCmd = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    })
    await sqsClient.send(deleteMessageCmd)
    return
  }

  console.log(`Processando imagem: ${key}`)

  try {
    const getObjectCmd = new GetObjectCommand({ Bucket: bucket, Key: key })
    const { Body } = await s3Client.send(getObjectCmd)

    if (!Body) {
      throw new Error('Corpo da imagem do S3 está vazio')
    }

    const imageBuffer = await streamToBuffer(Body as Readable)

    const processedImageBuffer = await sharp(imageBuffer)
      .resize({ width: 500 })
      .jpeg({ quality: 80 })
      .toBuffer()

    const putObjectCmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: processedImageBuffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
    })
    await s3Client.send(putObjectCmd)
    console.log(`Imagem re-processada e salva: ${key}`)

    const deleteMessageCmd = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    })
    await sqsClient.send(deleteMessageCmd)
    console.log(`Mensagem SQS deletada para: ${key}`)
  } catch (error) {
    console.error(
      `Falha ao processar a imagem ${key}. A mensagem NÃO será deletada e voltará para a fila para nova tentativa.`,
      error
    )
  }
}

async function pollMessages() {
  while (true) {
    console.log('Buscando mensagens SQS...')
    const receiveMessageCmd = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
    })

    try {
      const { Messages } = await sqsClient.send(receiveMessageCmd)
      if (Messages && Messages.length > 0) {
        console.log(`Recebidas ${Messages.length} mensagens.`)
        await Promise.all(Messages.map(processMessage))
      } else {
        console.log('Nenhuma mensagem recebida.')
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens SQS:', error)
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
}

pollMessages()
