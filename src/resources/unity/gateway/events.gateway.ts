import { Logger } from '@nestjs/common'
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { LevelUpEventPayload } from '@interfaces/payloads.interface'

@WebSocketGateway({ namespace: 'unity' })
export class UnityEventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server
  private botSocket: Socket

  constructor(private readonly logger: Logger) {}

  sendLevelUpEvent(payload: LevelUpEventPayload) {
    this.logger.debug(`Emitted MEMBER_LEVEL_UP ${JSON.stringify(payload, null, 4)}`, 'Unity WS')
    this.server.emit('MEMBER_LEVEL_UP', payload) // TODO: change to emit to BOT instead of all clients
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`client disconnected ${client.id}`, 'Unity WS')
    // if (client.id === this.botSocket.id) {
    //   console.log('bot disconnected')
    //   this.botSocket = undefined
    // }
  }
  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`connected ${client.id} with auth ${client.handshake.headers.authorization}`, 'Unity WS')

    if (client.handshake.headers.authorization === process.env.BOT_TOKEN) {
      this.botSocket = client
      this.logger.log(`BOT connected`, 'Unity WS')
      client.conn.on('heartbeat', () => {
        this.logger.verbose(`BOT heartbeat received`, 'Unity WS')
      })
    }
  }
}
