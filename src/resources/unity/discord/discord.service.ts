import { Inject, Injectable, Scope } from '@nestjs/common'
import {
  DiscordChannel,
  DiscordGuild,
  DiscordPartialGuild,
  DiscordMember,
  DiscordPerms,
  DiscordUser,
} from '@interfaces/discord.interface'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { NestRequest } from '@interfaces/request.interface'
import { REQUEST } from '@nestjs/core'
import { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager'

interface Options {
  skipCache?: boolean
  customAuth?: string
}

@Injectable({ scope: Scope.REQUEST })
export class DiscordService {
  BASE_URL = 'https://discord.com/api/v10'

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(REQUEST) private readonly request: NestRequest,
    private readonly httpService: HttpService,
  ) {}

  async getUserSelf(): Promise<DiscordUser> {
    return this.getDiscordItem<DiscordUser>(
      `discord:user:${this.request.headers.authorization}`,
      `${this.BASE_URL}/users/@me`,
      60 * 60 * 1 /* only 1 hour, because we can't delete this manually (because of token) */,
    )
  }

  async getMemberSelf(guid: string): Promise<DiscordMember> {
    console.log('getMemberSelf', guid, this.request.discordUser.id, this.request.headers.authorization)

    return this.getDiscordItem<DiscordMember>(
      `discord:member:${guid}:${this.request.discordUser.id}`,
      `${this.BASE_URL}/users/@me/guilds/${guid}/member`,
      60 * 60 * 24 * 1, // 1 day
    )
  }

  async getMember(guid: string): Promise<DiscordMember> {
    return this.getDiscordItem<DiscordMember>(
      `discord:member:${guid}:${this.request.discordUser.id}`,
      `${this.BASE_URL}/guilds/${guid}/members/${this.request.discordUser.id}`,
      60 * 60 * 24 * 1, // 1 day
      {
        customAuth: `Bot ${process.env.BOT_TOKEN}`,
      },
    )
  }

  async getUserGuilds(getBotGuilds = false): Promise<DiscordPartialGuild[]> {
    return this.getDiscordItem<DiscordPartialGuild[]>(
      `discord:user:${getBotGuilds ? 'bot' : this.request.discordUser.id}:guilds`,
      `${this.BASE_URL}/users/@me/guilds`,
      60 * 60 * 24 * 1, // 1 day
      {
        customAuth: getBotGuilds ? `Bot ${process.env.BOT_TOKEN}` : undefined,
      },
    )
  }

  async getCachedGuild(guid: string): Promise<DiscordGuild | undefined> {
    return this.cacheManager.get<DiscordGuild>(`discord:guild:${guid}`)
  }

  async getGuild(guid: string): Promise<DiscordGuild> {
    const cachedGuild = await this.cacheManager.get<DiscordGuild>(`discord:guild:${guid}`)
    if (cachedGuild) return cachedGuild

    return firstValueFrom(
      this.httpService.get<DiscordGuild>(`${this.BASE_URL}/guilds/${guid}`, {
        headers: {
          Authorization: `Bot ${process.env.BOT_TOKEN}`,
        },
      }),
    ).then((gRes) => {
      return firstValueFrom(
        this.httpService.get<DiscordChannel[]>(`${this.BASE_URL}/guilds/${guid}/channels`, {
          headers: {
            Authorization: `Bot ${process.env.BOT_TOKEN}`,
          },
        }),
      ).then((cRes) => {
        const guild = gRes.data
        guild.channels = cRes.data
        this.cacheManager.set(`discord:guild:${guid}`, guild, 60 * 60 * 24 * 1) // 1 day
        return guild
      })
    })
  }

  async hasPerms(guid: string, permission: DiscordPerms): Promise<boolean> {
    // try to fetch from cache first
    let guilds = await this.cacheManager.get<DiscordPartialGuild[]>(
      `discord:user:${this.request.discordUser.id}:guilds`,
    )
    // if not cached, fetch from discord
    if (!guilds) guilds = await this.getUserGuilds()
    // check if user has permission
    return (guilds.find((g) => g.id === guid)!.permissions & permission) == permission
  }

  /**
   * Get a discord item from cache or discord
   * @param key Key under which the item should be cached
   * @param url URL to fetch the item from
   * @param TTL Time to live in seconds in cache
   * @param skipCache Whether to skip the cache and fetch from discord directly (default: false)
   */
  private async getDiscordItem<T>(
    key: string,
    url: string,
    TTL: number,
    options: Options = { skipCache: false },
  ): Promise<T> {
    const cachedItem = await this.cacheManager.get<T>(key)
    if (!options.skipCache && cachedItem) return cachedItem

    return firstValueFrom(
      this.httpService.get<T>(url, {
        headers: {
          Authorization: options.customAuth ?? this.request.headers.authorization,
        },
      }),
    )
      .then((res) => {
        this.cacheManager.set(key, res.data, TTL * 1000)
        return res.data
      })
      .catch((err) => {
        console.log(err)
        throw err
      })
  }

  getGatewayUrl(): Promise<string> {
    return firstValueFrom(this.httpService.get<{ url: string }>(`${this.BASE_URL}/gateway/bot`)).then(
      (res) => res.data.url,
    )
  }
}
