import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  private logger = new Logger('SOCKET');
  private server: Server;

  setServer(server: Server) {
    this.server = server;
    this.logger.log('Socket server attached ✅');
  }

  /** 🔔 Global emit (all clients) */
  emit(event: string, payload: any) {
    if (!this.server) return;
    this.server.emit(event, payload);
  }

  /** 📬 Mailbox-wise emit (THIS FIXES YOUR ERROR) */
  emitToMailbox(mailboxId: number, event: string, payload: any) {
    if (!this.server) {
      this.logger.error('Socket server not ready ❌');
      return;
    }

    const room = `mailbox:${mailboxId}`;
    this.logger.log(`Emit → ${event} → ${room}`);
    this.server.to(room).emit(event, payload);
  }
}
