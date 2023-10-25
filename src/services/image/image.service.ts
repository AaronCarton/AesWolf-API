import { Injectable } from '@nestjs/common'
import { PNGStream } from 'canvas'
import { ImagePayload } from '@interfaces/payloads.interface'
import GenerateImage from './canvas/CanvasConstructor'

@Injectable()
export class ImageService {
  getHello(): string {
    return 'Hello World!'
  }

  async getLevelImage(payload: ImagePayload): Promise<PNGStream> {
    return await GenerateImage(payload)
  }
}
