import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../database'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const bodySchema = z.object({
      name: z.string(),
      user_name: z.string(),
    })

    const { name, user_name } = bodySchema.parse(request.body)

    await prisma.user.create({
      data: {
        user_name,
        name,
      },
    })

    return reply.status(201).send()
  })

  app.get('/', async () => {
    const users = await prisma.user.findMany()

    return {
      users,
    }
  })

  app.get('/:user_name', async (request) => {
    const paramsSchema = z.object({
      user_name: z.string(),
    })

    const { user_name } = paramsSchema.parse(request.params)

    const user = await prisma.user.findUnique({
      where: {
        user_name,
      },
    })

    return {
      user,
    }
  })
}
