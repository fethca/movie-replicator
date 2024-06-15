import { Logger } from '@fethcat/logger'
import { connect } from '@fethcat/shared/mongo'
import { MainJob } from './jobs/MainJob.js'
import { store } from './services.js'
import { Message, settings } from './settings.js'

const { instanceId, logs, metadata } = settings

export class App {
  protected logger = Logger.create<Message>(instanceId, logs, metadata)

  async run(dbUri: string): Promise<void> {
    const { success, failure } = this.logger.action('app_start')
    try {
      await this.initDb(dbUri)
      await this.initRedis()
      void new MainJob().run()
      process.on('SIGTERM', this.exit)
      success()
    } catch (error) {
      failure(error)
      process.exit(1)
    }
  }

  private async initDb(dbUri: string) {
    const { success, failure } = this.logger.action('init_db')
    try {
      await connect(dbUri, { dbName: settings.mongo.dbName })
      success()
    } catch (error) {
      failure(error)
      throw error
    }
  }

  private async initRedis() {
    const { success, failure } = this.logger.action('redis_init_store')
    try {
      await store.initClient(settings.redis)
      success()
    } catch (error) {
      throw failure(error)
    }
  }

  private exit() {
    this.logger.info('app_stop')
  }
}
