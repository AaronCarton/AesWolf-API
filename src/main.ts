import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true })
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))
  app.useGlobalPipes(new ValidationPipe())
  app.use(cookieParser())
  // await CommandFactory.run(AppModule)
  await app.listen(3000)

  console.info(`\n🖥️   Launched at ${await app.getUrl()}/graphql`)
}
bootstrap()
