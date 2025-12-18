import React, { useEffect, useState } from 'react';
import type { Movie as GWMovie } from '../../components/GroupWatch/types';
import { useParams, useLocation } from 'react-router-dom';
import GroupWatch from './GroupWatch';
import { mockMovies } from '../../data/movies';
import { useMovieStore } from '../../store/movieStore';
import { getPlayableVideoUrl} from '../../services/movieApi';
import { useAuth } from '../../hooks/useAuth';


const API_BASE = import.meta.env.VITE_API_URL || 'https://virtualcinemabackend.onrender.com';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Helper function to extract title from URL
function extractTitleFromUrl(url: string): string {
  if (!url) return 'Movie';
  
  // Check for known movies
  if (url.includes('TearsOfSteel.mp4')) return 'Tears of Steel';
  if (url.includes('BigBuckBunny.mp4')) return 'Big Buck Bunny';
  if (url.includes('ElephantsDream.mp4')) return 'Elephants Dream';
  if (url.includes('Sintel.mp4')) return 'Sintel';
  if (url.includes('ForBiggerJoyrides.mp4')) return 'For Bigger Joyrides';
  
  // Extract from YouTube URLs
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      const videoId = params.get('v') || urlObj.pathname.split('/').pop();
      return `YouTube Video ${videoId}`;
    } catch {
      return 'YouTube Video';
    }
  }
  
  // Try to extract filename from URL
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || '';
    
    if (filename) {
      const title = filename
        .replace(/\.(mp4|mov|avi|mkv|webm|m3u8)$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
      
      return title || 'Movie';
    }
  } catch (error) {
    console.error('Failed to parse URL for title:', error);
  }
  
  return 'Movie';
}

// Domain type for movies used by GroupWatch
// Use the shared Movie type from GroupWatch component (ensures compatibility)
type Movie = GWMovie & { genre?: string[]; cast?: string[]; director?: string };

