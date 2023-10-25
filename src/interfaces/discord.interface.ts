export interface DiscordUser {
  id: string
  username: string
  global_name: string
  avatar: string
  discriminator: string
  public_flags: number
  flags: number
  banner: string
  banner_color: string
  accent_color: string
  locale: string
  mfa_enabled: boolean
  premium_type: number
  avatar_decoration: string
  bot?: boolean
}

export interface DiscordMember {
  user?: DiscordUser
  nick?: string
  avatar?: string
  roles: string[]
  joined_at: string
  permissions: number
  deaf: boolean
  mute: boolean
}

export interface DiscordGuild {
  id: string
  name: string
  icon: string
  permissions: number
  features: string[]
  banner: string
  home_header: string
  splash: string
  owner_id: string
  roles: DiscordRole[]
  emojis: DiscordEmoji[]
  channels: DiscordChannel[]
  members: DiscordMember[]
}

export interface DiscordPartialGuild extends DiscordGuild {
  id: string
  name: string
  icon: string
  owner: boolean
  permissions: number
  features: string[]
}

export interface DiscordChannel {
  id: string
  type: number
  flags: number
  guild_id: string
  name: string
}

export interface DiscordRole {
  id: string
  name: string
  color: number
}

export interface DiscordEmoji {
  id: string
  name: string
  require_colons: boolean
  managed: boolean
  animated: boolean
  available: boolean
}

export interface GuildMemberChunk {
  not_found: string[]
  members: DiscordMember[]
  guild_id: string
  chunk_index: number
  chunk_count: number
}

export enum DiscordPerms {
  ADMINISTRATOR = 0x8,
}
