import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthService } from './services/auth.service';
import { RoomService } from './services/room.service';
import logger from './utils/logger';
import { SocketUser, SocketEvents } from './types';

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

// PERFECT SYNC: Room state storage with movie support
const roomStates = new Map<string, {
  videoTime: number;
  isPlaying: boolean;
  lastUpdate: number;
  playbackRate: number;
  hostId: string | null;
  participants: any[];
  messages: any[];
  movie: any | null;
}>();

export function initializeSocket(io: SocketIOServer) {
  // Middleware for authentication
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      // Allow guests (users without token)
      if (!token) {
        socket.user = {
          id: `guest_${socket.id}`,
          username: `Guest_${Math.random().toString(36).slice(2, 6)}`,
          avatar: null
        };
        return next();
      }
      
      // Verify JWT token and load user
      const payload: any = AuthService.verifyToken(token);
      const user = await AuthService.getUserById(payload.uid);
      if (!user) throw new Error('User not found');

      socket.user = user;
      logger.info(`Socket authenticated for user: ${user.id}`);
      next();
    } catch (error) {
      logger.error('Socket authentication failed', error);
      // Still allow connection as guest
      socket.user = {
        id: `guest_${socket.id}`,
        username: `Guest_${Math.random().toString(36).slice(2, 6)}`,
        avatar: null
      };
      next();
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user!;
    logger.info(`[${socket.id}] User connected: ${user.id} (${user.username})`);

    // DEBUG: Log all incoming events
    const originalOn = socket.on;
    socket.on = function(event: string, listener: (...args: any[]) => void) {
      const wrappedListener = (...args: any[]) => {
        logger.debug(`[${socket.id}] 📥 INCOMING: ${event}`, {
          userId: user.id,
          username: user.username,
          data: args[0] ? JSON.parse(JSON.stringify(args[0])) : null,
          timestamp: new Date().toISOString()
        });
        return listener.apply(this, args);
      };
      return originalOn.call(this, event, wrappedListener);
    };

    // DEBUG: Log all outgoing events
    const originalEmit = socket.emit;
    socket.emit = function(event: string, ...args: any[]) {
      logger.debug(`[${socket.id}] 📤 OUTGOING to ${user.id}: ${event}`, {
        event,
        userId: user.id,
        username: user.username,
        data: args[0] ? JSON.parse(JSON.stringify(args[0])) : null,
        timestamp: new Date().toISOString()
      });
      return originalEmit.apply(this, [event, ...args]);
    };

    // DEBUG: Log broadcasts
    const originalTo = socket.to;
    socket.to = function(room: string) {
      const toResult = originalTo.call(this, room);
      const originalEmitTo = toResult.emit;
      toResult.emit = function(event: string, ...args: any[]) {
        logger.debug(`[${socket.id}] 📡 BROADCAST to room ${room}: ${event}`, {
          event,
          fromUser: user.id,
          fromUsername: user.username,
          data: args[0] ? JSON.parse(JSON.stringify(args[0])) : null,
          timestamp: new Date().toISOString()
        });
        return originalEmitTo.apply(this, [event, ...args]);
      };
      return toResult;
    };

    // PERFECT SYNC: Join room with full state sync including movie
    socket.on('room:join', async (data: { sessionId: string; movie?: any }) => {
      try {
        const { sessionId, movie } = data;
        
        logger.info(`[${socket.id}] 🚀 room:join received`, {
          sessionId,
          user: user.id,
          username: user.username,
          isHost: !roomStates.has(sessionId),
          movieTitle: movie?.title || 'No movie provided',
          movieId: movie?.id || 'No ID',
          movieFields: movie ? Object.keys(movie) : []
        });

        // Initialize room state if doesn't exist
        if (!roomStates.has(sessionId)) {
          roomStates.set(sessionId, {
            videoTime: 0,
            isPlaying: false,
            lastUpdate: Date.now(),
            playbackRate: 1,
            hostId: user.id, // First person is host
            participants: [],
            messages: [],
            movie: movie || null // Store initial movie if provided
          });
          logger.info(`[${socket.id}] 🆕 Created new room ${sessionId}, host: ${user.id}`);
        }

        const roomState = roomStates.get(sessionId)!;
        
        // Check if user is first to join (becomes host if current host left)
        if (roomState.participants.length === 0) {
          roomState.hostId = user.id;
          logger.info(`[${socket.id}] 👑 User became host (first or host left)`);
        }

        // CRITICAL FIX: Handle movie data properly
        const isHost = roomState.hostId === user.id;
        
        if (movie) {
          if (isHost) {
            // Host provides the authoritative movie data
            roomState.movie = movie;
            logger.info(`[${socket.id}] 🎬 Host updated movie data:`, {
              title: movie.title || 'Unknown',
              id: movie.id,
              fields: Object.keys(movie),
              previousTitle: roomState.movie?.title || 'None'
            });
          } else if (roomState.movie) {
            // Participant joining with partial data - log what they're missing
            const missingFields = Object.keys(roomState.movie).filter(key => !movie[key]);
            if (missingFields.length > 0) {
              logger.info(`[${socket.id}] 🎯 Participant missing fields that room has:`, {
                participantMovieId: movie.id,
                roomMovieId: roomState.movie.id,
                missingFields,
                participantHas: Object.keys(movie),
                roomHas: Object.keys(roomState.movie)
              });
            }
            // Don't override room's movie with participant's partial data
          } else if (!roomState.movie && movie.id) {
            // Room has no movie yet, but participant has at least an ID - store it
            roomState.movie = { id: movie.id, ...movie };
            logger.info(`[${socket.id}] 📝 First movie data in room from participant:`, {
              id: movie.id,
              fields: Object.keys(movie)
            });
          }
        }

        // Add participant
        const participant = {
          id: user.id,
          name: user.username,
          avatar: user.avatar,
          socketId: socket.id,
          muted: false,
          cameraOn: true,
          isHost: isHost
        };
        
        // Remove if already exists (reconnection)
        const existingIndex = roomState.participants.findIndex(p => p.id === user.id);
        if (existingIndex !== -1) {
          logger.info(`[${socket.id}] 🔄 Reconnection detected, updating socket ID`);
          roomState.participants[existingIndex].socketId = socket.id;
        } else {
          roomState.participants.push(participant);
        }

        // Join socket room
        socket.join(sessionId);

        // PERFECT SYNC: Calculate current video time accounting for elapsed time
        const currentTime = roomState.isPlaying 
          ? roomState.videoTime + (Date.now() - roomState.lastUpdate) / 1000 * roomState.playbackRate
          : roomState.videoTime;

        // CRITICAL FIX: Always send room's movie data in sync
        // This ensures participants receive full metadata from host
        const syncMovie = roomState.movie || movie;
        
        // DEBUG: Log the exact state being sent to participant
        const syncData = {
          videoTime: currentTime,
          isPlaying: roomState.isPlaying,
          playbackRate: roomState.playbackRate,
          participants: roomState.participants,
          messages: roomState.messages.slice(-50),
          isHost: participant.isHost,
          hostId: roomState.hostId,
          joinedAt: Date.now(),
          movie: syncMovie  // Use room's movie data (or fallback to incoming)
        };

        logger.info(`[${socket.id}] 📤 Sending room:sync to ${user.id}`, {
          sessionId,
          user: user.id,
          isHost: participant.isHost,
          videoTime: currentTime.toFixed(2),
          isPlaying: roomState.isPlaying,
          playbackRate: roomState.playbackRate,
          participantsCount: roomState.participants.length,
          movieSource: roomState.movie ? 'roomState (host-provided)' : 'incoming (fallback)',
          movieTitle: syncMovie?.title || 'None',
          movieId: syncMovie?.id || 'No ID',
          movieFields: syncMovie ? Object.keys(syncMovie) : [],
          syncDataSummary: {
            hasMovie: !!syncMovie,
            movieTitle: syncMovie?.title,
            participantsCount: syncData.participants.length,
            hostId: syncData.hostId,
            isHost: syncData.isHost
          }
        });

        // Send FULL STATE to the new joiner immediately (INCLUDING MOVIE)
        socket.emit('room:sync', syncData);

        // Notify all participants about the new joiner
        io.to(sessionId).emit('room:participants', roomState.participants);
        
        // Notify others that someone joined (for UI updates)
        socket.to(sessionId).emit('room:participant:joined', participant);

        logger.info(`[${socket.id}] ✅ ${user.id} joined room ${sessionId} successfully`, {
          totalParticipants: roomState.participants.length,
          participants: roomState.participants.map(p => ({
            id: p.id,
            name: p.name,
            isHost: p.isHost
          })),
          roomStateSnapshot: {
            videoTime: roomState.videoTime,
            isPlaying: roomState.isPlaying,
            lastUpdate: new Date(roomState.lastUpdate).toISOString(),
            hasMovie: !!roomState.movie,
            movieTitle: roomState.movie?.title,
            movieId: roomState.movie?.id
          }
        });

      } catch (error) {
        logger.error(`[${socket.id}] ❌ Error joining room`, error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Movie update event (host only) - for when host changes movie mid-session
    socket.on('room:movie:update', (data: { sessionId: string; movie: any }) => {
      const { sessionId, movie } = data;
      const roomState = roomStates.get(sessionId);
      
      if (roomState && roomState.hostId === user.id) {
        logger.info(`[${socket.id}] 🎬 Host changing movie in room ${sessionId}`, {
          from: roomState.movie?.title || 'None',
          to: movie.title || 'Unknown',
          hostId: user.id,
          participantsCount: roomState.participants.length
        });
        
        // Only host can update movie
        roomState.movie = movie;
        
        // Reset playback state for NEW movie
        roomState.videoTime = 0;
        roomState.isPlaying = false;
        roomState.lastUpdate = Date.now();
        
        // Broadcast to all participants (including host)
        io.to(sessionId).emit('room:movie:update', movie);
      } else if (roomState) {
        logger.warn(`[${socket.id}] ⚠️ Non-host tried to change movie`, {
          user: user.id,
          actualHost: roomState.hostId,
          sessionId
        });
      }
    });

    // PERFECT SYNC: Video play with timestamp
    socket.on('room:video:play', (data: { sessionId: string; time: number }) => {
      const { sessionId, time } = data;
      const roomState = roomStates.get(sessionId);
      
      if (roomState) {
        logger.debug(`[${socket.id}] ▶️ Video play in room ${sessionId}`, {
          user: user.id,
          time: time.toFixed(2),
          previousState: { videoTime: roomState.videoTime, isPlaying: roomState.isPlaying }
        });
        
        // Update room state with current time
        roomState.videoTime = time;
        roomState.isPlaying = true;
        roomState.lastUpdate = Date.now();
        
        // Broadcast with timestamp for perfect sync (to others only)
        socket.to(sessionId).emit('room:video:play', {
          time,
          userId: user.id,
          at: Date.now(),
          hostTime: roomState.videoTime
        });
      }
    });

    // PERFECT SYNC: Video pause with timestamp
    socket.on('room:video:pause', (data: { sessionId: string; time: number }) => {
      const { sessionId, time } = data;
      const roomState = roomStates.get(sessionId);
      
      if (roomState) {
        logger.debug(`[${socket.id}] ⏸️ Video pause in room ${sessionId}`, {
          user: user.id,
          time: time.toFixed(2),
          previousState: { videoTime: roomState.videoTime, isPlaying: roomState.isPlaying }
        });
        
        // Calculate exact time when paused
        roomState.videoTime = time;
        roomState.isPlaying = false;
        roomState.lastUpdate = Date.now();
        
        // Broadcast with timestamp (to others only)
        socket.to(sessionId).emit('room:video:pause', {
          time,
          userId: user.id,
          at: Date.now(),
          hostTime: roomState.videoTime
        });
      }
    });

    // PERFECT SYNC: Video seek with timestamp
    socket.on('room:video:seek', (data: { sessionId: string; time: number }) => {
      const { sessionId, time } = data;
      const roomState = roomStates.get(sessionId);
      
      if (roomState) {
        logger.debug(`[${socket.id}] 🎯 Video seek in room ${sessionId}`, {
          user: user.id,
          from: roomState.videoTime.toFixed(2),
          to: time.toFixed(2),
          difference: (time - roomState.videoTime).toFixed(2)
        });
        
        roomState.videoTime = time;
        roomState.lastUpdate = Date.now();
        
        socket.to(sessionId).emit('room:video:seek', {
          time,
          userId: user.id,
          at: Date.now(),
          hostTime: roomState.videoTime
        });
      }
    });

    // PERFECT SYNC: Host periodic sync (only host sends this)
    socket.on('room:video:sync', (data: { sessionId: string; time: number; isPlaying: boolean; playbackRate: number }) => {
      const { sessionId, time, isPlaying, playbackRate } = data;
      const roomState = roomStates.get(sessionId);
      
      if (roomState && roomState.hostId === user.id) {
        logger.debug(`[${socket.id}] 🔄 Host sync in room ${sessionId}`, {
          time: time.toFixed(2),
          isPlaying,
          playbackRate,
          participants: roomState.participants.length - 1 // excluding host
        });
        
        // Update room state from host
        roomState.videoTime = time;
        roomState.isPlaying = isPlaying;
        roomState.playbackRate = playbackRate || 1;
        roomState.lastUpdate = Date.now();
        
        // Forward sync to all non-host participants
        socket.to(sessionId).emit('room:video:sync', {
          time,
          isPlaying,
          playbackRate: playbackRate || 1,
          at: Date.now(),
          hostId: user.id
        });
      }
    });

    // Chat message event
    socket.on('room:chat:message', async (data: { sessionId: string; message: any }) => {
      try {
        const { sessionId, message } = data;
        const roomState = roomStates.get(sessionId);
        
        if (roomState) {
          const msgData = {
            id: message.id || `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            userId: user.id,
            name: user.username,
            text: message.text,
            at: new Date().toISOString()
          };
          
          roomState.messages.push(msgData);
          
          // Emit to all participants in the room
          io.to(sessionId).emit('room:chat:message', msgData);
        }
      } catch (error) {
        logger.error('Error sending chat message', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Status update (mute/camera)
    socket.on('room:status', (data: { sessionId: string; muted?: boolean; cameraOn?: boolean }) => {
      const { sessionId, muted, cameraOn } = data;
      const roomState = roomStates.get(sessionId);
      
      if (roomState) {
        const participant = roomState.participants.find((p: any) => p.id === user.id);
        if (participant) {
          if (muted !== undefined) participant.muted = muted;
          if (cameraOn !== undefined) participant.cameraOn = cameraOn;
          io.to(sessionId).emit('room:participants', roomState.participants);
        }
      }
    });

    // Reaction event
    socket.on('room:emoji:reaction', (data: { sessionId: string; emoji: string }) => {
      const { sessionId, emoji } = data;
      const roomState = roomStates.get(sessionId);
      
      if (roomState) {
        io.to(sessionId).emit('room:emoji:reaction', {
          userId: user.id,
          name: user.username,
          emoji,
          at: new Date().toISOString()
        });
      }
    });

    // Leave room event
    socket.on('room:leave', (data: { sessionId: string }) => {
      try {
        const { sessionId } = data;
        const roomState = roomStates.get(sessionId);
        
        if (roomState) {
          logger.info(`[${socket.id}] 👋 ${user.id} leaving room ${sessionId}`, {
            user: user.id,
            wasHost: roomState.hostId === user.id,
            participantsBefore: roomState.participants.length
          });
          
          // Remove participant
          roomState.participants = roomState.participants.filter((p: any) => p.id !== user.id);
          
          // If host left, assign new host (first participant)
          if (roomState.hostId === user.id && roomState.participants.length > 0) {
            roomState.hostId = roomState.participants[0].id;
            roomState.participants[0].isHost = true;
            logger.info(`[${socket.id}] 👑 New host assigned: ${roomState.hostId}`);
          }
          
          // Notify all participants
          io.to(sessionId).emit('room:participants', roomState.participants);
          
          // Leave socket room
          socket.leave(sessionId);
          
          // Clean up empty rooms
          if (roomState.participants.length === 0) {
            roomStates.delete(sessionId);
            logger.info(`[${socket.id}] 🗑️ Room ${sessionId} deleted (no participants)`);
          }
        }
      } catch (error) {
        logger.error('Error leaving room', error);
        socket.emit('error', { message: 'Failed to leave room' });
      }
    });

    // PERFECT SYNC: Request current state (for reconnects or late joiners)
    socket.on('room:sync:request', (data: { sessionId: string }) => {
      const { sessionId } = data;
      const roomState = roomStates.get(sessionId);
      
      if (roomState) {
        logger.info(`[${socket.id}] 🔄 Sync requested by ${user.id} for room ${sessionId}`);
        
        // Calculate current video time
        const currentTime = roomState.isPlaying 
          ? roomState.videoTime + (Date.now() - roomState.lastUpdate) / 1000 * roomState.playbackRate
          : roomState.videoTime;
        
        socket.emit('room:sync', {
          videoTime: currentTime,
          isPlaying: roomState.isPlaying,
          playbackRate: roomState.playbackRate,
          participants: roomState.participants,
          messages: roomState.messages.slice(-50),
          isHost: roomState.hostId === user.id,
          hostId: roomState.hostId,
          movie: roomState.movie
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`[${socket.id}] 🔌 User disconnected: ${user.id} (${user.username})`);
      
      // Find all rooms this user is in and remove them
      roomStates.forEach((roomState, sessionId) => {
        const participantIndex = roomState.participants.findIndex((p: any) => p.id === user.id);
        if (participantIndex !== -1) {
          logger.info(`[${socket.id}] 👤 Removing ${user.id} from room ${sessionId}`, {
            user: user.id,
            wasHost: roomState.hostId === user.id,
            remainingParticipants: roomState.participants.length - 1
          });
          
          // Remove participant
          roomState.participants.splice(participantIndex, 1);
          
          // If host disconnected, assign new host
          if (roomState.hostId === user.id && roomState.participants.length > 0) {
            roomState.hostId = roomState.participants[0].id;
            roomState.participants[0].isHost = true;
            logger.info(`[${socket.id}] 👑 New host assigned after disconnect: ${roomState.hostId}`);
          }
          
          // Notify others
          io.to(sessionId).emit('room:participants', roomState.participants);
          
          // Clean up empty rooms
          if (roomState.participants.length === 0) {
            roomStates.delete(sessionId);
            logger.info(`[${socket.id}] 🗑️ Room ${sessionId} deleted after disconnect`);
          }
        }
      });
    });
  });
}