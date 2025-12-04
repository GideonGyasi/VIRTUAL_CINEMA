import prisma from '../prisma/client';
import { RoomData, MessageData, SocketUser } from '../types';
import logger from '../utils/logger';

export class RoomService {
  static async createRoom(
    title: string,
    youtubeUrl: string,
    privacy: 'public' | 'private',
    hostId: string
  ): Promise<RoomData> {
    try {
      const room = await prisma.room.create({
        data: {
          title,
          youtubeUrl,
          privacy,
          hostId,
        },
        include: {
          host: true,
          participants: {
            include: {
              user: true,
            },
          },
        },
      });

      // Add host as first participant
      await prisma.participant.create({
        data: {
          roomId: room.id,
          userId: hostId,
        },
      });

      logger.info(`Room created: ${room.id} by user ${hostId}`);

      return this.formatRoomData(room);
    } catch (error) {
      logger.error('Error creating room', error);
      throw error;
    }
  }

  static async getRoomById(roomId: string): Promise<RoomData | null> {
    try {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
          host: true,
          participants: {
            include: {
              user: true,
            },
          },
          messages: {
            include: {
              user: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!room) return null;

      return this.formatRoomData(room);
    } catch (error) {
      logger.error('Error getting room by ID', error);
      throw error;
    }
  }

  static async getPublicRooms(): Promise<RoomData[]> {
    try {
      const rooms = await prisma.room.findMany({
        where: { privacy: 'public' },
        include: {
          host: true,
          participants: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return rooms.map(room => this.formatRoomData(room));
    } catch (error) {
      logger.error('Error getting public rooms', error);
      throw error;
    }
  }

  static async addParticipant(roomId: string, userId: string): Promise<void> {
    try {
      // Check if participant already exists
      const existingParticipant = await prisma.participant.findUnique({
        where: {
          roomId_userId: {
            roomId,
            userId,
          },
        },
      });

      if (!existingParticipant) {
        await prisma.participant.create({
          data: {
            roomId,
            userId,
          },
        });
        logger.info(`User ${userId} added to room ${roomId}`);
      }
    } catch (error) {
      logger.error('Error adding participant', error);
      throw error;
    }
  }

  static async removeParticipant(roomId: string, userId: string): Promise<void> {
    try {
      await prisma.participant.deleteMany({
        where: {
          roomId,
          userId,
        },
      });
      logger.info(`User ${userId} removed from room ${roomId}`);
    } catch (error) {
      logger.error('Error removing participant', error);
      throw error;
    }
  }

  static async addMessage(roomId: string, userId: string, message: string): Promise<MessageData> {
    try {
      const messageData = await prisma.message.create({
        data: {
          roomId,
          userId,
          message,
        },
        include: {
          user: true,
        },
      });

      logger.info(`Message added to room ${roomId} by user ${userId}`);

      return {
        id: messageData.id,
        roomId: messageData.roomId,
        userId: messageData.userId,
        user: {
          id: messageData.user.id,
          name: messageData.user.name,
          email: messageData.user.email,
          photoURL: messageData.user.photoURL || undefined,
        },
        message: messageData.message,
        createdAt: messageData.createdAt,
      };
    } catch (error) {
      logger.error('Error adding message', error);
      throw error;
    }
  }

  private static formatRoomData(room: any): RoomData {
    return {
      id: room.id,
      title: room.title,
      youtubeUrl: room.youtubeUrl,
      privacy: room.privacy,
      hostId: room.hostId,
      host: {
        id: room.host.id,
        name: room.host.name,
        email: room.host.email,
        photoURL: room.host.photoURL || undefined,
      },
      participants: room.participants.map((p: any) => ({
        id: p.user.id,
        name: p.user.name,
        email: p.user.email,
        photoURL: p.user.photoURL || undefined,
      })),
      createdAt: room.createdAt,
    };
  }
}
