import { CreateGuildInput } from './dto/create-guild.input'
import { UpdateGuildInput } from './dto/update-guild.input'
import { Guild, GuildDocument } from './entities/guild.entity'
import { Injectable } from '@nestjs/common'
import { ObjectId } from 'mongodb'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { IMember } from '@interfaces/user.interface'
import { GuildMember } from './entities/member.entity'
import { Leaderboard } from '@interfaces/leaderboard.interace'

@Injectable()
export class GuildService {
  constructor(
    @InjectModel(Guild.name)
    private readonly guildRepo: Model<GuildDocument>,
    @InjectModel(GuildMember.name)
    private readonly memberRepo: Model<GuildMember>,
  ) {}

  create(createGuildInput: CreateGuildInput): Promise<Guild> {
    const newGuild = new this.guildRepo(createGuildInput)
    return newGuild.save()
  }

  findAll(): Promise<Guild[]> {
    return this.guildRepo.find().exec()
  }

  async findOneByGuid(guid: string, toObject = false): Promise<Guild> {
    const g = await this.guildRepo.findOne({ guid }, { _id: 0, __v: 0 }).exec()
    if (!g) return this.create({ guid })
    g.settings.levelSettings.levelRoles.sort((a, b) => a.level - b.level) // sort levelRoles by level
    return toObject ? g.toObject() : g
  }

  async addExp(guid: string, uid: string, exp: number) {
    await this.memberRepo.updateOne({ guid, uid }, { $inc: { exp } }).exec()
  }

  async update(uid: string, updateGuildInput: UpdateGuildInput): Promise<Guild | null> {
    await this.guildRepo.findOneAndUpdate({ uid }, updateGuildInput).exec()
    return this.findOneByGuid(uid)
  }

  createMember(uid: string, guid: string): Promise<GuildMember> {
    return this.memberRepo.create({ uid, guid })
  }

  async findMemberById(uid: string, guid: string) {
    // create member if it doesn't exists
    const member = this.memberRepo.findOne({ uid, guid }).exec()
    if (!member) this.createMember(uid, guid)
    // perform aggregation
    const res = await this.memberRepo
      .aggregate([
        // match guild
        { $match: { guid: guid } },
        // rank the users by exp, store in rank
        {
          $setWindowFields: {
            partitionBy: 'guid',
            sortBy: { exp: -1 },
            output: { rank: { $denseRank: {} } },
          },
        },
        // find the user
        { $match: { uid: uid } },
        // remove unnecessary fields
        { $project: { _id: 0, guid: 1, uid: 1, exp: 1, rank: 1 } },
      ])
      .exec()
    if (!res.length) {
      await this.createMember(uid, guid)
      return this.findMemberById(uid, guid)
    }
    return res[0] as IMember
  }

  async getLeaderboard(member: IMember, page: number, limit: number): Promise<Leaderboard> {
    const skip = (page - 1) * limit
    const res = await this.memberRepo.aggregate([
      // match guild
      { $match: { guid: member.guid } },
      // rank the users by exp, store in rank
      {
        $setWindowFields: {
          partitionBy: 'guilds',
          sortBy: { exp: -1 },
          output: { rank: { $denseRank: {} } },
        },
      },
      // remove unnecessary fields
      {
        $project: { _id: 0, guid: 1, uid: 1, exp: 1, rank: 1 },
      },
      // get adjacent members and top X members
      {
        $facet: {
          member: [{ $match: { uid: member.uid } }, { $limit: 1 }],
          topMembers: [{ $skip: skip }, { $limit: limit }],
          previousMembers: [
            { $match: { rank: { $lt: member.rank } } },
            { $sort: { rank: -1 } },
            { $limit: 2 },
            { $sort: { rank: 1 } },
          ],
          nextMembers: [{ $match: { rank: { $gt: member.rank } } }, { $sort: { rank: 1 } }, { $limit: 2 }],
          pageInfo: [{ $count: 'totalItems' }],
        },
      },
      // get the guild's settings
      {
        $lookup: {
          from: 'guilds',
          localField: 'member.guid',
          foreignField: 'guid',
          as: 'guild',
        },
      },
      {
        $unwind: '$guild',
      },
      // add page info
      {
        $unwind: '$pageInfo',
      },
      {
        $addFields: {
          pageInfo: {
            currentPage: page,
            pageSize: limit,
            totalPages: { $ceil: { $divide: ['$pageInfo.totalItems', limit] } },
          },
        },
      },
      // map the arrays to include a "level" field in each member object
      // calculated from their exp with the guild's constant
      // temporarily store the updated arrays in updatedFields
      {
        $addFields: {
          updatedFields: {
            $map: {
              input: { $objectToArray: '$$ROOT' },
              as: 'array',
              in: {
                k: '$$array.k',
                v: {
                  $cond: {
                    if: { $isArray: '$$array.v' },
                    then: {
                      $map: {
                        input: '$$array.v',
                        as: 'item',
                        in: {
                          $mergeObjects: [
                            '$$item',
                            {
                              level: {
                                $floor: {
                                  $multiply: ['$guild.settings.levelSettings.constant', { $sqrt: '$$item.exp' }],
                                },
                              },
                            },
                          ],
                        },
                      },
                    },
                    else: '$$array.v',
                  },
                },
              },
            },
          },
        },
      },
      // replace the root with the updatedFields
      {
        $replaceRoot: { newRoot: { $arrayToObject: '$updatedFields' } },
      },
      // merge adjacent members array with the main member, also get rid of the guild field
      {
        $project: {
          member: 1,
          adjacentMembers: { $concatArrays: ['$previousMembers', '$member', '$nextMembers'] },
          topMembers: 1,
          pageInfo: 1,
        },
      },
      { $unwind: '$member' },
    ])
    return res[0]
  }

  remove(id: string) {
    // soft delete
    return this.guildRepo.findOneAndUpdate(new ObjectId(id), { deletedAt: new Date() }).exec()
  }
}
