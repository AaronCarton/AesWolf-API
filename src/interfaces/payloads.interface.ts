import { DiscordMember, DiscordUser } from './discord.interface'

export interface ImagePayload {
  username: string
  discriminator: string
  avatar: string
  percentage: string
  startExp: number
  endExp: number
  level: number
  rank: number
  currentRoleColor: string
  nextRoleColor: string
}

export interface LevelUpEventPayload {
  guild_id: string
  channel_id: string
  user_id: string
  prevLevel: number
  level: number
  role: string | null
  newRole: boolean
  message: string
}

export interface MemberUpdateEventPayload {
  guild_id: string
  channel_id: string
  member?: DiscordMember
  author: DiscordUser
}
