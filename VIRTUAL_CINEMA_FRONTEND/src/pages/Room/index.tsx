import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, TextField, List, ListItem, ListItemText, Paper } from '@mui/material';
import { useRoom } from '../../hooks/useRoom';
import { useSocket } from '../../context/socketContext';
import type { SyncEvent, Message } from '../../types/room';

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { room, messages, sendMessage, sendSyncEvent } = useRoom(roomId || null);
  const { socket } = useSocket();
  const [message, setMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (socket) {
      socket.on('sync-event', (event: SyncEvent) => {
        if (event.type === 'play') {
          setIsPlaying(true);
          if (videoRef.current) {
            videoRef.current.currentTime = event.currentTime;
            videoRef.current.play();
          }
        } else if (event.type === 'pause') {
          setIsPlaying(false);
          if (videoRef.current) {
            videoRef.current.pause();
          }
        } else if (event.type === 'seek') {
          setCurrentTime(event.currentTime);
          if (videoRef.current) {
            videoRef.current.currentTime = event.currentTime;
          }
        }
      });

      socket.on('message', (msg: Message) => {
        // Handle incoming messages
        console.log('New message:', msg);
      });
    }

    return () => {
      if (socket) {
        socket.off('sync-event');
        socket.off('message');
      }
    };
  }, [socket]);

  const handlePlayPause = () => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    sendSyncEvent({
      type: newIsPlaying ? 'play' : 'pause',
      currentTime: currentTime,
      userId: 'current-user', // Replace with actual user ID
    });
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    sendSyncEvent({
      type: 'seek',
      currentTime: newTime,
      userId: 'current-user', // Replace with actual user ID
    });
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  if (!room) {
    return <Typography>Loading room...</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Box sx={{ flex: 1, p: 2 }}>
        <Typography variant="h4" gutterBottom>
          {room.name}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <video
            ref={videoRef}
            controls
            style={{ width: '100%', maxHeight: '60vh' }}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          >
            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button variant="contained" onClick={handlePlayPause}>
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button variant="outlined" onClick={() => handleSeek(currentTime + 10)}>
            +10s
          </Button>
          <Button variant="outlined" onClick={() => handleSeek(currentTime - 10)}>
            -10s
          </Button>
        </Box>
        <Typography variant="body2">
          Participants: {room.participants.length}
        </Typography>
      </Box>
      <Paper sx={{ width: 300, p: 2, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>
          Chat
        </Typography>
        <List sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
          {messages.map((msg) => (
            <ListItem key={msg.id}>
              <ListItemText
                primary={`${msg.username}: ${msg.content}`}
                secondary={new Date(msg.timestamp).toLocaleTimeString()}
              />
            </ListItem>
          ))}
        </List>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
          />
          <Button variant="contained" onClick={handleSendMessage}>
            Send
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Room;
