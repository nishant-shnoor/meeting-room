import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import env from './config/env.js'
import { errorHandler, routeNotFound } from './middleware/errorHandler.js'
import routes from './routes/index.js'

const app = express()

app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({ origin: env.clientOrigins })) 
app.use(express.json({ limit: '50kb' }))
app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    skip: () => env.nodeEnv === 'test',
    message: { message: 'Too many requests. Please slow down.' },
  }),
)

app.use('/api', routes)
app.use(routeNotFound)
app.use(errorHandler)

export default app
