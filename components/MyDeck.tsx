import React, { useState, useMemo } from 'react';
import { FlashcardData } from '../types';
import FlashcardGrid from './FlashcardGrid';
import { ChartIcon, FilterIcon, CalendarIcon, SearchIcon, LoaderIcon } from './icons';
import { findSimilarWords } from '../services/geminiService';

interface MyDeckProps {
  savedFlashcards: FlashcardData[];
}

const DashboardStats: React.FC<{ cards: FlashcardData[] }> = ({ cards }) => {
    const stats = useMemo(() => cards.reduce((acc, card) => {
        const level = card.hsk_level.toLowerCase();
        acc[level] = (acc[level] || 0) + 1;
        return acc;
    }, {} as Record<string, number>), [cards]);

    const hskLevels = ['1', '2', '3', '4', '5', '6', 'unknown'];
    const total = cards.length;

    const levelColors: Record<string, string> = {
        '1': 'bg-green-500', '2': 'bg-green-600',
        '3': 'bg-yellow-500', '4': 'bg-yellow-600',
        '5': 'bg-red-500', '6': 'bg-red-600',
        'unknown': 'bg-slate-500',
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
            <h3 className="text-xl font-semibold mb-4 text-slate-800 flex items-center">
                <ChartIcon className="h-6 w-6 mr-3 text-blue-600"/>
                Deck Statistics
            </h3>
            <div className="flex items-center space-x-4">
                <div className="text-center">
                    <p className="text-4xl font-bold text-slate-900">{total}</p>
                    <p className="text-sm font-medium text-slate-500">Total Cards</p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-10 flex overflow-hidden border border-slate-200">
                    {total > 0 && hskLevels.map(level => {
                        const count = stats[level] || 0;
                        if (count === 0) return null;
                        const width = (count / total) * 100;
                        return (
                            <div 
                                key={level} 
                                className={`flex items-center justify-center ${levelColors[level]} transition-all duration-300`} 
                                style={{ width: `${width}%` }}
                                title={`HSK ${level}: ${count} card(s) (${width.toFixed(1)}%)`}
                            >
                                <span className="text-white font-bold text-sm drop-shadow-sm">
                                    {count}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 mt-3 text-xs">
                {hskLevels.map(level => (
                    <div key={level} className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-1.5 ${levelColors[level]}`}></span>
                        <span className="font-semibold text-slate-600 uppercase">{level === 'unknown' ? 'N/A' : `HSK ${level}`}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

type SortMode = 'added' | 'hsk' | 'alphabetical';

const MyDeck: React.FC<MyDeckProps> = ({ savedFlashcards }) => {
  const [sortMode, setSortMode] = useState<SortMode>('added');
  const [hskFilter, setHskFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FlashcardData[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string|null>(null);

  const hskLevelsInDeck = useMemo(() => 
    ['all', ...Array.from(new Set(savedFlashcards.map(c => c.hsk_level))).sort()]
  , [savedFlashcards]);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    try {
        const matchingWords = await findSimilarWords(searchQuery, savedFlashcards);
        const results = savedFlashcards.filter(card => matchingWords.includes(card.word));
        setSearchResults(results);
    } catch(err) {
        setSearchError('AI search failed. Please try again.');
        setSearchResults([]);
    } finally {
        setIsSearching(false);
    }
  }
  
  const clearSearch = () => {
      setSearchQuery('');
      setSearchResults(null);
      setSearchError(null);
  }

  const handleSortChange = (newMode: SortMode) => {
    setSortMode(newMode);
    // Reset filters when changing mode to avoid confusion
    setDateFilter('');
    setHskFilter('all');
    clearSearch();
  };

  const displayedFlashcards = useMemo(() => {
    if (searchResults !== null) {
        return searchResults;
    }

    let cards = [...savedFlashcards];

    // Date Filtering
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      cards = cards.filter(card => {
        if (!card.dateAdded) return false;
        const cardDate = new Date(card.dateAdded);
        return cardDate.getFullYear() === filterDate.getFullYear() &&
               cardDate.getMonth() === filterDate.getMonth() &&
               cardDate.getDate() === filterDate.getDate();
      });
    }

    // HSK Filtering
    if (hskFilter !== 'all') {
      cards = cards.filter(card => card.hsk_level === hskFilter);
    }

    // Sorting
    switch (sortMode) {
      case 'hsk':
        cards.sort((a, b) => {
            const levelA = a.hsk_level === 'unknown' ? 7 : parseInt(a.hsk_level);
            const levelB = b.hsk_level === 'unknown' ? 7 : parseInt(b.hsk_level);
            return levelA - levelB;
        });
        break;
      case 'alphabetical':
        cards.sort((a, b) => a.pinyin.localeCompare(b.pinyin, 'zh-Hans-CN-pinyin'));
        break;
      case 'added':
      default:
        cards.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
        break;
    }

    return cards;
  }, [savedFlashcards, sortMode, hskFilter, dateFilter, searchResults]);

  return (
    <div className="space-y-8">
        <DashboardStats cards={savedFlashcards} />
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900">My Saved Flashcards</h2>
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                    <span className="text-sm font-semibold text-slate-500 pl-2">Sort by:</span>
                    <button onClick={() => handleSortChange('added')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${sortMode === 'added' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}>Date</button>
                    <button onClick={() => handleSortChange('hsk')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${sortMode === 'hsk' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}>HSK</button>
                    <button onClick={() => handleSortChange('alphabetical')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${sortMode === 'alphabetical' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}>Pinyin</button>
                </div>
            </div>

            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg min-h-[90px]">
                {sortMode === 'alphabetical' && (
                    <form onSubmit={handleSearch} className="flex flex-col gap-2">
                        <label className="font-semibold text-slate-700 flex items-center gap-2">
                            <SearchIcon className="h-5 w-5 text-slate-500" />
                            AI-Powered Search
                        </label>
                        <div className="flex gap-2">
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="e.g., 'sounds like...', 'yisi'" className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"/>
                            <button type="submit" disabled={isSearching} className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-slate-400 flex items-center">
                                {isSearching ? <LoaderIcon className="animate-spin h-5 w-5"/> : 'Find'}
                            </button>
                            {(searchResults !== null || searchError) && <button type="button" onClick={clearSearch} className="px-4 py-1.5 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700">Clear</button>}
                        </div>
                        {searchError && <p className="text-sm text-red-600">{searchError}</p>}
                    </form>
                )}

                {sortMode === 'added' && (
                    <div className="flex flex-col gap-2">
                        <label htmlFor="date-filter" className="font-semibold text-slate-700 flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-slate-500" />
                            Filter by Date Added
                        </label>
                        <div className="flex gap-2">
                            <input id="date-filter" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 md:max-w-xs"/>
                            {dateFilter && <button onClick={() => setDateFilter('')} className="px-4 py-1.5 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700">Clear</button>}
                        </div>
                    </div>
                )}
                
                {sortMode === 'hsk' && (
                    <div className="flex flex-wrap items-center gap-2">
                        <FilterIcon className="h-5 w-5 text-slate-500" />
                        <span className="font-semibold text-slate-700">Filter by HSK:</span>
                        {hskLevelsInDeck.map(level => (
                            <button 
                                key={level}
                                onClick={() => setHskFilter(level)}
                                className={`px-3 py-1 text-sm font-semibold rounded-full border-2 ${
                                    hskFilter === level 
                                        ? 'bg-blue-100 text-blue-800 border-blue-300' 
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                                }`}
                            >
                                {level === 'all' ? 'All' : (level === 'unknown' ? 'Unknown' : `HSK ${level}`)}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {searchResults !== null && (
                <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                    <p className="font-semibold text-blue-800">Showing {searchResults.length} AI search result(s) for "{searchQuery}"</p>
                </div>
            )}

            <FlashcardGrid flashcards={displayedFlashcards} isLoading={false} isDeckView={true} />
        </div>
    </div>
  );
};

export default MyDeck;