import 'dotenv/config'

const missing = ['DATABASE_URL', 'JWT_SECRET'].filter(
  (key) => !process.env[key],
)

if (missing.length) {
  throw new Error(`Missing environment variables: ${missing.join(', ')}`)
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim()),
  timezone: process.env.BUSINESS_TIMEZONE || 'Asia/Kolkata',
}

export default env
