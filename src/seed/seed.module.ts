import { Module } from '@nestjs/common'
import { DatabaseSeedService } from './seed.service'
import { DatabaseSeedCommand } from './seed.command'
import { MongooseModule } from '@nestjs/mongoose'
import { User, UserSchema } from 'src/resources/unity/user/entities/user.entity'
import { GuildMember, GuildMemberSchema } from 'src/resources/unity/guild/entities/member.entity'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: GuildMember.name, schema: GuildMemberSchema },
    ]),
  ],
  providers: [DatabaseSeedCommand, DatabaseSeedService],
})
export class DatabaseSeedModule {}
