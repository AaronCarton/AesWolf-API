import { DiscordPerms } from '@interfaces/discord.interface'
import { NestRequest } from '@interfaces/request.interface'
import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common'
import { DiscordService } from 'src/resources/unity/discord/discord.service'
import { GuildService } from 'src/resources/unity/guild/guild.service'
import { UserRole } from 'src/resources/unity/user/entities/user.entity'

@Injectable()
export class isGuildAdmin implements CanActivate {
  constructor(readonly guildService: GuildService, readonly discordService: DiscordService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: NestRequest = context.switchToHttp().getRequest()
    // get data from req
    const user = req.user
    const guid = req.params.guid

    // Allow CLIENT to bypass guard
    if (user.role === UserRole.CLIENT) return true

    // Allow members with ADMINISTRATOR to bypass guard
    if (await this.discordService.hasPerms(guid, DiscordPerms.ADMINISTRATOR)) return true

    // else, If user has admin role, allow access
    const guild = await this.guildService.findOneByGuid(guid)
    const member = await this.discordService.getMember(guid)
    if (guild.settings.adminRole) {
      if (member.roles.includes(guild.settings.adminRole)) {
        return true
      }
    }

    throw new HttpException('Only guild owners or members with assigned ADMIN role can access this data', 403)
  }
}
