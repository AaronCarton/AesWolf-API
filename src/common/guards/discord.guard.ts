import { DiscordUser } from '@interfaces/discord.interface'
import { NestRequest } from '@interfaces/request.interface'
import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common'
import { AxiosError } from 'axios'
import { DiscordService } from 'src/resources/unity/discord/discord.service'
import { GuildService } from 'src/resources/unity/guild/guild.service'
import { UserService } from 'src/resources/unity/user/user.service'

@Injectable()
export class DiscordUserGuard implements CanActivate {
  constructor(readonly discordService: DiscordService, private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: NestRequest = context.switchToHttp().getRequest()
    try {
      // get user from discord
      const dUser = await this.discordService.getUserSelf()
      if (!dUser) return false
      // get user from database
      const user = await this.userService.findUserByUid(dUser.id)
      // set user in context
      req.user = user
      req.discordUser = dUser

      return true
    } catch (e) {
      return false
    }
  }
}

@Injectable()
export class DiscordMemberGuard implements CanActivate {
  constructor(
    private readonly discordService: DiscordService,
    private readonly userService: UserService,
    private readonly guildService: GuildService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: NestRequest = context.switchToHttp().getRequest()
    try {
      const dUser: DiscordUser = await this.discordService.getUserSelf()
      req.discordUser = dUser
      const guid = req.params.guid
      const guilds = await this.discordService.getUserGuilds()

      if (!guilds.some((g) => g.id === guid)) throw new HttpException('You are not a member of this guild', 403)

      // get user & member from database
      const user = await this.userService.findUserByUid(dUser.id)
      const member = await this.guildService.findMemberById(dUser.id, guid) // TODO: maybe member should include User data so we don't need 2 queries
      // set user in context
      req.user = user
      req.member = member

      return true
    } catch (err) {
      // TODO: handle errors better

      if (err instanceof HttpException) throw err
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) throw new HttpException('Invalid authorization, check your token', 401)
        else throw new HttpException(err.response?.data, err.response?.status || 500)
      }
      console.error(err)
      return false
    }
  }
}
