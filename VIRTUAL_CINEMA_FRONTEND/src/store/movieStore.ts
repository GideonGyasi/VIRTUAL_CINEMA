import { create } from 'zustand';
import type { Movie, MovieDetails } from '../types/movie';

interface MovieStore {
  movies: Movie[];
  selectedMovie: MovieDetails | null;
  loading: boolean;
  error: string | null;

  setMovies: (movies: Movie[]) => void;
  setSelectedMovie: (movie: MovieDetails | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useMovieStore = create<MovieStore>((set) => ({
  movies: [],
  selectedMovie: null,
  loading: false,
  error: null,

  setMovies: (movies) => set({ movies }),
  setSelectedMovie: (movie) => set({ selectedMovie: movie }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
