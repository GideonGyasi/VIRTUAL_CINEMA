import axios from 'axios';
import type { MovieDetails } from '../types/movie';

// Using OMDB free tier (limited requests)
// You can get a free API key at: http://www.omdbapi.com/apikey.aspx (1000 req/day)
const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY || '////b6003b13'; // Free key (limited)
const OMDB_BASE_URL = 'https://www.omdbapi.com';

// Using TMDb for better movie data
// Get free key at: https://www.themoviedb.org/settings/api
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

interface OmdbMovie {
  Title: string;
  Year: string;
  imdbID: string;
  Poster: string;
  Type: string;
}

// Add this near your other interfaces at the top
interface TmdbMovieResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string;
  vote_average: number;
}

interface TmdbGenre {
  id: number;
  name: string;
}




/**
 * Fetch movies from OMDB API (free tier, limited results)
 */
export async function fetchMoviesFromOmdb(): Promise<MovieDetails[]> {
  try {
    // Search for popular movies
    const searchTerms = ['The Matrix', 'Inception', 'Interstellar', 'Avatar', 'Titanic', 'The Avengers', 'Dune', 'Oppenheimer'];
    const movies: MovieDetails[] = [];

    for (const term of searchTerms) {
      try {
        const response = await axios.get(OMDB_BASE_URL, {
          params: {
            apikey: OMDB_API_KEY,
            s: term,
            type: 'movie',
            y: undefined,
          },
        });

        if (response.data.Search) {
          response.data.Search.slice(0, 2).forEach((movie: OmdbMovie) => {
            if (movie.Poster !== 'N/A') {
              movies.push({
                id: movie.imdbID,
                title: movie.Title,
                poster: movie.Poster,
                year: parseInt(movie.Year),
                description: `Fetched from OMDB - ${movie.Title}`,
                genre: [],
                duration: 120,
                rating: 7.5,
                trailer: '', // OMDB doesn't provide video URLs
                cast: [],
                director: '',
               // Will be filled with placeholder video
              });
            }
          });
        }
      } catch (e) {
        console.log(`OMDB search for "${term}" failed:`, e);
      }
    }

    return movies;
  } catch (error) {
    console.error('OMDB fetch failed:', error);
    return [];
  }
}

/**
 * Fetch movies from TMDb API (better data, requires API key)
 */
export async function fetchMoviesFromTmdb(): Promise<MovieDetails[]> {
  if (!TMDB_API_KEY) {
    console.log('TMDb API key not configured, skipping TMDb fetch');
    return [];
  }

  try {
    console.log('[🎬 MOVIE API] Fetching popular movies from TMDb...');
    
    // Fetch popular movies
    const popularResponse = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: 1,
      },
    });

    const movies = popularResponse.data.results || [];
    console.log(`[🎬 MOVIE API] Found ${movies.length} popular movies`);

    // Fetch detailed info for each movie to get genres and runtime
    const movieDetailsPromises = movies.slice(0, 20).map(async (movie: TmdbMovieResult) => {
      try {
        const detailResponse = await axios.get(`${TMDB_BASE_URL}/movie/${movie.id}`, {
          params: {
            api_key: TMDB_API_KEY,
            language: 'en-US',
          },
        });

        const details = detailResponse.data;
        
        return {
          id: String(movie.id),
          title: movie.title,
          poster: movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : 'https://picsum.photos/800/1200',
          year: parseInt(movie.release_date?.split('-')[0] || '2024'),
          description: movie.overview || 'No description available',
          genre: details.genres?.map((g: TmdbGenre) => g.name) || [],
          duration: details.runtime || 120,
          rating: parseFloat((movie.vote_average || 7.5).toFixed(1)),
          trailer: '',
          cast: [],
          director: '',
          src: '', // Will be filled with placeholder video
        };
      } catch (error) {
        console.error(`[🎬 MOVIE API] Failed to fetch details for movie ${movie.id}:`, error);
        // Return basic movie info if detailed fetch fails
        return {
          id: String(movie.id),
          title: movie.title,
          poster: movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : 'https://picsum.photos/800/1200',
          year: parseInt(movie.release_date?.split('-')[0] || '2024'),
          description: movie.overview || 'No description available',
          genre: [],
          duration: 120,
          rating: parseFloat((movie.vote_average || 7.5).toFixed(1)),
          trailer: '',
          cast: [],
          director: '',
          src: '',
        };
      }
    });

    const movieDetails = await Promise.all(movieDetailsPromises);
    console.log(`[🎬 MOVIE API] Successfully fetched ${movieDetails.length} movie details`);
    
    return movieDetails.filter(movie => movie.poster && movie.description);
  } catch (error) {
    console.error('[🎬 MOVIE API] TMDb fetch failed:', error);
    return [];
  }
}

/**
 * Fetch free sample videos (public domain or creative commons)
 * Returns a random sample video URL that works with react-player
 */
export function getPlayableVideoUrl(movieId: string): string {
  // These are free, public domain or creative commons videos that work with react-player
  const sampleVideos = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
  ];

  // Use movieId to deterministically select a video
  const idx = parseInt(movieId.replace(/\D/g, ''), 10) % sampleVideos.length;
  return sampleVideos[idx];
}

/**
 * Main function: fetch movies and attach playable videos
 */
export async function fetchMoviesWithVideos(): Promise<MovieDetails[]> {
  let movies: MovieDetails[] = [];

  // Try TMDb first (if API key available), then OMDB
  if (TMDB_API_KEY) {
    movies = await fetchMoviesFromTmdb();
  }

  // Fallback to OMDB
  if (movies.length === 0) {
    movies = await fetchMoviesFromOmdb();
  }

  // Attach playable video URLs to each movie
  return movies.map((movie) => ({
    ...movie,
    src: getPlayableVideoUrl(movie.id),
    trailer: getPlayableVideoUrl(movie.id),
  }));
}
