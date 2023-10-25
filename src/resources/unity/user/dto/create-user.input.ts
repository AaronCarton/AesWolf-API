import { ArrayUnique, IsNumberString } from 'class-validator'
import { CreateGuildMemberInput } from 'src/resources/unity/guild/dto/create-guildMember.input'
import { GuildMember } from 'src/resources/unity/guild/entities/member.entity'

export class CreateUserInput {
  @IsNumberString()
  uid: string

  // @ArrayUnique((item: CreateGuildDataInput) => item.guid)
  // guilds: GuildData[]
}
