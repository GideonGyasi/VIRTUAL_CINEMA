import React from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import { Play, Star, Clock, X } from 'lucide-react';
import { motion } from 'framer-motion';
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
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0,
          bgcolor: 'transparent',
          boxShadow: 'none',
          maxHeight: '90vh',
          overflow: 'hidden',
        },
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {/* Banner Background */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            minHeight: '500px',
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.9)), url(${movie.poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            p: 6,
          }}
        >
          {/* Close Button */}
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/90 transition-colors z-10"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={20} />
          </motion.button>

          {/* Movie Info */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            {/* Title and Year */}
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2rem', md: '3.5rem' },
                fontWeight: 800,
                mb: 2,
                color: 'white',
                textShadow: '0 4px 20px rgba(0,0,0,0.8)',
              }}
            >
              {movie.title}
            </Typography>

            {/* Genres */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {movie.genre && movie.genre.length > 0 ? (
                movie.genre.map((g) => (
                  <Chip
                    key={g}
                    label={g}
                    sx={{
                      bgcolor: 'rgba(0, 191, 166, 0.2)',
                      color: '#00bfa6',
                      border: '1px solid rgba(0, 191, 166, 0.3)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  />
                ))
              ) : (
                <Chip
                  label="Movie"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                />
              )}
            </Box>

            {/* Metadata */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
              <Chip
                icon={<Star size={18} className="text-[#00bfa6]" />}
                label={`${typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}/10`}
                sx={{
                  bgcolor: 'rgba(0, 191, 166, 0.2)',
                  color: '#00bfa6',
                  border: '1px solid rgba(0, 191, 166, 0.3)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                }}
              />
              <Chip
                icon={<Clock size={18} className="text-gray-300" />}
                label={`${movie.duration} min`}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: 600,
                }}
              />
              <Chip
                label={movie.year}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: 600,
                }}
              />
            </Box>

            {/* Description */}
            {movie.description && (
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  mb: 4,
                  maxWidth: '800px',
                  lineHeight: 1.7,
                  fontSize: '1.1rem',
                }}
              >
                {movie.description}
              </Typography>
            )}

            {/* Watch Now Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="contained"
                startIcon={<Play size={24} fill="currentColor" />}
                sx={{
                  bgcolor: '#00bfa6',
                  color: '#000000',
                  px: 5,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  boxShadow: '0 8px 25px rgba(0, 191, 166, 0.4)',
                  '&:hover': {
                    bgcolor: '#00d1b0',
                    boxShadow: '0 12px 35px rgba(0, 191, 166, 0.5)',
                  },
                }}
              >
                Watch Now
              </Button>
            </motion.div>
          </motion.div>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default MovieDetail;
