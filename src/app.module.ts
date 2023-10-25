import { Module, Logger } from '@nestjs/common'
import { AppService } from './app.service'
import { BootstrapModule } from './bootstrap/bootstrap.module'
import { ImageModule } from './services/image/image.module'
import { AuthModule } from './auth/auth.module'
import { DatabaseSeedModule } from './seed/seed.module'
import { UnityModule } from './resources/unity/unity.module'
import { HttpModule } from '@nestjs/axios'

@Module({
  imports: [BootstrapModule, DatabaseSeedModule, AuthModule, ImageModule, UnityModule, HttpModule],
  providers: [AppService, Logger],
})
export class AppModule {}
