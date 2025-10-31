import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { env } from '../../env'
import { deleteFromS3, uploadToS3 } from '../../lib/s3'
import { publishImageForProcessing } from '../../lib/sns'
import { updateMovie } from '../../services/update-movie'
import { getMovieCoverKey } from '../../utils/get-movie-cover-key'

export const updateMovieRoute: FastifyPluginAsyncZod = async app => {
  app.put('/movies/:movieId', async (request, reply) => {
    const paramsSchema = z.object({
      movieId: z.cuid2('Invalid movie ID format'),
    })
    const paramsResult = paramsSchema.safeParse(request.params)
    if (!paramsResult.success) {
      return reply.status(400).send({
        message: 'Invalid request params.',
        errors: z.treeifyError(paramsResult.error).errors,
      })
    }
    const { movieId } = paramsResult.data

    if (!request.isMultipart()) {
      return reply.status(400).send({ message: 'Request must be multipart' })
    }

    const parts = request.parts()
    const fields: Record<string, unknown> = {}
    let newCoverFileData: Buffer | undefined
    let newCoverFileKey: string | undefined
    let newMimetype: string | undefined

    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'cover') {
        if (part.filename) {
          newCoverFileData = await part.toBuffer()
          newCoverFileKey = `${Date.now()}-${part.filename}`
          newMimetype = part.mimetype
        }
      } else if (part.type === 'field') {
        fields[part.fieldname] = part.value
      }
    }

    const updateMovieSchema = z.object({
      title: z.string().max(255).optional(),
      synopsis: z.string().max(2000).optional(),
      rating: z.coerce.number().int().min(0).max(5).optional(),
    })

    const validationResult = updateMovieSchema.safeParse(fields)

    if (!validationResult.success) {
      return reply.status(400).send({
        message: 'Invalid fields.',
        errors: z.treeifyError(validationResult.error).errors,
      })
    }

    const { title, synopsis, rating } = validationResult.data

    if (Object.keys(validationResult.data).length === 0 && !newCoverFileData) {
      return reply
        .status(400)
        .send({ message: 'No fields provided for update.' })
    }

    try {
      let oldCoverKey: string | null = null

      if (newCoverFileData && newCoverFileKey && newMimetype) {
        oldCoverKey = await getMovieCoverKey(movieId)

        await uploadToS3(newCoverFileKey, newCoverFileData, newMimetype)
      }

      const { movie } = await updateMovie({
        id: movieId,
        title,
        synopsis,
        coverKey: newCoverFileKey,
        rating,
      })

      if (oldCoverKey && newCoverFileKey) {
        console.log(`Deleting old cover key: ${oldCoverKey}`)
        await deleteFromS3(oldCoverKey)
        publishImageForProcessing(env.AWS_BUCKET_NAME, newCoverFileKey)
      }

      return reply.status(200).send({ movie })
    } catch (error) {
      console.error(error)

      if (
        newCoverFileKey &&
        error instanceof Error &&
        error.message !== 'S3 upload failed'
      ) {
        console.log(`Rolling back S3 upload for key: ${newCoverFileKey}`)
        await deleteFromS3(newCoverFileKey)
      }

      if (error instanceof Error && error.message === 'Movie not found') {
        return reply.status(404).send({ message: 'Movie not found.' })
      }
      return reply.status(500).send({ message: 'Internal server error.' })
    }
  })
}
