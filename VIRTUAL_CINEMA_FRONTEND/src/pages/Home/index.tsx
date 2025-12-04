import React, { useEffect, useState } from 'react';
import { Container, Typography, Button, Box, Grid, Chip, Avatar, Skeleton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import type { Movie, MovieDetails } from '../../types/movie';
import { useNavigate } from 'react-router-dom';
import { useMovieStore } from '../../store/movieStore';
import { useAuth } from '../../hooks/useAuth';
import MovieCard from '../../components/MovieCard';
import { mockMovies } from '../../data/movies';
import { fetchMoviesWithVideos } from '../../services/movieApi';
import { LogOut, Users, Film, Star, Clock, Play, TrendingUp } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { movies, loading, setMovies } = useMovieStore();
  const [featuredMovie, setFeaturedMovie] = useState<MovieDetails | null>(null);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const apiMovies = await fetchMoviesWithVideos();
        if (apiMovies.length > 0) {
          setMovies(apiMovies as unknown as Movie[]);
          setFeaturedMovie(apiMovies[0] as unknown as MovieDetails);
        } else {
          setMovies(mockMovies as unknown as Movie[]);
          setFeaturedMovie(mockMovies[0] as MovieDetails);
        }
      } catch (error) {
        console.error('Failed to fetch movies:', error);
        setMovies(mockMovies as unknown as Movie[]);
        setFeaturedMovie(mockMovies[0] as MovieDetails);
      }
    };
    
    loadMovies();
  }, [setMovies]);

  const handleCreateRoom = (movieId: string) => {
    const sessionId = Math.random().toString(36).slice(2, 12);
    const source = (movies && movies.length) ? movies : (mockMovies as unknown as Movie[]);
    const movieObj = source.find((m: Movie) => String(m.id) === String(movieId));
    navigate(`/group/${sessionId}`, { state: { movie: movieObj } });
  };

  const handleQuickCinema = () => {
    if (featuredMovie) {
      handleCreateRoom(String(featuredMovie.id));
    }
  };

  const displayMovies = (movies && movies.length) ? (movies as unknown as MovieDetails[]) : (mockMovies as MovieDetails[]);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#000000',
      background: 'linear-gradient(135deg, #000000 0%, #001a00 30%, #000000 100%)',
      color: 'white',
      py: 4
    }}>
      <Container maxWidth="xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 6,
            p: 3,
            bgcolor: 'rgba(0, 191, 166, 0.05)',
            border: '1px solid rgba(0, 191, 166, 0.2)',
            borderRadius: 3,
            backdropFilter: 'blur(10px)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: 'rgba(0, 191, 166, 0.2)',
                  border: '1px solid rgba(0, 191, 166, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Film size={24} color="#00bfa6" />
                </Box>
                <Box>
                  <Typography variant="h4" component="h1" sx={{ 
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #ffffff 0%, #00bfa6 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent'
                  }}>
                    Welcome back
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                    {user?.username ?? 'Cinema Enthusiast'}
                  </Typography>
                </Box>
              </Box>
              
              {/* Quick Stats */}
              <Box sx={{ display: 'flex', gap: 3, ml: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#00bfa6', fontWeight: 700 }}>
                    {displayMovies.length}+
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Movies
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#00bfa6', fontWeight: 700 }}>
                    24/7
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    Available
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Button
              variant="outlined"
              startIcon={<LogOut size={20} />}
              onClick={logout}
              sx={{
                color: 'rgba(255,255,255,0.8)',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(255,255,255,0.5)'
                },
                borderRadius: 2,
                px: 3,
                py: 1
              }}
            >
              Logout
            </Button>
          </Box>
        </motion.div>

        {/* Featured Movie Section */}
        {featuredMovie && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Box sx={{ mb: 8 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3 
              }}>
                <Typography variant="h5" component="h2" sx={{ 
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <TrendingUp size={28} color="#00bfa6" />
                  Featured Cinema
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Play size={20} />}
                  onClick={handleQuickCinema}
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
                    py: 1.5
                  }}
                >
                  Start Cinema Session
                </Button>
              </Box>

              <Box sx={{
                position: 'relative',
                borderRadius: 4,
                overflow: 'hidden',
                bgcolor: 'rgba(0, 191, 166, 0.05)',
                border: '1px solid rgba(0, 191, 166, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <Grid container spacing={0}>
                  <Grid item xs={12} md={8}>
                    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                      <Typography variant="h3" component="h3" sx={{ 
                        fontWeight: 800,
                        mb: 2,
                        background: 'linear-gradient(135deg, #ffffff 0%, #00bfa6 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent'
                      }}>
                        {featuredMovie.title}
                      </Typography>
                      
                      <Typography variant="body1" sx={{ 
                        color: 'rgba(255,255,255,0.8)', 
                        mb: 3,
                        lineHeight: 1.6
                      }}>
                        {featuredMovie.description || 'Experience this masterpiece in our premium virtual cinema with friends and family.'}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                        <Chip
                          icon={<Star size={16} />}
                          label={`${featuredMovie.rating}/10`}
                          sx={{ 
                            bgcolor: 'rgba(0, 191, 166, 0.2)', 
                            color: '#00bfa6', 
                            fontWeight: 600,
                            border: '1px solid rgba(0, 191, 166, 0.3)'
                          }}
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
                        />
                        <Chip
                          label={featuredMovie.genre.join(' • ')}
                          sx={{ 
                            bgcolor: 'rgba(255,255,255,0.1)', 
                            color: 'white', 
                            fontWeight: 600,
                            border: '1px solid rgba(255,255,255,0.2)'
                          }}
                        />
                      </Box>

                      <Button
                        variant="outlined"
                        startIcon={<Users size={20} />}
                        onClick={handleQuickCinema}
                        sx={{
                          color: '#00bfa6',
                          borderColor: 'rgba(0, 191, 166, 0.5)',
                          '&:hover': { 
                            bgcolor: 'rgba(0, 191, 166, 0.1)',
                            borderColor: '#00bfa6'
                          },
                          borderRadius: 2,
                          fontWeight: 600,
                          alignSelf: 'flex-start',
                          px: 4,
                          py: 1.5
                        }}
                      >
                        Watch with Friends
                      </Button>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box
                      component="img"
                      src={featuredMovie.poster}
                      alt={featuredMovie.title}
                      sx={{
                        width: '100%',
                        height: 320,
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </motion.div>
        )}

        {/* Movies Grid Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" sx={{ 
              fontWeight: 700,
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <Film size={28} color="#00bfa6" />
              Cinema Collection
            </Typography>

            {loading ? (
              <Grid container spacing={3}>
                {[...Array(8)].map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                    <Skeleton 
                      variant="rounded" 
                      width="100%" 
                      height={400} 
                      sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} 
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Grid container spacing={3}>
                <AnimatePresence>
                  {displayMovies.map((movie, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={movie.id}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <MovieCard movie={movie} onCreateRoom={handleCreateRoom} />
                      </motion.div>
                    </Grid>
                  ))}
                </AnimatePresence>
              </Grid>
            )}
          </Box>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Box sx={{ 
            textAlign: 'center', 
            p: 6,
            bgcolor: 'rgba(0, 191, 166, 0.05)',
            border: '1px solid rgba(0, 191, 166, 0.2)',
            borderRadius: 4,
            backdropFilter: 'blur(10px)',
            mt: 4
          }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#00bfa6' }}>
              Ready for Movie Night?
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4 }}>
              Explore our full collection of movies and start your virtual cinema experience
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/movies')}
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
            >
              Browse All Movies
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Home;