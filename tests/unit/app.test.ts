import { MockedLogger, mockAction } from '@fethcat/logger'
import * as mongo from '@fethcat/shared/mongo'
import { App } from '../../src/app.js'

vi.mock('../../src/jobs/MainJob')
vi.mock('@fethcat/shared/mongo')

describe('run', () => {
  function createApp() {
    const app = new App()
    app['logger'] = new MockedLogger()
    app['initDb'] = vi.fn()
    app['initRedis'] = vi.fn()
    app['exit'] = vi.fn()
    return app
  }

  beforeEach(() => {
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    vi.spyOn(process, 'on')
  })

  it('should init database', async () => {
    const app = createApp()
    await app.run('dbUri')
    expect(app['initDb']).toHaveBeenCalled()
  })

  it('should register exit event', async () => {
    const app = createApp()
    await app.run('dbUri')
    expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function))
  })

  it('should log success', async () => {
    const app = createApp()
    const { success } = mockAction(app['logger'])
    await app.run('dbUri')
    expect(success).toHaveBeenCalled()
  })

  it('should log failure and exit process', async () => {
    const app = createApp()
    app['initDb'] = vi.fn().mockRejectedValue(new Error('500'))
    const { failure } = mockAction(app['logger'])
    await app.run('dbUri')
    expect(failure).toHaveBeenCalledWith(new Error('500'))
    expect(process.exit).toHaveBeenCalledWith(1)
  })
})

describe('initDb', () => {
  it('should connect to database', async () => {
    const app = new App()
    await app['initDb']('dbUri')
    expect(mongo.connect).toHaveBeenCalledWith('dbUri', { dbName: 'db' })
  })

  it('should log success', async () => {
    const app = new App()
    const { success } = mockAction(app['logger'])
    await app['initDb']('dbUri')
    expect(success).toHaveBeenCalled()
  })

  it('should log failure and throw', async () => {
    vi.spyOn(mongo, 'connect').mockRejectedValue(new Error('500'))
    const app = new App()
    const { failure } = mockAction(app['logger'])
    await expect(app['initDb']('dbUri')).rejects.toThrow(new Error('500'))
    expect(failure).toHaveBeenCalledWith(new Error('500'))
  })
})

describe('exit', () => {
  it('should log', () => {
    const app = new App()
    app['logger'].info = vi.fn()
    app['exit']()
    expect(app['logger'].info).toHaveBeenCalledWith('app_stop')
  })
})
