import { HydratedDocument, SchemaTypes } from 'mongoose'
import { Prop, Schema } from '@nestjs/mongoose'
import { GuildMember } from 'src/resources/unity/guild/entities/member.entity'
import { SchemaFactory } from '@nestjs/mongoose/dist'

export enum UserRole {
  'BANNED' = 0,
  'USER' = 1,
  'DEVELOPER' = 2,
  'OWNER' = 3,
  'CLIENT' = 4,
}

@Schema({ timestamps: true })
export class User {
  @Prop({ unique: true })
  uid: string

  @Prop({ default: UserRole.USER })
  role: UserRole

  // @Prop({ type: [SchemaTypes.ObjectId], ref: 'GuildData', default: [] })
  // guilds: GuildData[]

  @Prop()
  createdAt?: Date

  @Prop()
  updatedAt?: Date

  @Prop()
  deletedAt?: Date
}

export type UserDocument = HydratedDocument<User>
export const UserSchema = SchemaFactory.createForClass(User)
