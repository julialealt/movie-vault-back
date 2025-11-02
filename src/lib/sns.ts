import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'
import { env } from '../env'

const snsClient = new SNSClient({ region: env.AWS_REGION })
const topicArn = env.SNS_TOPIC_ARN

export async function publishImageForProcessing(bucket: string, key: string) {
  const message = JSON.stringify({ bucket, key })
  const command = new PublishCommand({
    TopicArn: topicArn,
    Message: message,
  })

  try {
    await snsClient.send(command)
    console.log(`Published message to SNS for key: ${key}`)
  } catch (error) {
    console.error('Error publishing to SNS:', error)
  }
}
