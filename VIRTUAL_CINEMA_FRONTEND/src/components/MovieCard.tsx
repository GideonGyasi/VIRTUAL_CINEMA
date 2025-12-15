import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Info, Users, Star, Clock } from 'lucide-react';
import MovieDetail from './MovieDetail';
import type { MovieDetails } from '../types/movie';

interface MovieCardProps {
  movie: MovieDetails;
  onWatchAlone?: () => void;
  onWatchWithFriends?: () => void;
  onCreateRoom?: (movieId: string) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onWatchAlone,
  onWatchWithFriends,
  onCreateRoom,
}) => {
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <motion.article
        className="group relative w-full"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Poster Container */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black shadow-2xl">
          {/* Poster Image */}
          <motion.div
            className="relative w-full aspect-[2/3] overflow-hidden"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-full h-full object-cover"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

            {/* Rating Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-lg border border-[#00bfa6]/30">
              <Star size={14} className="text-[#00bfa6] fill-[#00bfa6]" />
              <span className="text-xs font-bold text-white">
                {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}
              </span>
            </div>

            {/* Duration Badge */}
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-lg border border-gray-700/50">
              <div className="flex items-center gap-1">
                <Clock size={12} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-300">{movie.duration}m</span>
              </div>
            </div>

            {/* Hover Overlay with Actions */}
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {onWatchAlone && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onWatchAlone();
                  }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00bfa6] to-[#00d1b0] flex items-center justify-center text-black shadow-lg shadow-[#00bfa6]/40 hover:shadow-[#00bfa6]/60 transition-shadow"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Play size={24} fill="currentColor" />
                </motion.button>
              )}

              {onWatchWithFriends && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onWatchWithFriends();
                  }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white shadow-lg shadow-purple-600/40 hover:shadow-purple-600/60 transition-shadow"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Users size={24} />
                </motion.button>
              )}

              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(true);
                }}
                className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-black shadow-lg hover:bg-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Info size={24} />
              </motion.button>

              {onCreateRoom && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateRoom(movie.id);
                  }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/40 hover:shadow-blue-600/60 transition-shadow"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Users size={24} />
                </motion.button>
              )}
            </motion.div>
          </motion.div>

          {/* Movie Info */}
          <div className="p-4 space-y-2">
            <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-[#00bfa6] transition-colors">
              {movie.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{movie.year}</span>
              <span>•</span>
              <span className="line-clamp-1">
                {movie.genre && movie.genre.length > 0
                  ? movie.genre.slice(0, 2).join(' • ')
                  : 'Movie'}
              </span>
            </div>
          </div>
        </div>
      </motion.article>

      {/* Movie Detail Modal */}
      <MovieDetail open={open} movie={movie} onClose={() => setOpen(false)} />
    </>
  );
};

export default MovieCard;
