import React from 'react';
import { motion } from 'framer-motion';
import { Play, Info, Users, Command } from 'lucide-react';
import MovieDetail from './MovieDetail';
import type { MovieDetails } from '../types/movie';

interface MovieCardProps {
  movie: MovieDetails;
  onWatchAlone?: () => void;
  onWatchWithFriends?: () => void;
  onCreateRoom?: (movieId: string) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onWatchAlone, onWatchWithFriends, onCreateRoom }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <motion.article
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3 }}
      className="movie-card"
      style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
      }}
    >
      {/* Poster */}
      <div style={{ position: 'relative', width: '100%', height: '300px', overflow: 'hidden' }}>
        <img
          src={movie.poster}
          alt={movie.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.3s ease',
          }}
        />

        {/* Badges */}
        <div style={{
          position: 'absolute',
          top: 8,
          left: 8,
          background: 'rgba(0,0,0,0.6)',
          padding: '4px 8px',
          borderRadius: 12,
          fontWeight: 600,
          color: '#fff',
          fontSize: 12,
        }}>
          {movie.rating} ⭐
        </div>

        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(0,0,0,0.6)',
          padding: '4px 8px',
          borderRadius: 12,
          fontWeight: 600,
          color: '#fff',
          fontSize: 12,
        }}>
          {movie.duration}m
        </div>

        {/* Overlay Actions */}
        <motion.div
          className="movie-overlay"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            background: 'rgba(0,0,0,0.35)',
            gap: '12px',
          }}
        >
          {onWatchAlone && (
            <button
              onClick={onWatchAlone}
              title="Watch Alone"
              style={actionBtnStyle}
            >
              <Play size={20} />
            </button>
          )}

          {onWatchWithFriends && (
            <button
              onClick={onWatchWithFriends}
              title="Watch with Friends"
              style={actionBtnStyle}
            >
              <Users size={20} />
            </button>
          )}

          <button
            onClick={() => setOpen(true)}
            title="Details"
            style={actionBtnStyle}
          >
            <Info size={20} />
          </button>

          {onCreateRoom && (
            <button
              onClick={() => onCreateRoom(movie.id)}
              title="Create Room"
              style={actionBtnStyle}
            >
              <Command size={20} />
            </button>
          )}
        </motion.div>
      </div>

      {/* Movie Info */}
      <div style={{ padding: '12px 8px' }}>
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'white' }}>{movie.title}</h3>
        <p style={{ margin: 2, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
          {movie.year} · {movie.genre.slice(0, 2).join(' · ')}
        </p>
      </div>

      {/* Movie Detail Modal */}
      <MovieDetail open={open} movie={movie} onClose={() => setOpen(false)} />
    </motion.article>
  );
};

// Neumorphic / glass action button style
const actionBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  border: 'none',
  borderRadius: '50%',
  width: 44,
  height: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#00bfa6',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  transition: 'transform 0.2s, background 0.2s',
  backdropFilter: 'blur(6px)',
};

export default MovieCard;
