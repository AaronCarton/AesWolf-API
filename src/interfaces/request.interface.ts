import { User } from 'src/resources/unity/user/entities/user.entity'
import { DiscordMember, DiscordUser } from './discord.interface'
import { Request } from 'express'
import { IMember } from './user.interface'

export interface NestRequest extends Request {
  user: User
  member: IMember
  discordUser: DiscordUser
  discordMember: DiscordMember
}
