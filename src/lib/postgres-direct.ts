import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close connections after 20 seconds of inactivity
  max_lifetime: 60 * 30, // Close connections after 30 minutes
})

export default sql