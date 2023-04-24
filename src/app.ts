import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { fastifyMultipart } from '@fastify/multipart'
import { usersRoutes } from './routes/users'
import { mealsRoutes } from './routes/meals'

export const app = fastify()

app.register(cookie)

app.register(fastifyMultipart)

app.register(usersRoutes, {
  prefix: 'users',
})

app.register(mealsRoutes, {
  prefix: 'meals',
})
