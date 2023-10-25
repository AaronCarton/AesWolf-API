import { GuildMember } from 'src/resources/unity/guild/entities/member.entity'
import { UserRole } from 'src/resources/unity/user/entities/user.entity'

export interface IUser {
  uid: string
  role: UserRole
  username: string
  global_name: string
  avatar: string
}

export type IMember = GuildMember & {
  rank: number
}
