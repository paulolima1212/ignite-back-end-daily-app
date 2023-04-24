import { FastifyInstance } from 'fastify'
import { prisma } from '../database'
import { z } from 'zod'
import { Meal, Meals } from '../@types/meals'

export async function mealsRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const requestBodySchema = z.object({
      description: z.string(),
      name: z.string(),
      is_diet: z.boolean(),
      user_name: z.string(),
    })

    const { description, name, is_diet, user_name } = requestBodySchema.parse(
      request.body
    )

    const user = await prisma.user.findUnique({
      where: {
        user_name: user_name,
      },
    })

    if (!user) {
      return reply.status(405).send({ message: 'User not found.' })
    }

    await prisma.meal.create({
      data: {
        description,
        is_diet,
        name,
        user_id: user.id,
      },
    })

    return reply.status(201).send()
  })

  app.get('/:user_name', async (request, reply) => {
    const paramsSchema = z.object({
      user_name: z.string(),
    })

    const { user_name } = paramsSchema.parse(request.params)

    const user = await prisma.user.findUnique({
      where: {
        user_name: user_name,
      },
    })

    if (!user) {
      return reply.status(405).send({ message: 'User not found.' })
    }
    const meals = await prisma.meal.findMany({
      where: {
        user_id: user.id,
      },
    })

    return {
      meals,
    }
  })

  app.get('/:user_name/meal/:id', async (request, reply) => {
    const paramsSchema = z.object({
      user_name: z.string(),
      id: z.string().uuid(),
    })

    const { user_name, id } = paramsSchema.parse(request.params)

    const user = await prisma.user.findUnique({
      where: {
        user_name: user_name,
      },
    })

    if (!user) {
      return reply.status(405).send({ message: 'User not found.' })
    }

    const meals = await prisma.meal.findMany({
      where: {
        user_id: user.id,
        id,
      },
    })

    return {
      meals,
    }
  })

  app.get('/:user_name/summary', async (request, reply) => {
    const paramsSchema = z.object({
      user_name: z.string(),
    })

    const { user_name } = paramsSchema.parse(request.params)

    const user = await prisma.user.findUnique({
      where: {
        user_name,
      },
    })

    if (!user) {
      return reply.status(405).send({ message: 'User not found.' })
    }

    const meals = await prisma.$queryRaw<Meals[]>`
      SELECT 
        CAST(COUNT(*) AS TEXT) AS Meals
      FROM	
        meals m 
      WHERE  
        m.user_id = ${user.id}
    `

    const mealsCount = meals[0]

    return {
      mealsCount,
    }
  })

  app.get('/:user_name/summary-in-diet', async (request, reply) => {
    const paramsSchema = z.object({
      user_name: z.string(),
    })

    const { user_name } = paramsSchema.parse(request.params)

    const user = await prisma.user.findUnique({
      where: {
        user_name,
      },
    })

    if (!user) {
      return reply.status(405).send({ message: 'User not found.' })
    }

    const meals = await prisma.$queryRaw<Meals[]>`
      SELECT 
        CAST(COUNT(*) AS TEXT) AS Meals
      FROM	
        meals m 
      WHERE  
        m.user_id = ${user.id} AND 
        m.is_diet = 1
    `

    const mealsInDiet = meals[0]

    return {
      mealsInDiet,
    }
  })

  app.get('/:user_name/metrics-in-diet', async (request, reply) => {
    const paramsSchema = z.object({
      user_name: z.string(),
    })

    const { user_name } = paramsSchema.parse(request.params)

    const user = await prisma.user.findUnique({
      where: {
        user_name,
      },
    })

    if (!user) {
      return reply.status(405).send({ message: 'User not found.' })
    }

    const mealsDiet = await prisma.$queryRaw<Meals[]>`
      SELECT
        CAST(COUNT(*) AS TEXT) AS meals
      FROM
        meals m
      WHERE
        m.user_id = ${user.id} AND
        m.is_diet = 1
    `

    const mealsInDiet = mealsDiet[0]

    const mealsTotal = await prisma.$queryRaw<Meals[]>`
      SELECT
        CAST(COUNT(*) AS TEXT) AS meals
      FROM
        meals m
      WHERE
        m.user_id = ${user.id}
    `

    const mealsCount = mealsTotal[0]

    const metricsOfDiet = Number(mealsInDiet.meals) / Number(mealsCount.meals)

    return { metricsOfDiet }
  })

  app.get('/:user_name/best-sequence', async (request, reply) => {
    const paramsSchema = z.object({
      user_name: z.string(),
    })

    const { user_name } = paramsSchema.parse(request.params)

    const user = await prisma.user.findUnique({
      where: {
        user_name,
      },
    })

    if (!user) {
      return reply.status(405).send({ message: 'User not found.' })
    }

    const meals = await prisma.meal.findMany({
      where: {
        user_id: user.id,
      },
    })

    let bestSequence: Meal[] = []

    const bestSequenceNumber: Number[] = []

    meals.map((meal, i) => {
      if (meal.is_diet) {
        bestSequence.push(meal)
      } else {
        bestSequenceNumber.push(bestSequence.length)
        bestSequence = []
      }

      if (i + 1 === meals.length) {
        bestSequenceNumber.push(bestSequence.length)
      }
    })

    const bestSequenceFinal = bestSequenceNumber.reduce((acc, item) => {
      if (item > acc) {
        acc = item
      }

      return acc
    }, 0)

    return {
      bestSequence: bestSequenceFinal,
    }
  })

  app.delete('/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    await prisma.meal.delete({
      where: {
        id,
      },
    })

    return reply.status(201).send()
  })

  app.patch('/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string(),
    })

    const { id } = paramsSchema.parse(request.params)

    const bodySchema = z.object({
      name: z.string(),
      description: z.string(),
      is_diet: z.boolean(),
      created_at: z.string(),
    })

    const { created_at, description, is_diet, name } = bodySchema.parse(
      request.body
    )

    await prisma.meal.update({
      where: {
        id,
      },
      data: {
        created_at,
        description,
        is_diet,
        name,
      },
    })

    return reply.status(201).send()
  })
}
