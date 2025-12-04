import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import type { MovieDetails } from '../types/movie';

interface CategorySectionProps {
  categories: {
    title: string;
    movies: MovieDetails[];
  }[];
  onWatchAlone?: (movie: MovieDetails) => void;
  onWatchWithFriends?: (movie: MovieDetails) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  categories,
  onWatchAlone,
  onWatchWithFriends
}) => {
  return (
    <div className="space-y-10">
      {categories.map((category, index) => (
        <motion.section
          key={category.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.15 }}
          aria-labelledby={`cat-${index}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id={`cat-${index}`} className="text-2xl font-bold tracking-tight">{category.title}</h2>
          </div>

          <HorizontalScroller
            items={category.movies}
            onWatchAlone={onWatchAlone}
            onWatchWithFriends={onWatchWithFriends}
          />
        </motion.section>
      ))}
    </div>
  );
};

function HorizontalScroller({ items, onWatchAlone, onWatchWithFriends }: {
  items: MovieDetails[];
  onWatchAlone?: (movie: MovieDetails) => void;
  onWatchWithFriends?: (movie: MovieDetails) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const scroll = (dir: 'left' | 'right') => {
    const el = ref.current;
    if (!el) return;
    const cardWidth = el.querySelector('.movie-tile')?.clientWidth ?? 280;
    const gap = 16;
    const amount = (cardWidth + gap) * 3; // scroll 3 cards
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <button aria-label="Scroll left" onClick={() => scroll('left')} className="scroll-button left">
        <ChevronLeft />
      </button>

      <div ref={ref} className="category-scroll" role="list">
        {items.map((movie) => (
          <div key={movie.id} className="movie-tile" role="listitem">
            <MovieCard
              movie={movie}
              onWatchAlone={() => onWatchAlone?.(movie)}
              onWatchWithFriends={() => onWatchWithFriends?.(movie)}
            />
          </div>
        ))}
      </div>

      <button aria-label="Scroll right" onClick={() => scroll('right')} className="scroll-button right">
        <ChevronRight />
      </button>
    </div>
  );
}

export default CategorySection;
