import { Module, Logger } from '@nestjs/common'
import { UnityEventsGateway } from '../gateway/events.gateway'

@Module({
  imports: [],
  providers: [UnityEventsGateway, Logger],
  exports: [UnityEventsGateway],
})
export class UnityGatewayModule {}
