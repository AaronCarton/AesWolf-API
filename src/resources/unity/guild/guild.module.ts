import { Module } from '@nestjs/common'
import { GuildService } from './guild.service'
import { Guild, GuildSchema } from './entities/guild.entity'
import { MongooseModule } from '@nestjs/mongoose/dist'
import { User, UserSchema } from '../user/entities/user.entity'
import { UserService } from '../user/user.service'
import { GuildController } from './guild.controller'
import { HttpModule } from '@nestjs/axios'
import { GuildMember, GuildMemberSchema } from './entities/member.entity'
import { DiscordModule } from '../discord/discord.module'

@Module({
  imports: [
    // CacheModule.register(),
    MongooseModule.forFeature([
      { name: Guild.name, schema: GuildSchema },
      { name: User.name, schema: UserSchema },
      { name: GuildMember.name, schema: GuildMemberSchema },
    ]),
    DiscordModule,
    HttpModule,
  ],
  providers: [GuildService, UserService],
  controllers: [GuildController],
})
export class GuildModule {}
