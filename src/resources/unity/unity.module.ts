import { Module } from '@nestjs/common'
import { UserModule } from './user/user.module'
import { GuildModule } from './guild/guild.module'
import { HttpModule } from '@nestjs/axios'
import { BearerInterceptor } from 'src/common/interceptor/bearer.interceptor'
import { DiscordModule } from './discord/discord.module'
import { UnityGatewayModule } from './gateway/events.module'

@Module({
  imports: [HttpModule, UnityGatewayModule, UserModule, GuildModule, DiscordModule],
  controllers: [],
  providers: [
    {
      provide: 'APP_INTERCEPTOR',
      useClass: BearerInterceptor,
    },
  ],
})
export class UnityModule {}
