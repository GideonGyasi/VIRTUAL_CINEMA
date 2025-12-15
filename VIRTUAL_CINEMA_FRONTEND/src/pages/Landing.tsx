import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Stack, Chip, Grid, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CategorySection from '../components/CategorySection';
import AuthModal from '../components/AuthModal';
import { fetchMoviesWithVideos } from '../services/movieApi';
import type { MovieDetails } from '../types/movie';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { Play, Users, Star, Clock, Popcorn, Film } from 'lucide-react';

const Landing: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [movies, setMovies] = useState<MovieDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch real movies from API
  useEffect(() => {
    async function loadMovies() {
      try {
        console.log('[🏠 LANDING] Fetching movies from API...');
        setLoading(true);
        setError(null);
        
        const fetchedMovies = await fetchMoviesWithVideos();
        console.log(`[🏠 LANDING] Successfully fetched ${fetchedMovies.length} movies`);
        
        if (fetchedMovies.length === 0) {
          console.warn('[🏠 LANDING] No movies fetched, check API configuration');
          setError('Unable to load movies. Please check your API configuration.');
        } else {
          setMovies(fetchedMovies);
        }
      } catch (err) {
        console.error('[🏠 LANDING] Error fetching movies:', err);
        setError('Failed to load movies. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadMovies();
  }, []);

  // Get featured movie (first movie) and categories
  const featuredMovie: MovieDetails | null = movies.length > 0 ? movies[0] : null;
  const categories = [
    { 
      title: 'Trending Now', 
      movies: movies.slice(0, 6),
      description: 'Most watched movies this week'
    },
    { 
      title: 'Popular Movies', 
      movies: movies.slice(6, 12),
      description: 'Popular content everyone is watching'
    }
  ];

  const handleWatchAlone = () => navigate('/home');
  const handleWatchWithFriends = () => setShowAuthModal(true);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#00bfa6', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#00bfa6' }}>
            Loading movies...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Error state
  if (error && movies.length === 0) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <Box sx={{ textAlign: 'center', maxWidth: 500, px: 3 }}>
          <Typography variant="h5" sx={{ color: '#00bfa6', mb: 2 }}>
            Unable to Load Movies
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{
              bgcolor: '#00bfa6',
              color: '#000000',
              '&:hover': { bgcolor: '#00d1b0' },
            }}
          >
            Retry
          </Button>
        </Box>
      </Box>
    );
  }

  // Fallback if no movies available
  if (movies.length === 0) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <Box sx={{ textAlign: 'center', maxWidth: 500, px: 3 }}>
          <Typography variant="h5" sx={{ color: '#00bfa6', mb: 2 }}>
            No Movies Available
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Please check your API configuration and try again.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-black">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00bfa6]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00bfa6]/5 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className={`transition-all duration-300 relative z-10 ${sidebarOpen ? 'md:ml-[280px]' : 'md:ml-0'}`}>
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Hero Section */}
        <div className="relative overflow-hidden pt-24 pb-12">
          <Box sx={{ position: 'relative', overflow: 'hidden', pt: 4, pb: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center" sx={{ minHeight: '80vh' }}>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                {/* Premium Badge */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    bgcolor: 'rgba(0, 191, 166, 0.1)',
                    border: '1px solid rgba(0, 191, 166, 0.3)',
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)'
                  }}>
                    <Popcorn size={20} color="#00bfa6" />
                    <Typography variant="caption" sx={{ color: '#00bfa6', fontWeight: 600, textTransform: 'uppercase' }}>
                      Premium Cinema Experience
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                    fontWeight: 800,
                    mb: 3,
                    lineHeight: 1.1,
                    background: 'linear-gradient(135deg, #ffffff 0%, #00bfa6 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    textShadow: '0 4px 20px rgba(0, 191, 166, 0.3)'
                  }}
                >
                  Experience Cinema
                  <Box component="span" sx={{ display: 'block', color: '#00bfa6' }}>
                    Together
                  </Box>
                </Typography>

                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 4, 
                    color: 'rgba(255,255,255,0.8)', 
                    maxWidth: 520,
                    fontSize: '1.1rem',
                    lineHeight: 1.6,
                    fontWeight: 400
                  }}
                >
                  Host synchronized watch parties in our premium virtual cinema. Create private rooms, 
                  chat in real-time, and enjoy movies together with crystal-clear synchronization.
                </Typography>

                {/* Action Buttons */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Play size={20} />}
                    sx={{
                      bgcolor: '#00bfa6',
                      color: '#000000',
                      '&:hover': { 
                        bgcolor: '#00d1b0',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(0, 191, 166, 0.4)'
                      },
                      transition: 'all 0.3s ease',
                      borderRadius: 2,
                      fontWeight: 700,
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      minWidth: 200
                    }}
                    onClick={handleWatchAlone}
                  >
                    Explore Movies
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<Users size={20} />}
                    sx={{
                      color: '#00bfa6',
                      borderColor: 'rgba(0, 191, 166, 0.5)',
                      '&:hover': { 
                        bgcolor: 'rgba(0, 191, 166, 0.1)',
                        borderColor: '#00bfa6',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease',
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      fontSize: '1rem',
                      minWidth: 200
                    }}
                    onClick={handleWatchWithFriends}
                  >
                    Start Cinema Party
                  </Button>
                </Stack>

                {/* Stats */}
                <Stack direction="row" spacing={3} sx={{ mt: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#00bfa6', fontWeight: 700 }}>
                      10K+
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Cinema Sessions
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#00bfa6', fontWeight: 700 }}>
                      50K+
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Happy Viewers
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#00bfa6', fontWeight: 700 }}>
                      99%
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Sync Accuracy
                    </Typography>
                  </Box>
                </Stack>
              </motion.div>
            </Grid>

            {featuredMovie && (
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      borderRadius: 4,
                      overflow: 'hidden',
                      boxShadow: `
                        0 0 0 1px rgba(0, 191, 166, 0.2),
                        0 25px 50px -12px rgba(0, 0, 0, 0.8),
                        0 0 50px rgba(0, 191, 166, 0.1)
                      `,
                      cursor: 'pointer',
                      transform: 'perspective(1000px) rotateX(5deg)',
                      transition: 'all 0.4s ease',
                      '&:hover': {
                        transform: 'perspective(1000px) rotateX(0deg) translateY(-10px)',
                        boxShadow: `
                          0 0 0 1px rgba(0, 191, 166, 0.4),
                          0 35px 60px -12px rgba(0, 0, 0, 0.9),
                          0 0 80px rgba(0, 191, 166, 0.2)
                        `
                      }
                    }}
                  >
                    {/* Featured Movie Image */}
                    <Box
                      component="img"
                      src={featuredMovie.poster}
                      alt={featuredMovie.title}
                      sx={{
                        width: '100%',
                        display: 'block',
                        objectFit: 'cover',
                        height: { xs: 400, md: 500 },
                        filter: 'brightness(0.9)'
                      }}
                    />

                    {/* Gradient Overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(45deg, rgba(0,0,0,0.4) 0%, transparent 50%, rgba(0,0,0,0.6) 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        p: 4
                      }}
                    >
                      {/* Movie Info */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                          {featuredMovie.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                          {featuredMovie.genre && featuredMovie.genre.length > 0 
                            ? featuredMovie.genre.join(' • ') 
                            : 'Movie'}
                        </Typography>
                      </Box>

                      {/* Movie Metadata */}
                      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                          icon={<Star size={16} />}
                            label={`${typeof featuredMovie.rating === 'number' ? featuredMovie.rating.toFixed(1) : featuredMovie.rating}/10`}
                          sx={{ 
                            bgcolor: 'rgba(0, 191, 166, 0.2)', 
                            color: '#00bfa6', 
                            fontWeight: 600,
                            border: '1px solid rgba(0, 191, 166, 0.3)'
                          }}
                          size="small"
                        />
                        <Chip
                          icon={<Clock size={16} />}
                          label={`${featuredMovie.duration} min`}
                          sx={{ 
                            bgcolor: 'rgba(255,255,255,0.1)', 
                            color: 'white', 
                            fontWeight: 600,
                            border: '1px solid rgba(255,255,255,0.2)'
                          }}
                          size="small"
                        />
                        <Chip
                          label={`${featuredMovie.year}`}
                          sx={{ 
                            bgcolor: 'rgba(255,255,255,0.1)', 
                            color: 'white', 
                            fontWeight: 600,
                            border: '1px solid rgba(255,255,255,0.2)'
                          }}
                          size="small"
                        />
                      </Stack>

                      {/* Watch Now Button */}
                      <Button
                        variant="contained"
                        startIcon={<Play size={20} />}
                        sx={{
                          bgcolor: '#00bfa6',
                          color: '#000000',
                          '&:hover': { bgcolor: '#00d1b0' },
                          borderRadius: 2,
                          fontWeight: 700,
                          alignSelf: 'flex-start'
                        }}
                        onClick={handleWatchAlone}
                      >
                        Watch Now
                      </Button>
                    </Box>

                    {/* Cinema Badge */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        bgcolor: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(0, 191, 166, 0.3)',
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <Film size={16} color="#00bfa6" />
                      <Typography variant="caption" sx={{ color: '#00bfa6', fontWeight: 600 }}>
                        FEATURED
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            )}
          </Grid>
        </Container>
          </Box>

          {/* Categories Section */}
          <Box sx={{ py: 8, position: 'relative' }}>
            <Container maxWidth="lg">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Box sx={{ textAlign: 'center', mb: 6 }}>
                  <Typography
                    variant="h2"
                    sx={{
                      fontSize: { xs: '2rem', md: '2.5rem' },
                      fontWeight: 700,
                      mb: 2,
                      background: 'linear-gradient(135deg, #ffffff 0%, #00bfa6 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent'
                    }}
                  >
                    Curated Collections
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 600, mx: 'auto' }}>
                    Discover hand-picked movies perfect for your next virtual cinema experience
                  </Typography>
                </Box>

                {categories.some(cat => cat.movies.length > 0) ? (
                  <CategorySection
                    categories={categories.filter(cat => cat.movies.length > 0)}
                    onWatchAlone={handleWatchAlone}
                    onWatchWithFriends={handleWatchWithFriends}
                  />
                ) : (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      No movies available in categories yet
                    </Typography>
                  </Box>
                )}
              </motion.div>
            </Container>
          </Box>

          {/* CTA Section */}
          <Box sx={{ py: 8, position: 'relative' }}>
            <Container maxWidth="md">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 6,
                    bgcolor: 'rgba(0, 191, 166, 0.05)',
                    border: '1px solid rgba(0, 191, 166, 0.2)',
                    borderRadius: 4,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Popcorn size={48} color="#00bfa6" style={{ margin: '0 auto 20px' }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#00bfa6' }}>
                    Ready for Movie Night?
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4, maxWidth: 500, mx: 'auto' }}>
                    Create your virtual cinema room and invite friends for an unforgettable watching experience
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Users size={20} />}
                    sx={{
                      bgcolor: '#00bfa6',
                      color: '#000000',
                      '&:hover': { 
                        bgcolor: '#00d1b0',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(0, 191, 166, 0.4)'
                      },
                      transition: 'all 0.3s ease',
                      borderRadius: 2,
                      fontWeight: 700,
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem'
                    }}
                    onClick={handleWatchWithFriends}
                  >
                    Start Your Cinema Party
                  </Button>
                </Box>
              </motion.div>
            </Container>
          </Box>
        </div>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    </div>
  );
};

export default Landing;