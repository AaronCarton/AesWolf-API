import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

@Schema({ timestamps: true })
export class GuildMember {
  @Prop()
  guid: string

  @Prop()
  uid: string

  @Prop({ default: 0, required: false })
  exp: number
}

export type GuildMemberDocument = HydratedDocument<GuildMember>
export const GuildMemberSchema = SchemaFactory.createForClass(GuildMember)
