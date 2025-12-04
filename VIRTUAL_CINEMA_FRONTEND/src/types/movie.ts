export interface Movie {
  id: string;
  title: string;
  description: string;
  poster: string;
  year: number;
  genre: string[];
  duration: number;
  rating: number;
}

export interface MovieDetails extends Movie {
  trailer: string;
  cast: string[];
  director: string;
}
