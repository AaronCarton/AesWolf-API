import { Body, Controller, Post, Res } from '@nestjs/common'
import { ImagePayload } from '@interfaces/payloads.interface'
import { ImageService } from './image.service'

@Controller()
export class Imagecontroller {
  constructor(private readonly utilService: ImageService) {}

  @Post('level')
  async getHello(@Body() payload: ImagePayload, @Res() response) {
    console.log(payload)
    const image = await this.utilService.getLevelImage(payload)
    return image.pipe(response)
  }
}
