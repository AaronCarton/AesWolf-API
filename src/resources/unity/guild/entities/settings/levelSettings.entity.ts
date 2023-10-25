import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

export class LevelRole {
  @Prop()
  level: number

  @Prop()
  role: string
}

@Schema()
export class LevelSettings {
  @Prop({ default: 20 })
  minExp: number

  @Prop({ default: 30 })
  maxExp: number

  @Prop({ default: 0.12 })
  constant: number

  @Prop({ default: 1 })
  multiplier: number

  @Prop({ default: 1 })
  premiumMultiplier: number

  @Prop({ default: 30 })
  expCooldown: number

  @Prop({ default: '{{ member }} leveled up to {{ role }}!' })
  levelUpMessage: string

  @Prop({ default: [] })
  levelRoles: LevelRole[]

  @Prop({ default: [] })
  blacklistedChannels: string[]
}

export const LevelSettingSchema = SchemaFactory.createForClass(LevelSettings)
