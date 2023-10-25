import { GuildSettings } from '../entities/settings/guildSettings.entity'

export class UpdateGuildInput {
  guid: string

  settings: GuildSettings
}
