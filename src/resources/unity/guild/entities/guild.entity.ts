import { GuildSettingSchema, GuildSettings } from './settings/guildSettings.entity'
import { Prop, Schema } from '@nestjs/mongoose'
import { SchemaFactory } from '@nestjs/mongoose/dist'
import { HydratedDocument } from 'mongoose'

@Schema({ timestamps: true })
export class Guild {
  @Prop({ unique: true })
  guid: string

  @Prop()
  name: string

  @Prop({ type: GuildSettingSchema, default: () => ({}) })
  settings: GuildSettings

  @Prop()
  createdAt?: Date

  @Prop()
  updatedAt?: Date

  @Prop()
  deletedAt?: Date
}

export type GuildDocument = HydratedDocument<Guild>
export const GuildSchema = SchemaFactory.createForClass(Guild)
