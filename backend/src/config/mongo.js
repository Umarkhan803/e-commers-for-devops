import mongoose from 'mongoose'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

mongoose.set('strictQuery', true)

let connecting = null

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) return mongoose.connection
  if (connecting) return connecting

  connecting = mongoose
    .connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 20,
      autoIndex: !env.isProduction,
    })
    .then((instance) => {
      logger.info(`MongoDB connected → ${instance.connection.name}`)
      return instance.connection
    })
    .catch((error) => {
      connecting = null
      throw error
    })

  return connecting
}

mongoose.connection.on('disconnected', () => {
  connecting = null
  logger.warn('MongoDB disconnected')
})

mongoose.connection.on('error', (error) => {
  logger.error(`MongoDB error: ${error.message}`)
})

export async function disconnectMongo() {
  if (mongoose.connection.readyState === 0) return
  await mongoose.disconnect()
  connecting = null
}

export const mongoHealth = () => ({
  status: ['disconnected', 'connected', 'connecting', 'disconnecting'][
    mongoose.connection.readyState
  ],
  database: mongoose.connection.name ?? null,
})
