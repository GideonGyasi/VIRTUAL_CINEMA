import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Star, Clock, TrendingUp, Film } from 'lucide-react';
import type { Movie, MovieDetails } from '../../types/movie';
import { useMovieStore } from '../../store/movieStore';
import { useAuth } from '../../hooks/useAuth';
import MovieCard from '../../components/MovieCard';
import { mockMovies } from '../../data/movies';
import { fetchMoviesWithVideos } from '../../services/movieApi';
import AuthModal from '../../components/AuthModal';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const {  isAuthenticated } = useAuth();
  const { movies, loading, setMovies } = useMovieStore();
  const [featuredMovies, setFeaturedMovies] = useState<MovieDetails[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [trendingMovies, setTrendingMovies] = useState<MovieDetails[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingMovieId, setPendingMovieId] = useState<string | null>(null);
  // Browser setInterval returns a number; avoid NodeJS namespace to satisfy TS in browser envs
  const heroIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const apiMovies = await fetchMoviesWithVideos();
        if (apiMovies.length > 0) {
          setMovies(apiMovies as unknown as Movie[]);
          // Featured movies for hero carousel (first 5)
          setFeaturedMovies(apiMovies.slice(0, 5) as unknown as MovieDetails[]);
          // Trending movies (next 10)
          setTrendingMovies(apiMovies.slice(5, 15) as unknown as MovieDetails[]);
        } else {
          setMovies(mockMovies as unknown as Movie[]);
          setFeaturedMovies(mockMovies.slice(0, 5) as MovieDetails[]);
          setTrendingMovies(mockMovies.slice(5, 15) as MovieDetails[]);
        }
      } catch (error) {
        console.error('Failed to fetch movies:', error);
        setMovies(mockMovies as unknown as Movie[]);
        setFeaturedMovies(mockMovies.slice(0, 5) as MovieDetails[]);
        setTrendingMovies(mockMovies.slice(5, 15) as MovieDetails[]);
      }
    };
    
    loadMovies();
  }, [setMovies]);

  // Auto-rotate hero carousel
  useEffect(() => {
    if (featuredMovies.length > 1) {
      heroIntervalRef.current = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % featuredMovies.length);
      }, 5000);
    }
    return () => {
      if (heroIntervalRef.current) {
        clearInterval(heroIntervalRef.current);
      }
    };
  }, [featuredMovies.length]);

  const handleCreateRoom = (movieId: string) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setPendingMovieId(movieId);
      setShowAuthModal(true);
      return;
    }

    // User is authenticated, proceed with room creation
    const sessionId = Math.random().toString(36).slice(2, 12);
    const source = (movies && movies.length) ? movies : (mockMovies as unknown as Movie[]);
    const movieObj = source.find((m: Movie) => String(m.id) === String(movieId));
    navigate(`/group/${sessionId}`, { state: { movie: movieObj } });
  };

  // Handle auth success - check when auth modal closes and user is authenticated
  useEffect(() => {
    if (!showAuthModal && isAuthenticated && pendingMovieId) {
      const sessionId = Math.random().toString(36).slice(2, 12);
      const source = (movies && movies.length) ? movies : (mockMovies as unknown as Movie[]);
      const movieObj = source.find((m: Movie) => String(m.id) === String(pendingMovieId));
      if (movieObj) {
        navigate(`/group/${sessionId}`, { state: { movie: movieObj } });
        // Avoid calling setState synchronously inside effect body to prevent cascading renders
        // schedule the reset in the next tick
        setTimeout(() => setPendingMovieId(null), 0);
      }
    }
  }, [showAuthModal, isAuthenticated, pendingMovieId, movies, navigate]);

  const handleWatchNow = (movie: MovieDetails) => {
    handleCreateRoom(String(movie.id));
  };

  const nextHero = () => {
    setCurrentHeroIndex((prev) => (prev + 1) % featuredMovies.length);
    if (heroIntervalRef.current) {
      clearInterval(heroIntervalRef.current);
      heroIntervalRef.current = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % featuredMovies.length);
      }, 5000);
    }
  };

  const prevHero = () => {
    setCurrentHeroIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
    if (heroIntervalRef.current) {
      clearInterval(heroIntervalRef.current);
      heroIntervalRef.current = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % featuredMovies.length);
      }, 5000);
    }
  };

  const displayMovies = (movies && movies.length) ? (movies as unknown as MovieDetails[]) : (mockMovies as MovieDetails[]);
  const currentHero = featuredMovies[currentHeroIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Hero Banner Carousel */}
        {currentHero && (
        <motion.div
            key={currentHeroIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative h-[600px] md:h-[700px] rounded-3xl overflow-hidden mb-12 shadow-2xl"
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url(${currentHero.poster})`,
              }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />

            {/* Content */}
            <div className="relative h-full flex flex-col justify-end p-8 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl"
              >
                <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-2xl">
                  {currentHero.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#00bfa6]/20 backdrop-blur-sm rounded-lg border border-[#00bfa6]/30">
                    <Star size={18} className="text-[#00bfa6] fill-[#00bfa6]" />
                    <span className="text-sm font-bold text-white">
                      {typeof currentHero.rating === 'number' ? currentHero.rating.toFixed(1) : currentHero.rating}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                    <Clock size={16} className="text-gray-300" />
                    <span className="text-sm text-gray-300">{currentHero.duration}m</span>
                  </div>
                  <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                    <span className="text-sm text-gray-300">{currentHero.year}</span>
                  </div>
                  {currentHero.genre && currentHero.genre.length > 0 && (
                    <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                      <span className="text-sm text-gray-300">{currentHero.genre[0]}</span>
                    </div>
                  )}
                </div>

                {currentHero.description && (
                  <p className="text-lg text-gray-300 mb-8 line-clamp-3 max-w-xl">
                    {currentHero.description}
                  </p>
                )}

                <motion.button
                  onClick={() => handleWatchNow(currentHero)}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#00bfa6] to-[#00d1b0] text-black font-bold rounded-xl shadow-lg shadow-[#00bfa6]/40 hover:shadow-[#00bfa6]/60 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play size={24} fill="currentColor" />
                  <span className="text-lg">Watch Now</span>
                </motion.button>
              </motion.div>
            </div>

            {/* Navigation Arrows */}
            {featuredMovies.length > 1 && (
              <>
                <button
                  onClick={prevHero}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextHero}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Dots Indicator */}
            {featuredMovies.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {featuredMovies.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentHeroIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentHeroIndex
                        ? 'bg-[#00bfa6] w-8'
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Trending Now Section */}
        {trendingMovies.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp size={32} className="text-[#00bfa6]" />
              <h2 className="text-3xl font-bold text-white">Trending Now</h2>
            </div>
            
            <div className="overflow-x-auto pb-4 scrollbar-hide">
              <div className="flex gap-4">
                {trendingMovies.map((movie, index) => (
        <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex-shrink-0 w-[280px]"
                  >
                    <MovieCard movie={movie} onCreateRoom={handleCreateRoom} />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* All Movies Grid */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Film size={32} className="text-[#00bfa6]" />
            <h2 className="text-3xl font-bold text-white">All Movies</h2>
          </div>

            {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(10)].map((_, index) => (
                <div
                  key={index}
                  className="aspect-[2/3] bg-gray-900 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                <AnimatePresence>
                  {displayMovies.map((movie, index) => (
                      <motion.div
                    key={movie.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                      >
                        <MovieCard movie={movie} onCreateRoom={handleCreateRoom} />
                      </motion.div>
                  ))}
                </AnimatePresence>
            </div>
          )}
        </motion.section>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => {
          setShowAuthModal(false);
          setPendingMovieId(null);
        }} 
      />
    </div>
  );
};

export default Home;
