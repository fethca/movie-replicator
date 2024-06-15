import { extractPackageJson } from '@fethcat/shared/helpers'
import { logsValidators, mongoValidators, redisValidators, validateEnv } from '@fethcat/validator'
import { randomBytes } from 'crypto'
import { num, str } from 'envalid'

const { name, version } = extractPackageJson()

const env = validateEnv({
  ...mongoValidators,
  ...logsValidators,
  ...redisValidators,
  DB_NAME: str(),
  MOVIE_API_URL: str(),
  PORT: num({ default: 3000 }),
})

const instanceId = randomBytes(16).toString('hex')

export const settings = {
  instanceId,
  metadata: { app: name, version, port: env.PORT, env: env.APP_STAGE },
  logs: {
    silent: env.LOG_SILENT,
  },
  mongo: {
    dbName: env.DB_NAME,
    url: env.DB_URL,
  },
  movieApi: {
    url: env.MOVIE_API_URL,
  },
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    keyPrefix: `${name}:`,
    cacheDuration: env.REDIS_CACHE_DURATION,
  },
}

const messages = [
  'replication_job',
  'format_movie',
  'init_db',
  'main_job',
  'should_update',
  'redis_init_store',
  'process_movie',
  'redis_get_last_update_date',
  'redis_no_stored_date',
  'redis_reset_stored_date',
  'redis_set_last_update_date',
] as const

export type Message = (typeof messages)[number]
