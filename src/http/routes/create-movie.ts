import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { deleteFromS3, uploadToS3 } from '../../lib/s3'
import { createMovie } from '../../services/create-movie'

export const createMovieRoute: FastifyPluginAsyncZod = async app => {
  app.post('/movies', async (request, reply) => {
    if (!request.isMultipart()) {
      return reply.status(400).send({ message: 'Request is not multipart' })
    }

    const parts = request.parts()
    const fields: Record<string, unknown> = {}
    let coverFileData: Buffer | undefined
    let coverFileKey: string | undefined
    let coverMimetype: string | undefined

    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'cover') {
        coverFileData = await part.toBuffer()
        coverFileKey = `${Date.now()}-${part.filename}`
        coverMimetype = part.mimetype
      } else if (part.type === 'field') {
        fields[part.fieldname] = part.value
      }
    }

    if (!coverFileData || !coverFileKey || !coverMimetype) {
      return reply.status(400).send({ message: 'Cover image is required.' })
    }

    const createMovieSchema = z.object({
      title: z.string().max(255),
      synopsis: z.string().max(2000),
      rating: z.coerce.number().int().min(0).max(5),
    })

    const validationResult = createMovieSchema.safeParse(fields)

    if (!validationResult.success) {
      return reply.status(400).send({
        message: 'Invalid fields.',
        errors: z.treeifyError(validationResult.error).errors,
      })
    }

    try {
      const { title, synopsis, rating } = validationResult.data

      await uploadToS3(coverFileKey, coverFileData, coverMimetype)

      const { movie } = await createMovie({
        title,
        synopsis,
        coverKey: coverFileKey,
        rating,
      })

      return reply.status(201).send({ movie })
    } catch (error) {
      console.error(error)

      if (
        coverFileKey &&
        error instanceof Error &&
        error.message !== 'S3 upload failed'
      ) {
        console.log(`Rolling back S3 upload for key: ${coverFileKey}`)
        await deleteFromS3(coverFileKey)
      }

      return reply.status(500).send({ message: 'Internal server error.' })
    }
  })
}
