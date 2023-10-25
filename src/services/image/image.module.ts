import { Module } from '@nestjs/common'
import { Imagecontroller } from './image.controller'
import { ImageService } from './image.service'

@Module({
  imports: [],
  controllers: [Imagecontroller],
  providers: [ImageService],
})
export class ImageModule {}
