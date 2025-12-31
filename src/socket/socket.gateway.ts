import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketService } from './socket.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class SocketGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private socketService: SocketService) {}

  afterInit(server: Server) {
    this.socketService.setServer(server); // ✅ ADDED
  }

  handleConnection(client: Socket) {
    console.log('🔌 Connected:', client.id);
    // ⚠️ frontend must join room: mailbox:{id}
  }
  // for testing
  @SubscribeMessage('join')
  handleJoin(client: Socket, payload: { mailbox_id: number }) {
    client.join(`mailbox:${payload.mailbox_id}`);
    console.log(`📬 Joined mailbox:${payload.mailbox_id}`);
  }
}
