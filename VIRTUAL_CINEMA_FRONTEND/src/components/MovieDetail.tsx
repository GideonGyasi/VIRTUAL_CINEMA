import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Box,
  Grid,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import type { MovieDetails } from '../types/movie';

interface Props {
  open: boolean;
  movie: MovieDetails | null;
  onClose: () => void;
}

const MovieDetail: React.FC<Props> = ({ open, movie, onClose }) => {
  if (!movie) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: 'rgba(20,20,30,0.95)',
          backdropFilter: 'blur(12px)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {movie.title}
        </Typography>
        <Chip label={movie.year} sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }} />
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box
              component="img"
              src={movie.poster}
              alt={movie.title}
              sx={{
                width: '100%',
                borderRadius: 2,
                boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
              }}
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              <Chip
                icon={<StarIcon />}
                label={movie.rating}
                sx={{ bgcolor: '#00bfa6', color: '#fff' }}
              />
              {movie.genre.map((g) => (
                <Chip
                  key={g}
                  label={g}
                  variant="outlined"
                  sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: 'rgba(255,255,255,0.9)' }}>
              {movie.description}
            </Typography>

            <Typography variant="body2" gutterBottom sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Director: {movie.director} • Cast: {movie.cast.join(', ')}
            </Typography>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                startIcon={<PlayCircleOutlineIcon />}
                sx={{
                  bgcolor: '#00bfa6',
                  color: 'white',
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#00d1b0', transform: 'scale(1.05)' },
                }}
              >
                Play Trailer
              </Button>

              <Button
                variant="outlined"
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                }}
              >
                Create Watch Room
              </Button>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'flex-end' }}>
        <Button
          onClick={onClose}
          sx={{
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MovieDetail;