// NEW: Function to get movie by ID from various sources
async function getMovieById(movieId: string): Promise<Movie | null> {
  console.log(`🔍 Fetching movie by ID: ${movieId}`);
  
  try {
    // Try to fetch from TMDb API (if it's a TMDb ID)
    if (/^\d+$/.test(movieId)) {
      console.log('🌐 Trying TMDb API for movie ID:', movieId);
      try {
        const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
        if (TMDB_API_KEY) {
          const response = await fetch(
            `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=credits`
          );

          if (response.ok) {
            const data = (await response.json()) as Record<string, unknown>;
            console.log('✅ Found movie in TMDb:', data.title);

            const genres: string[] = Array.isArray(data.genres)
              ? (data.genres as unknown[]).map(g => (typeof g === 'object' && g ? String((g as Record<string, unknown>).name ?? '') : String(g)))
              : [];

            const credits = data.credits as Record<string, unknown> | undefined;
            let director = '';
            if (credits && Array.isArray(credits.crew)) {
              const crew = credits.crew as unknown[];
              const dir = crew.find(c => typeof c === 'object' && (c as Record<string, unknown>).job === 'Director');
              if (dir && typeof dir === 'object') director = String((dir as Record<string, unknown>).name ?? '');
            }

            return {
              id: String(data.id ?? movieId),
              title: String(data.title ?? extractTitleFromUrl(String(data.homepage ?? ''))),
              poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${String(data.poster_path)}` : 'https://picsum.photos/800/1200',
              year: parseInt(String((data.release_date as string | undefined)?.split('-')[0] ?? '2024')),
              description: String(data.overview ?? 'No description available'),
              genre: genres,
              duration: Number(data.runtime ?? 120),
              rating: Number(data.vote_average ?? 7.5),
              trailer: getPlayableVideoUrl(movieId),
              cast: [],
              director,
              src: getPlayableVideoUrl(movieId),
            } as Movie;
          }
        }
      } catch (tmdbError) {
        console.log('⚠️ TMDb fetch failed:', tmdbError);
      }
    }
    
    // Try OMDB API (if it looks like an IMDb ID)
    if (movieId.startsWith('tt')) {
      console.log('🌐 Trying OMDB API for IMDb ID:', movieId);
      try {
        const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY;
        if (OMDB_API_KEY) {
          const response = await fetch(
            `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${movieId}&plot=short`
          );

          if (response.ok) {
            const data = (await response.json()) as Record<string, unknown>;
            if (String(data.Response ?? '') === 'True') {
              console.log('✅ Found movie in OMDB:', data.Title);
              const genre = typeof data.Genre === 'string' ? data.Genre.split(', ').map(g => g.trim()) : [];
              const cast = typeof data.Actors === 'string' ? data.Actors.split(',').map(c => c.trim()) : [];

              return {
                id: String(data.imdbID ?? movieId),
                title: String(data.Title ?? extractTitleFromUrl(String(data.Website ?? ''))),
                poster: data.Poster && String(data.Poster) !== 'N/A' ? String(data.Poster) : 'https://picsum.photos/800/1200',
                year: parseInt(String(data.Year ?? '2024')) || 2024,
                description: String(data.Plot ?? 'No description available'),
                genre,
                duration: parseInt(String((data.Runtime as string | undefined)?.replace(' min', '') ?? '120')) || 120,
                rating: parseFloat(String(data.imdbRating ?? '7.5')) || 7.5,
                trailer: getPlayableVideoUrl(movieId),
                cast,
                director: String(data.Director ?? ''),
                src: getPlayableVideoUrl(movieId),
              } as Movie;
            }
          }
        }
      } catch (omdbError) {
        console.log('⚠️ OMDB fetch failed:', omdbError);
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error in getMovieById:', error);
    return null;
  }
}

// NEW: Enhanced movie processing for participants
const processMovieForProxy = (movieData: Partial<Movie> | null, isHost: boolean = false): Movie | null => {
  if (!movieData) return null;

  const fields = Object.keys(movieData as Record<string, unknown>);
  console.log(`🎬 Processing movie for ${isHost ? 'host' : 'participant'}:`, {
    id: movieData.id,
    title: movieData.title,
    originalSrc: movieData.src,
    originalTrailer: movieData.trailer,
    fields
  });

  const id = String(movieData.id ?? 'unknown');
  const src = String(movieData.src ?? movieData.trailer ?? getPlayableVideoUrl(id));

  const processed: Movie = {
    id,
    title: String(movieData.title ?? extractTitleFromUrl(src)),
    poster: String(movieData.poster ?? ''),
    year: Number(movieData.year ?? new Date().getFullYear()),
    description: String(movieData.description ?? ''),
    rating: Number(movieData.rating ?? 0),
    duration: Number(movieData.duration ?? 120),
    genre: Array.isArray(movieData.genre) ? (movieData.genre as string[]) : [],
    cast: Array.isArray(movieData.cast) ? (movieData.cast as string[]) : [],
    director: String(movieData.director ?? ''),
    src,
    trailer: String(movieData.trailer ?? src),
  };

  const srcStr = String(processed.src || '');
  const isYouTube = /youtube\.com|youtu\.be/.test(srcStr);
  const alreadyProxied = srcStr.startsWith(`${API_BASE}/proxy/video`) || srcStr.includes('/proxy/video?url=');

  if (srcStr && srcStr.startsWith('http') && !isYouTube && !alreadyProxied) {
    processed.src = `${API_BASE}/proxy/video?url=${encodeURIComponent(srcStr)}`;
    console.log('🔄 Proxied URL:', processed.src.substring(0, 100) + '...');
  }

  const trailerStr = String(processed.trailer || '');
  if (trailerStr && trailerStr !== srcStr && trailerStr.startsWith('http') && !isYouTube && !trailerStr.includes('/proxy/video')) {
    processed.trailer = `${API_BASE}/proxy/video?url=${encodeURIComponent(trailerStr)}`;
  }

  return processed;
};

const GroupWatchPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const q = useQuery();
  const movieId = q.get('movie') || '';
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const { movies } = useMovieStore();
  const { user, isAuthenticated } = useAuth();

  // Check if user needs to provide name
  useEffect(() => {
    // If user is authenticated, use their name
    if (isAuthenticated && user?.name) {
      setDisplayName(user.name);
      setShowNameInput(false);
      // Persist in localStorage for consistency
      localStorage.setItem(`displayName_${sessionId}`, user.name);
    } else if (isHost) {
      // Host should be authenticated (will be checked before group watch)
      setDisplayName(user?.name || null);
      setShowNameInput(false);
    } else {
      // If not host and not authenticated, check localStorage first
      const savedName = localStorage.getItem(`displayName_${sessionId}`);
      if (savedName) {
        setDisplayName(savedName);
        setShowNameInput(false);
      } else if (!displayName) {
        // Ask for name if not saved and not already set
        setShowNameInput(true);
      }
    }
  }, [isAuthenticated, user, isHost, sessionId, displayName]);

  useEffect(() => {
    const loadMovie = async () => {
      try {
        console.log('🔍 GroupWatchPage - Loading movie for ID:', movieId);
        
        // 1. Check state from navigation (this is where HOST comes from)
        const stateMovie = (location.state as Record<string, unknown> | undefined)?.movie as Partial<Movie> | undefined;
        if (stateMovie) {
          console.log('📦 Using movie from navigation state (HOST PATH)');
          setIsHost(true);
          // Host should be authenticated, use their name
          if (isAuthenticated && user?.name) {
            setDisplayName(user.name);
            setShowNameInput(false);
          }
          const processedMovie = processMovieForProxy(stateMovie, true);
          setMovie(processedMovie);
          setLoading(false);
          return;
        }

        // 2. Check in local store
        let foundMovie = (movies as unknown as Movie[]).find((m) => String(m.id) === String(movieId));
        if (foundMovie) {
          console.log('🏪 Found movie in local store');
          const processedMovie = processMovieForProxy(foundMovie, false);
          setMovie(processedMovie);
          setLoading(false);
          return;
        }

        // 3. Check in mock movies
        foundMovie = (mockMovies as Movie[]).find((m) => m.id === movieId);
        if (foundMovie) {
          console.log('🎬 Found movie in mock data');
          const processedMovie = processMovieForProxy(foundMovie, false);
          setMovie(processedMovie);
          setLoading(false);
          return;
        }

        // 4. Try to fetch from API (for participants who only have movie ID)
        console.log('🌐 Fetching movie from external API...');
        const apiMovie = await getMovieById(movieId);
        if (apiMovie) {
          console.log('✅ Got movie from API:', apiMovie.title);
          const processedMovie = processMovieForProxy(apiMovie, false);
          setMovie(processedMovie);
          setLoading(false);
          return;
        }

        // 5. Create basic movie as last resort (PARTICIPANT PATH)
        console.log('🆕 Creating basic movie for participant (fallback)');
        const src = getPlayableVideoUrl(movieId || '0');
        const basicMovie = {
          id: movieId || 'unknown',
          title: extractTitleFromUrl(src),
          src: src,
          poster: '',
          year: new Date().getFullYear(),
          description: `Movie ID: ${movieId}`,
          rating: 7.0,
          duration: 120,
          genre: [],
          cast: [],
          director: '',
          trailer: src
        };
        
        const processedMovie = processMovieForProxy(basicMovie, false);
        setMovie(processedMovie);
        
      } catch (error) {
        console.error('❌ Error loading movie:', error);
        // Ultimate fallback
        const fallbackMovie = {
          id: movieId || 'unknown',
          title: 'Movie',
          src: getPlayableVideoUrl(movieId || '0'),
          poster: '',
          year: new Date().getFullYear(),
          description: '',
          rating: 0,
          duration: 120,
          genre: [],
          cast: [],
          director: '',
          trailer: getPlayableVideoUrl(movieId || '0')
        };
        const processedMovie = processMovieForProxy(fallbackMovie, false);
        setMovie(processedMovie);
      } finally {
        setLoading(false);
      }
    };

    loadMovie();
  }, [movieId, location.state, movies, isAuthenticated, user]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      const name = nameInput.trim();
      setDisplayName(name);
      setShowNameInput(false);
      // Persist in localStorage for rejoin convenience
      localStorage.setItem(`displayName_${sessionId}`, name);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-emerald-400 text-lg">Loading movie...</div>
      </div>
    );
  }

  if (showNameInput && !displayName) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="bg-gray-900 rounded-2xl border border-[#00bfa6]/30 p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-white mb-4">Join Stream</h2>
          <p className="text-gray-400 mb-6">Enter your name to join the group watch session</p>
          <form onSubmit={handleNameSubmit}>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00bfa6] mb-4"
              required
              autoFocus
            />
            <button
              type="submit"
              className="w-full px-4 py-3 bg-gradient-to-r from-[#00bfa6] to-[#00d1b0] text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-[#00bfa6]/30 transition-all"
            >
              Join Stream
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-red-400 text-lg">Movie not found</div>
      </div>
    );
  }

  if (!displayName) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-emerald-400 text-lg">Loading...</div>
      </div>
    );
  }

  // Final debug log
  console.log('🎬 GroupWatchPage - FINAL MOVIE OBJECT:', {
    id: movie.id,
    title: movie.title,
    year: movie.year,
    rating: movie.rating,
    duration: movie.duration,
    hasDescription: !!movie.description,
    hasPoster: !!movie.poster,
    src: movie.src ? movie.src.substring(0, 80) + (movie.src.length > 80 ? '...' : '') : '',
    trailer: movie.trailer ? movie.trailer.substring(0, 80) + (movie.trailer.length > 80 ? '...' : '') : '',
    isProxied: movie.src?.includes('/proxy/video'),
    genre: movie.genre,
    cast: movie.cast?.slice(0, 3),
    director: movie.director
  });

  return <GroupWatch movie={movie} sessionId={sessionId} displayName={displayName} />;
};

export default GroupWatchPage;