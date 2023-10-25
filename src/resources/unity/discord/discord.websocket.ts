import { DiscordUser, GuildMemberChunk } from '@interfaces/discord.interface'
import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common'
import * as WebSocket from 'ws'
import { GuildService } from '../guild/guild.service'
import { createMessage, getLevelByExp, getRoleByLevel } from 'src/common/utils/levelUtils'
import { Cache } from 'cache-manager'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { UnityEventsGateway } from '../gateway/events.gateway'
import { MemberUpdateEventPayload } from '@interfaces/payloads.interface'

interface ResumeOptions {
  url?: string
  session_id?: string
}

let attempts = 0

@Injectable()
export class DiscordSocketClient implements OnModuleInit {
  private readonly version = 10
  private readonly encoding = 'json'
  private readonly url = 'wss://gateway.discord.gg/'
  private resume: ResumeOptions
  private heartbeat_interval: NodeJS.Timeout
  private seq = '953'
  private ws: WebSocket

  constructor(
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private unityGateway: UnityEventsGateway,
    private guildService: GuildService,
  ) {}

  onModuleInit() {
    this.connect(this.url)
  }

  public getGuildMembers(guild_id: string, user_ids: string[]): Promise<GuildMemberChunk> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return reject('NO_SOCKET_CONNECTION')
      // send request
      this.ws.send(
        JSON.stringify({
          op: 8,
          d: { guild_id, user_ids },
        }),
      )
      // listen for response
      const listener = (data: WebSocket.RawData) => {
        const { op, t, d } = JSON.parse(data.toString())
        if (op === 0 && t === 'GUILD_MEMBERS_CHUNK') {
          this.ws.removeListener('message', listener)
          resolve(d)
        }
      }
      this.ws.on('message', listener)
      // timeout after 5 seconds if no response
      setTimeout(() => {
        this.ws.removeListener('message', listener)
        reject('TIMEOUT')
      }, 20000)
    })
  }

  private connect(url: string, reconnect = false) {
    // close previous connection if exists
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.logger.verbose('closing previous connection', 'Discord WS')
      this.ws.close(4621, 'INIT_RECONNECT')
    }
    this.ws = new WebSocket(`${url}?v=${this.version}&encoding=${this.encoding}`)
    this.ws.once('open', () => {
      this.logger.verbose(`connected, ${reconnect ? 'resuming connection' : 'sending identify'}..`, 'Discord WS')
      this.ws.send(
        JSON.stringify(
          reconnect
            ? {
                op: 6,
                d: {
                  token: process.env.BOT_TOKEN,
                  session_id: this.resume.session_id,
                  seq: this.seq,
                },
              }
            : {
                op: 2,
                d: {
                  token: process.env.BOT_TOKEN,
                  intents: 771,
                  properties: {
                    $os: 'linux',
                    $browser: 'my_library',
                    $device: 'my_library',
                  },
                },
              },
        ),
      )
      if (!reconnect) this.resume = {} // reset resume session if not resuming
      this.registerEvents()
    })
    this.ws.once('close', (code, reason) => {
      // log reason for disconnect as string
      this.logger.warn(`disconnected ${code} ${reason.toString()}`, 'Discord WS')
      // reset resume session & heartbeat interval
      clearInterval(this.heartbeat_interval)
      // reconnect if not intentional (custom code 4621 means it was intentional)
      if (attempts > 5) return this.logger.warn('Too many attempts, exiting..', code, reason.toString(), 'Discord WS')
      if (code !== 4621) {
        const timeout = 5000 * attempts
        this.logger.log(`Attempting to reconnect${timeout > 0 ? ` in ${timeout / 1000} seconds` : ''}..`, 'Discord WS')
        setTimeout(() => {
          attempts++
          attempts <= 1 && this.resume.url ? this.connect(this.resume.url, true) : this.connect(this.url, false)
        }, timeout || 2000)
      }
    })
  }

  private heartbeat(interval: number) {
    // clear previous interval if exists
    if (this.heartbeat_interval) clearInterval(this.heartbeat_interval)
    // send heartbeat every interval
    this.heartbeat_interval = setInterval(() => {
      this.logger.verbose('sending heartbeat', 'Discord WS')

      this.ws.send(JSON.stringify({ op: 1, d: this.seq }))
    }, interval * 0.95)
  }

  private registerEvents() {
    this.ws.on('message', (data, isBinary) => {
      if (isBinary) return
      const res = JSON.parse(data.toString())
      if (res.op !== 11 && res.t !== 'PRESENCE_UPDATE') this.logger.verbose(`received opcode ${res.op}`, 'Discord WS')

      switch (res.op) {
        case 10:
          const { heartbeat_interval } = res.d
          this.logger.verbose(`Received hello, heartbeat interval is ${heartbeat_interval}`, 'Discord WS')
          this.heartbeat(heartbeat_interval)
          break
        case 11:
          this.logger.verbose(`heartbeat ACK`, 'Discord WS')
          break
        case 7:
          this.logger.verbose('reconnect request')
          break
        case 9:
          this.logger.verbose('invalid session')
          break
        case 1:
          this.logger.verbose(`sending heartbeat (requested by server)`)
          this.ws.send(JSON.stringify({ op: 1, d: this.seq }))
          break
        case 0:
          this.seq = res.s
          if (res.t !== 'PRESENCE_UPDATE') this.logger.verbose(`DISPATCH ${res.t}`, 'Discord WS')
          this.handleEvent(res)
          break
      }
    })
  }

  private async handleEvent(res) {
    switch (res.t) {
      case 'READY':
        attempts = 0
        this.resume = {
          url: res.d.resume_gateway_url,
          session_id: res.d.session_id,
        }
        this.logger.log(
          `ready! Current session: ${this.resume.session_id}, URL ${this.resume.url}, SEQ ${this.seq}`,
          'Discord WS',
        )
        break
      case 'RESUME':
        attempts = 0
        this.logger.log(`resumed! ${this.resume.session_id}, URL ${this.resume.url}, SEQ ${this.seq}`, 'Discord WS')
        break
      case 'GUILD_CREATE':
      case 'GUILD_UPDATE':
        await this.cacheManager.set(`discord:guild:${res.d.id}`, res.d, 0) // store guilds in cache
        if (res.d.lazy) return // ignore lazing loaded guilds
        await this.guildService.findOneByGuid(res.d.id)
        this.logger.debug(`${res.t} ${res.d.id}`)
        break
      case 'GUILD_ROLE_UPDATE':
      case 'GUILD_ROLE_CREATE':
      case 'GUILD_ROLE_DELETE':
      case 'CHANNEL_CREATE':
      case 'CHANNEL_UPDATE':
      case 'CHANNEL_DELETE':
        // TODO: maybe update guild cache?
        if (!res.d.guild_id) return
        await this.cacheManager.del(`discord:guild:${res.d.guild_id}`)
        break
      case 'GUILD_MEMBER_ADD':
      case 'GUILD_MEMBER_REMOVE':
        // if member joins/leaves any guild, delete their cached guilds
        const user: DiscordUser = res.d.user
        await this.cacheManager.del(`discord:user:${user.id}:guilds`)
        break
      case 'GUILD_MEMBER_UPDATE':
        this.logger.debug(`GUILD_MEMBER_UPDATE GUID: ${res.d.guild_id} UID: ${res.d.user.id}`)

        // if member gets updated, update the cached version if it exists
        await this.cacheManager.set(
          `discord:member:${res.d.guild_id}:${res.d.user.id}`,
          res.d,
          1000 * 60 * 60 * 24 * 1, // 1 day
        )
        // TODO: update guild cache
        break
      case 'MESSAGE_CREATE':
        const { guild_id, channel_id, author }: MemberUpdateEventPayload = res.d
        if (!guild_id || !author) return // ignore DMs
        if (author.bot) return
        if (await this.cacheManager.get(`discord:member:${guild_id}:${author.id}:cooldown`)) return

        // get guild & member
        const guild = await this.guildService.findOneByGuid(guild_id)
        if (guild.settings.levelingEnabled === false) return
        if (guild.settings.levelSettings.blacklistedChannels.includes(channel_id)) return
        const member = await this.guildService.findMemberById(author.id, guild_id)

        // calculate random amount of exp
        const { minExp, maxExp, constant, multiplier, levelRoles, levelUpMessage, expCooldown } =
          guild.settings.levelSettings
        const randExp = Math.floor((Math.random() * (maxExp - minExp + 1) + minExp) * multiplier)

        await this.guildService.addExp(guild.guid, member.uid, randExp)
        this.logger.debug(`Gave ${randExp} exp in ${guild.guid} to ${author.username} (${member.uid})`)

        // check if member leveled up
        const level = getLevelByExp(member.exp, constant)
        const nextLevel = getLevelByExp(member.exp + randExp, constant)
        if (level < nextLevel) {
          // determine roles based on level
          const prevRole = getRoleByLevel(levelRoles, level)
          const role = getRoleByLevel(levelRoles, nextLevel)
          // send out event
          this.unityGateway.sendLevelUpEvent({
            guild_id: guild.guid,
            channel_id: channel_id,
            user_id: member.uid,
            prevLevel: level,
            level: nextLevel,
            role: role?.role || null,
            newRole: prevRole?.role !== role?.role,
            // TODO: improve this
            message: createMessage(levelUpMessage, {
              member: `<@${member.uid}>`,
              role: `<@&${role?.role}>`,
              prevRole: `<@&${prevRole?.role}>`,
              level: nextLevel,
            }),
          })
        }

        // put member on cooldown
        await this.cacheManager.set(`discord:member:${guild.guid}:${author.id}:cooldown`, true, 1000 * expCooldown)

        break
    }
  }
}
