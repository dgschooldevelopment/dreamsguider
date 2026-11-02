import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;
// Map user ID to their connected socket ID(s)
const userSockets = new Map<string, Set<string>>();

export const initSocket = (httpServer: HttpServer, clientOrigin: string) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: clientOrigin || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Client sends their userId on connection
    socket.on('join_user', (userId: string) => {
      if (!userId) return;
      socket.join(`user_${userId}`);
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)?.add(socket.id);
    });

    socket.on('disconnect', () => {
      // Clean up
      for (const [userId, sockets] of userSockets.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSockets.delete(userId);
          }
          break;
        }
      }
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => io;

// Send real-time notification to a specific user
export const emitNotificationToUser = (userId: string, notification: any) => {
  if (io) {
    io.to(`user_${userId}`).emit('new_notification', notification);
  }
};

// Send real-time notification to multiple users
export const emitNotificationToUsers = (userIds: string[], notification: any) => {
  if (io) {
    userIds.forEach((userId) => {
      io?.to(`user_${userId}`).emit('new_notification', notification);
    });
  }
};
