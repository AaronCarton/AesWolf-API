import { Injectable } from '@nestjs/common'
import { ObjectId } from 'mongodb'
import { plainToInstance } from 'class-transformer' //https://www.npmjs.com/package/class-transformer
import { User, UserDocument } from 'src/resources/unity/user/entities/user.entity'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { GuildMember } from 'src/resources/unity/guild/entities/member.entity'

@Injectable()
export class DatabaseSeedService {
  constructor(
    @InjectModel(User.name)
    private readonly userRepo: Model<UserDocument>,
    @InjectModel(GuildMember.name)
    private readonly memberRepo: Model<GuildMember>,
  ) {}

  async addUsers() {
    // create 20000 users with random data, where each user has between 1-100 guilds
    const users: User[] = []
    const usedIds = new Set<string>()
    const guildMembers: GuildMember[] = []
    for (let index = 0; index < 20000; index++) {
      let uid = ''
      do {
        uid = Math.floor(Math.random() * 100000) + 1 + ''
      } while (usedIds.has(uid))
      if (index === 0) uid = '277771753952903168' // uid for testing purposes
      usedIds.add(uid)

      const usedGuids = new Set<string>()
      // create between 1-100 guilds for each user
      for (let index = 0; index < Math.floor(Math.random() * 100) + 1; index++) {
        let guid = ''
        do {
          guid = Math.floor(Math.random() * 800) + 1 + ''
        } while (usedGuids.has(guid))
        if (index === 0) guid = '195' // guid for testing purposes
        usedGuids.add(guid)

        const gd = new GuildMember()
        gd.guid = guid
        gd.uid = uid
        gd.exp = Math.floor(Math.random() * 10000) + 1
        guildMembers.push(gd)
      }

      const user = new User()
      user.uid = uid
      // user.guilds = []
      users.push(user)
      process.stdout.write(`Creating users: ${((index / 20000) * 100).toFixed(1)}% (${index}/${20000})\r`)
      // process.stdout.clearLine(0)
      // process.stdout.cursorTo(0)
    }
    process.stdout.write('\n') // end the line
    // bulk insert users
    const res = await this.memberRepo.insertMany(guildMembers)
    console.log(`Inserted ${res.length} guild members`)
    // eslint-disable-next-line no-var
    // var i = 0,
    //   len = users.length
    // while (i < len) {
    //   const user = users[i]
    //   const guilds = res.filter((gd) => gd.uid === user.uid)
    //   // user.guilds = guilds.map((gd) => plainToInstance(GuildData, gd))
    //   i++
    //   process.stdout.write(`Adding guilds to users: ${((i / len) * 100).toFixed(1)}% (${i}/${len})\r`)
    //   // process.stdout.clearLine(0)
    //   // process.stdout.cursorTo(0)
    // }
    // process.stdout.write('\n') // end the line
    // console.log(`Added all guilds to all users`)

    await this.userRepo.insertMany(users)
    console.log(`Inserted ${users.length} users`)
  }

  async wipeDatabase(): Promise<void> {
    await this.userRepo.deleteMany({}).exec()
    await this.memberRepo.deleteMany({}).exec()
    return Promise.resolve()
  }
}

// uid: 126
// guid: 560
