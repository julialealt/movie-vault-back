import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { createId } from '@paralleldrive/cuid2'
import type { movies } from '../db/schema'
import { env } from '../env'

type Movie = typeof movies.$inferSelect

type LogDetails = Movie | Record<string, unknown>

const client = new DynamoDBClient({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    sessionToken: env.AWS_SESSION_TOKEN,
  },
})

const docClient = DynamoDBDocumentClient.from(client)
const tableName = 'MovieVaultCRUDLogs'

export async function logAction(
  actionType: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
  movieId: string | null,
  data: LogDetails
) {
  const logId = createId()

  const command = new PutCommand({
    TableName: tableName,
    Item: {
      logId: logId,
      timestamp: new Date().toISOString(),
      actionType,
      movieId,
      details: JSON.parse(
        JSON.stringify(data, (_, value) =>
          value instanceof Date ? value.toISOString() : value
        )
      ),
    },
  })

  try {
    await docClient.send(command)
    console.log(`Logged action ${actionType} for movie ${movieId || 'list'}`)
  } catch (error) {
    console.error('Error logging action to DynamoDB:', error)
  }
}
