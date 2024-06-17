import { ILogger, Logger } from '@fethcat/logger'
import { Movie } from '@fethcat/shared/mongo'
import { IMovie, movieSchema } from '@fethcat/shared/types'
import isEqual from 'lodash.isequal'
import { request } from '../services.js'
import { Message, settings } from '../settings.js'

const { instanceId, logs, metadata } = settings

type IRequest = { movies: IMovie[]; total: number }

export class ReplicationJob {
  protected logger: ILogger<Message> = Logger.create<Message>(instanceId, logs, metadata)

  async run(lastUpdate: number) {
    const { success, failure } = this.logger.action('replication_job')
    try {
      const filter = { opsLastUpdate: lastUpdate, opsLastUpdateOrder: 'gte' }
      const { data } = await request<IRequest>(`${settings.movieApi.url}/movies`, { method: 'GET', params: filter })
      const { movies, total } = data
      const pageSize = 500
      for (let pageIndex = 1; pageIndex * pageSize < total; pageIndex++) {
        const params = { pageIndex, pageSize, ...filter }
        const { data } = await request<IRequest>(`${settings.movieApi.url}/movies`, { method: 'GET', params })
        movies.push(...data.movies)
      }
      for (const movie of movies) {
        await this.processMovie(movie)
      }
      success()
    } catch (error) {
      failure(error)
    }
  }

  async processMovie(movie: IMovie) {
    this.logger.addMeta({ title: movie.senscritique.title, id: movie.id })
    const { success, failure } = this.logger.action('process_movie')
    try {
      const existingRecord = await Movie.findOne({ id: movie.id })
      if (!existingRecord) {
        await Movie.findOneAndUpdate({ id: movie.id }, movie, { upsert: true })
      } else if (!this.isEqual(movie, existingRecord)) {
        const providers = existingRecord.providers
        await Movie.findOneAndUpdate({ id: movie.id }, { ...movie, providers }, { upsert: true })
      }
      success()
    } catch (error) {
      failure(error)
    }
  }

  isEqual(movie: IMovie, existingRecord: IMovie | null): boolean {
    if (!existingRecord) return false
    const schema = movieSchema.omit({ providers: true, popularity: true, updatedAt: true, opsDatas: true })
    return isEqual(schema.parse(movie), schema.parse(existingRecord))
  }
}
