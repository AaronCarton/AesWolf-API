import { CreateUserInput } from './dto/create-user.input'
import { UpdateUserInput } from './dto/update-user.input'
import { User, UserDocument } from './entities/user.entity'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose/dist'
import { Model } from 'mongoose'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userRepo: Model<UserDocument>,
  ) {}

  create(createUserInput: CreateUserInput): Promise<UserDocument> {
    const newUser = new this.userRepo(createUserInput)
    return newUser.save()
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepo.find().exec()
    return users
  }

  async findUserByUid(uid: string): Promise<UserDocument> {
    let user = await this.userRepo.findOne({ uid }, { _id: 0, __v: 0 }).exec()
    if (!user) user = await this.create({ uid })
    return user
  }

  async updateExp(uid: string, guid: string, exp: number): Promise<void> {
    await this.userRepo.updateOne({ uid, 'guilds.guid': guid }, { $inc: { 'guilds.$.exp': exp } }).exec()
  }

  async update(uid: string, updateUserInput: UpdateUserInput): Promise<User | null> {
    await this.userRepo.findOneAndUpdate({ uid }, updateUserInput).exec()
    return this.findUserByUid(uid)
  }

  remove(id: string) {
    return `This action removes a #${id} user`
  }
}
