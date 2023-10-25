import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { User, UserSchema } from './entities/user.entity'
import { GuildService } from '../guild/guild.service'
import { HttpModule } from '@nestjs/axios/dist/http.module'
import { MongooseModule } from '@nestjs/mongoose/dist'
import { Guild, GuildSchema } from '../guild/entities/guild.entity'
import { UserController } from './user.controller'
import { CacheModule } from '@nestjs/cache-manager'
import { GuildMember, GuildMemberSchema } from '../guild/entities/member.entity'
import { DiscordModule } from '../discord/discord.module'

@Module({
  imports: [
    CacheModule.register(),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Guild.name, schema: GuildSchema },
      { name: GuildMember.name, schema: GuildMemberSchema },
    ]),
    DiscordModule,
    HttpModule,
  ],
  providers: [UserService, GuildService],
  controllers: [UserController],
})
export class UserModule {}
