import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { LevelSettingSchema, LevelSettings } from './levelSettings.entity'
@Schema()
export class GuildSettings {
  @Prop({ default: '!' })
  prefix: string

  // @Prop({ default: () => ({}), type: Object() })
  // welcomeSettings: { enabled: boolean; channel: string; message: string }

  @Prop({ default: null })
  adminRole?: string

  @Prop({ default: false })
  levelingEnabled: boolean

  @Prop({ default: () => ({}), type: LevelSettingSchema })
  levelSettings: LevelSettings
}

export const GuildSettingSchema = SchemaFactory.createForClass(GuildSettings)
