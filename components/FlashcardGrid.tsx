import React from 'react';
import { FlashcardData } from '../types';
import Flashcard from './Flashcard';
import { LoaderIcon } from './icons';

interface FlashcardGridProps {
  flashcards: FlashcardData[];
  isLoading: boolean;
  onSaveCard?: (card: FlashcardData) => void;
  savedFlashcards?: FlashcardData[];
  isDeckView?: boolean;
}

const FlashcardSkeleton: React.FC = () => (
    <div className="bg-white p-5 rounded-xl shadow-md border border-slate-200 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
        <div className="h-5 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="h-5 bg-slate-200 rounded w-full mb-3"></div>
        <div className="h-5 bg-slate-200 rounded w-3/4 mb-4"></div>
        <div className="h-12 bg-slate-200 rounded w-full"></div>
    </div>
);

const FlashcardGrid: React.FC<FlashcardGridProps> = ({ flashcards, isLoading, onSaveCard, savedFlashcards = [], isDeckView = false }) => {
  if (isLoading) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => <FlashcardSkeleton key={i} />)}
        </div>
    );
  }

  if (flashcards.length === 0) {
    const emptyStateMessage = isDeckView ? 
      {
        title: "Your deck is empty",
        subtitle: "Go to the 'Generator' to analyze text and save new flashcards."
      } :
      {
        title: "Flashcards will appear here",
        subtitle: "Enter some Chinese text and click 'Analyze Notes' to get started."
      };

    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-300 rounded-xl h-full min-h-[300px]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-slate-600">{emptyStateMessage.title}</h3>
        <p className="text-slate-500 mt-1">{emptyStateMessage.subtitle}</p>
      </div>
    );
  }

  const savedWords = new Set(savedFlashcards.map(c => c.word));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {flashcards.map((card, index) => (
        <Flashcard 
            key={`${card.word}-${index}`} 
            data={card} 
            onSave={onSaveCard ? () => onSaveCard(card) : undefined}
            isSaved={savedWords.has(card.word)}
        />
      ))}
    </div>
  );
};

export default FlashcardGrid;
