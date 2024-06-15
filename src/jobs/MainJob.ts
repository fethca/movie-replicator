import { ILogger, Logger } from '@fethcat/logger'
import { DateTime } from 'luxon'
import { store } from '../services.js'
import { Message, settings } from '../settings.js'
import { ReplicationJob } from './ReplicationJob.js'

const { instanceId, logs, metadata } = settings

export class MainJob {
  protected logger: ILogger<Message> = Logger.create<Message>(instanceId, logs, metadata)
  private timeout: NodeJS.Timeout

  constructor() {
    this.timeout = setTimeout(() => {}, 0)
    clearTimeout(this.timeout)
  }

  async run(): Promise<void> {
    const { success, failure } = this.logger.action('main_job')
    try {
      // await wait(2000) //tsx faster than ts-node, use it when debugging
      this.stop()
      const lastUpdate = await this.getLastUpdateDate()
      const now = DateTime.now()
      let nextRun = now.set({ hour: 2, minute: 0, second: 0, millisecond: 0 })
      if (nextRun <= now) nextRun = nextRun.plus({ days: 1 })
      const diff = nextRun.diff(now).as('milliseconds')
      await new ReplicationJob().run(lastUpdate)
      await this.setLastUpdateDate(now.toMillis())
      this.timeout = setTimeout(() => this.run(), diff)
      success()
    } catch (error) {
      failure(error)
      throw error
    }
  }

  stop() {
    clearTimeout(this.timeout)
  }

  private async getLastUpdateDate(): Promise<number> {
    const { success, failure } = this.logger.action('redis_get_last_update_date')
    try {
      let timestamp = Number(await store.get('last-update'))
      if (!timestamp) {
        timestamp = DateTime.now().toMillis()
        await this.setLastUpdateDate(timestamp)
        this.logger.info('redis_no_stored_date')
      } else {
        const inMemoryDate = Number(store.localInstance.get('last-update'))
        if (inMemoryDate > timestamp) {
          timestamp = inMemoryDate
          this.logger.info('redis_reset_stored_date')
          await this.setLastUpdateDate(inMemoryDate)
          store.localInstance.delete('last-update')
        }
      }
      success({ timestamp })
      return timestamp
    } catch (error) {
      throw failure(error)
    }
  }

  private async setLastUpdateDate(timestamp: number): Promise<void> {
    const { success, failure } = this.logger.action('redis_set_last_update_date')
    try {
      await store.set('last-update', timestamp.toString())
      success({ timestamp })
    } catch (error) {
      throw failure(error)
    }
  }
}
