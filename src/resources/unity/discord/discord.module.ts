import { HttpModule } from '@nestjs/axios'
import { DiscordService } from './discord.service'
import { Module, Logger } from '@nestjs/common'
import { DiscordSocketClient } from './discord.websocket'
import { CacheModule } from '@nestjs/cache-manager'
import { GuildService } from '../guild/guild.service'
import { MongooseModule } from '@nestjs/mongoose'
import { Guild, GuildSchema } from '../guild/entities/guild.entity'
import { GuildMember, GuildMemberSchema } from '../guild/entities/member.entity'
import { UnityGatewayModule } from '../gateway/events.module'

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Guild.name, schema: GuildSchema },
      { name: GuildMember.name, schema: GuildMemberSchema },
    ]),
    CacheModule.register(),
    UnityGatewayModule,
  ],
  providers: [DiscordSocketClient, DiscordService, GuildService, Logger],
  controllers: [],
  exports: [DiscordService, DiscordSocketClient],
})
export class DiscordModule {}
