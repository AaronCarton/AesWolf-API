import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common'
import { Response } from 'express'
import { GuildService } from './guild.service'
import { UserService } from '../user/user.service'
import { dbMember, dbUser } from 'src/common/decorators/user.decorator'
import { User, UserRole } from '../user/entities/user.entity'
import { DiscordMemberGuard } from 'src/common/guards/discord.guard'
import { DiscordService } from '../discord/discord.service'
import { DiscordPerms } from '@interfaces/discord.interface'
import { UpdateGuildInput } from './dto/update-guild.input'
import { isGuildAdmin } from 'src/common/guards/isGuildAdmin.guard'
import { RolesGuard } from 'src/common/guards/role.guard'
import { IMember } from '@interfaces/user.interface'
import { DiscordSocketClient } from '../discord/discord.websocket'

@Controller('guilds')
@UseGuards(DiscordMemberGuard)
export class GuildController {
  constructor(
    // @Inject(CACHE_MANAGER) private cacheManager: CacheStore,
    private readonly discordSocket: DiscordSocketClient,
    private readonly discordService: DiscordService,
    private readonly userService: UserService,
    private readonly guildService: GuildService,
  ) {}

  @Get(':guid')
  @UseGuards(isGuildAdmin)
  async getGuild(@Param('guid') guid: string, @Query('includeInfo') includeInfo: boolean) {
    const guild = await this.guildService.findOneByGuid(guid, includeInfo)
    if (includeInfo) {
      const data = await this.discordService.getGuild(guid)
      const info = {
        name: data.name,
        icon: data.icon,
        owner_id: data.owner_id,
        roles: data.roles,
        channels: data.channels,
        emojis: data.emojis,
      }
      return { ...guild, info }
    }
    return guild
  }

  @Post(':guid')
  @UseGuards(RolesGuard(UserRole.CLIENT))
  async createGuild(@Param('guid') guid: string) {
    if (await this.guildService.findOneByGuid(guid))
      throw new HttpException('Guild already exists', HttpStatus.CONFLICT)
    return this.guildService.create({ guid })
  }

  @Put(':guid')
  @UseGuards(isGuildAdmin)
  async updateGuild(@Param('guid') guid: string, @Body() input: UpdateGuildInput) {
    if (!(await this.guildService.findOneByGuid(guid)))
      throw new HttpException('No such guild found', HttpStatus.NOT_FOUND)
    if (!this.discordService.hasPerms(guid, DiscordPerms.ADMINISTRATOR))
      throw new HttpException(
        'Insufficient permission to update this guild, ADMINISTRATOR permission needed',
        HttpStatus.FORBIDDEN,
      )
    return this.guildService.update(guid, input)
  }

  @Get(':guid/leaderboard')
  async getLeaderBoard(
    @Param('guid') guid: string,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('includeDiscord') includeDiscord: boolean,
    @Query('uid') quid: string,
    @dbUser() user: User,
    @dbMember() member: IMember,
  ) {
    if (limit > 30) return new HttpException('Limit cannot be greater than 30', HttpStatus.BAD_REQUEST)
    if (!member) return new HttpException('Could not find member data', HttpStatus.NOT_FOUND)
    if (user?.role === UserRole.CLIENT) member = await this.guildService.findMemberById(quid, guid) // Allow CLIENT to get leaderboard for any user
    const leaderboard = await this.guildService.getLeaderboard(member, page, limit)

    // get all IDs from leaderboard
    // TODO: should probably move this to util function
    const ids: string[] = Object.values(leaderboard).flatMap((v) => {
      if (Array.isArray(v) && v.length > 0) return v.map((v) => v.uid)
      else if (v.uid) return v.uid
    })

    if (includeDiscord) {
      // fetch all members from discord
      const { members } = await this.discordSocket.getGuildMembers(guid, ids)
      // combine discord data with leaderboard data
      // TODO: should probably move this to util function
      for (const [key, value] of Object.entries(leaderboard)) {
        if (Array.isArray(value)) {
          leaderboard[key] = leaderboard[key].map((obj) => {
            const user = members.find((d) => d.user!.id === obj.uid)?.user
            return { ...obj, username: user?.username, discriminator: user?.discriminator, avatar: user?.avatar }
          })
        } else {
          const user = members.find((d) => d.user!.id === value.uid)?.user
          leaderboard[key] = {
            ...value,
            username: user?.username,
            discriminator: user?.discriminator,
            avatar: user?.avatar,
          }
        }
      }
    }

    return leaderboard
  }

  @Get(':guid/@me')
  async getSelf(@Param('guid') guid: string, @dbMember() member: IMember) {
    return member
  }

  @Get(':guid/:uid')
  @UseGuards(RolesGuard(UserRole.CLIENT))
  async getMember(@Param('uid') uid: string, @Param('guid') guid: string, @Res() res: Response) {
    const member = await this.guildService.findMemberById(uid, guid)
    if (!member) {
      // check if user and guild exists, if not create them
      const user = await this.userService.findUserByUid(uid)
      const guild = await this.guildService.findOneByGuid(guid)
      if (!user) await this.userService.create({ uid })
      if (!guild) await this.guildService.create({ guid })
      // create member
      return res.status(HttpStatus.CREATED).send(await this.guildService.createMember(uid, guid))
    }
    return res.status(HttpStatus.OK).send(member)
  }

  @Post(':guid/:uid')
  async joinGuild(@Param('uid') uid: string, @Param('guid') guid: string) {
    if (await this.guildService.findMemberById(uid, guid))
      throw new HttpException('User already in guild', HttpStatus.CONFLICT)
    if (!(await this.userService.findUserByUid(uid)))
      // TODO: change this to create a new user if none exists
      throw new HttpException('No such user found', HttpStatus.NOT_FOUND)
    if (!(await this.guildService.findOneByGuid(guid)))
      // TODO: change this to create a new guild if none exists somehow
      throw new HttpException('No such guild found', HttpStatus.NOT_FOUND)

    await this.guildService.createMember(uid, guid)
    return this.guildService.findMemberById(uid, guid)
  }
}
