import { Controller, Get, HttpException, HttpStatus, Param, UseGuards, UseInterceptors, Inject } from '@nestjs/common'
import { UserService } from './user.service'
import { GuildService } from '../guild/guild.service'
import { dbUser, discordUser } from 'src/common/decorators/user.decorator'
import { User, UserDocument, UserRole } from './entities/user.entity'
import { DiscordUserGuard } from 'src/common/guards/discord.guard'
import { IUser } from '@interfaces/user.interface'
import { CACHE_MANAGER, CacheInterceptor, CacheStore } from '@nestjs/cache-manager'
import { DiscordService } from '../discord/discord.service'
import { DiscordMember, DiscordPartialGuild, DiscordPerms, DiscordUser } from '@interfaces/discord.interface'
import { RolesGuard } from 'src/common/guards/role.guard'

@Controller('users')
@UseGuards(DiscordUserGuard)
@UseInterceptors(CacheInterceptor)
export class UserController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore,
    private readonly discordService: DiscordService,
    private readonly userService: UserService,
    private readonly guildService: GuildService,
  ) {}

  //TODO: create @me route?

  @Get('@me')
  findSelf(@dbUser() user: UserDocument, @discordUser() dUser: DiscordUser) {
    if (!user) throw new HttpException('No such user found', HttpStatus.NOT_FOUND)
    return { ...user.toObject(), ...dUser }
  }

  @Get(':id')
  @UseGuards(RolesGuard(UserRole.CLIENT))
  async findByUid(@Param('id') id: string) {
    const user = await this.userService.findUserByUid(id)
    if (!user) return await this.userService.create({ uid: id })
    return user
  }

  @Get('@me/managed-guilds')
  async GetGuilds(@discordUser() user: DiscordUser) {
    // get all guilds bot is in
    const botGuilds = await this.discordService.getUserGuilds(true)
    // get all guilds user is in, and check if bot is in them
    const guilds = (await this.discordService.getUserGuilds()).map(
      (guild) =>
        ({
          ...guild,
          hasBot: botGuilds.some((botGuild) => botGuild.id == guild.id),
        } as DiscordPartialGuild & { hasBot: boolean }),
    )
    // fetch all db guilds that bot is in
    const dbGuilds = await Promise.all(
      guilds.filter(({ hasBot }) => hasBot).map(({ id }) => this.guildService.findOneByGuid(id)),
    )

    // fetch user's member data of every guild bot is in
    const members = await Promise.all(
      guilds.map(async (m) => {
        // get discord guild member
        const guild = await this.discordService.getCachedGuild(m.id)
        const member = guild?.members.find((m) => m.user?.id == user.id)
        // get database guild
        const dbGuild = dbGuilds.find((dbGuild) => dbGuild.guid == m.id)
        const adminRole = dbGuild?.settings?.adminRole
        return {
          ...member,
          guild_id: m.id,
          permissions: m.permissions,
          hasAdminRole: member?.roles.includes(adminRole ?? ''), // determine if user has assigned admin role in guild
        } as Partial<DiscordMember> & { guild_id: string; permissions: number; hasAdminRole: boolean }
      }),
    )

    const adminGuilds = guilds
      .filter((guild) => {
        // find discord member & database guild
        const member = members.find((member) => member.guild_id == guild.id)
        // if user has ADMINISTRATOR perms, or has assigned admin role, return true
        if (
          member?.hasAdminRole === true ||
          (member !== undefined && (member?.permissions & DiscordPerms.ADMINISTRATOR) === DiscordPerms.ADMINISTRATOR)
        )
          return true
        // else, if no special perms, filter out guild
        return false
      })
      .map(async (guild) => {
        const cachedGuild = await this.discordService.getCachedGuild(guild.id)
        return {
          name: guild.name,
          id: guild.id,
          owner: guild.owner,
          hasBot: cachedGuild ? true : false,
          hasAdminRole: members.find((member) => member.guild_id == guild.id)?.hasAdminRole ?? false,
          icon: guild.icon ?? null,
          banner: cachedGuild?.banner ?? null,
        }
      })
    return Promise.all(adminGuilds)
  }

  // @Put('/:guid/:uid/points/:points')
  // async points(
  //   @Param('uid') uid: string,
  //   @Param('guid') guid: string,
  //   @Param('points', ParseIntPipe) points: number,
  // ) {
  //   await this.userService.updateExp(uid, guid, points)
  //   await this.cacheManager.del(`/users/${guid}/${uid}`) // clear cache for this user

  //   return this.userService.findMemberById(uid, guid)
  // }
}
