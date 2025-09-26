import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FlashcardData } from '../types';
import { LessonIcon, PauseIcon, PlayIcon, ExitIcon } from './icons';

interface LessonProps {
  flashcards: FlashcardData[];
}

type LessonState = 'setup' | 'active' | 'summary';
type LessonMode = 'pinyinToHanzi' | 'hanziToPinyin' | 'translationToHanzi' | 'mixed';
type TurnMode = 'pinyinToHanzi' | 'hanziToPinyin' | 'translationToHanzi';

// Fisher-Yates shuffle algorithm
const shuffleArray = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

const LESSON_DURATION = 300; // 5 minutes in seconds
const LESSON_CARD_GOAL = 30;

const pinyinToneMarksToNumbers = (pinyin: string): string => {
    const toneMap: { [key: string]: [string, number] } = {
        'ā': ['a', 1], 'á': ['a', 2], 'ǎ': ['a', 3], 'à': ['a', 4],
        'ō': ['o', 1], 'ó': ['o', 2], 'ǒ': ['o', 3], 'ò': ['o', 4],
        'ē': ['e', 1], 'é': ['e', 2], 'ě': ['e', 3], 'è': ['e', 4],
        'ī': ['i', 1], 'í': ['i', 2], 'ǐ': ['i', 3], 'ì': ['i', 4],
        'ū': ['u', 1], 'ú': ['u', 2], 'ǔ': ['u', 3], 'ù': ['u', 4],
        'ǖ': ['v', 1], 'ǘ': ['v', 2], 'ǚ': ['v', 3], 'ǜ': ['v', 4],
        'ü': ['v', 5]
    };

    let syllables = pinyin.split(/(?<=[a-z])(?=[a-z])/i);
    return syllables.map(syllable => {
        let result = '';
        let tone = 5;
        let toneFound = false;
        for (const char of syllable) {
            if (toneMap[char]) {
                result += toneMap[char][0];
                tone = toneMap[char][1];
                toneFound = true;
            } else {
                result += char;
            }
        }
        return result + (toneFound ? tone : '');
    }).join('');
};

const Lesson: React.FC<LessonProps> = ({ flashcards }) => {
  const [lessonState, setLessonState] = useState<LessonState>('setup');
  const [lessonMode, setLessonMode] = useState<LessonMode>('hanziToPinyin');
  
  const [shuffledDeck, setShuffledDeck] = useState<FlashcardData[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentTurnMode, setCurrentTurnMode] = useState<TurnMode>('hanziToPinyin');
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'none'>('none');
  
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(LESSON_DURATION);
  const [cardsAnswered, setCardsAnswered] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [incorrectAnswers, setIncorrectAnswers] = useState<FlashcardData[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lessonState === 'active' && !isPaused && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && lessonState === 'active') {
      setLessonState('summary');
    }
  }, [lessonState, timeLeft, isPaused]);
  
  useEffect(() => {
    if (feedback !== 'none') {
        const timer = setTimeout(() => {
            setFeedback('none');
            setUserInput('');
            setCurrentCardIndex(prev => (prev + 1) % shuffledDeck.length);
            
            if (lessonMode === 'mixed') {
                const modes: TurnMode[] = ['hanziToPinyin', 'pinyinToHanzi', 'translationToHanzi'];
                setCurrentTurnMode(modes[Math.floor(Math.random() * modes.length)]);
            }

            inputRef.current?.focus();
        }, 1500);
        return () => clearTimeout(timer);
    }
  }, [feedback, shuffledDeck.length, lessonMode]);

  const handleStartLesson = () => {
    if (flashcards.length === 0) return;
    setScore(0);
    setTimeLeft(LESSON_DURATION);
    setIncorrectAnswers([]);
    setShuffledDeck(shuffleArray([...flashcards]));
    setCurrentCardIndex(0);
    setCardsAnswered(0);
    setIsPaused(false);
    
    if (lessonMode === 'mixed') {
        const modes: TurnMode[] = ['hanziToPinyin', 'pinyinToHanzi', 'translationToHanzi'];
        setCurrentTurnMode(modes[Math.floor(Math.random() * modes.length)]);
    } else {
        setCurrentTurnMode(lessonMode as TurnMode);
    }

    setLessonState('active');
    setTimeout(() => inputRef.current?.focus(), 100);
  };
  
  const handleCheckAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || feedback !== 'none') return;

    const currentCard = shuffledDeck[currentCardIndex];
    let isCorrect = false;
    const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, '');

    switch(currentTurnMode) {
      case 'hanziToPinyin':
        const correctPinyinWithMarks = normalize(currentCard.pinyin);
        const correctPinyinWithNumbers = pinyinToneMarksToNumbers(correctPinyinWithMarks);
        const correctPinyinNoTones = correctPinyinWithMarks.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const userInputNormalized = normalize(userInput);
        
        isCorrect = [correctPinyinWithMarks, correctPinyinWithNumbers, correctPinyinNoTones].includes(userInputNormalized);
        break;
      case 'pinyinToHanzi':
      case 'translationToHanzi':
        isCorrect = normalize(userInput) === normalize(currentCard.word);
        break;
    }

    setCardsAnswered(prev => prev + 1);
    if (isCorrect) {
      setScore(prev => prev + 1);
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
      setIncorrectAnswers(prev => {
        if (!prev.find(c => c.word === currentCard.word)) {
          return [...prev, currentCard];
        }
        return prev;
      });
    }
  };

  const currentCard = useMemo(() => {
    if (shuffledDeck.length > 0) {
      return shuffledDeck[currentCardIndex];
    }
    return null;
  }, [shuffledDeck, currentCardIndex]);
  
  const getPrompt = () => {
    if (!currentCard) return { question: '', type: '', answer: { hanzi: '', pinyin: '' }};
    const answer = { hanzi: currentCard.word, pinyin: currentCard.pinyin };

    switch (currentTurnMode) {
      case 'hanziToPinyin':
        return { question: currentCard.word, type: 'Pinyin', answer };
      case 'pinyinToHanzi':
        return { question: `${currentCard.pinyin} (${currentCard.translation})`, type: 'Characters (from Pinyin & RU)', answer };
      case 'translationToHanzi':
        return { question: currentCard.translation, type: 'Characters (from Russian)', answer };
      default:
        return { question: '', type: '', answer };
    }
  };

  if (lessonState === 'setup') {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
          <LessonIcon className="mx-auto h-16 w-16 text-blue-600 mb-4" />
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Practice Lesson</h2>
          <p className="text-slate-600 mb-6">Test your knowledge with a timed 5-minute quiz.</p>

          {flashcards.length > 0 ? (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Choose a mode:</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setLessonMode('hanziToPinyin')} className={`p-4 rounded-lg border-2 font-semibold transition-colors ${lessonMode === 'hanziToPinyin' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-slate-50 hover:border-slate-300'}`}>Hanzi → Pinyin</button>
                    <button onClick={() => setLessonMode('pinyinToHanzi')} className={`p-4 rounded-lg border-2 font-semibold transition-colors ${lessonMode === 'pinyinToHanzi' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-slate-50 hover:border-slate-300'}`}>Pinyin → Hanzi</button>
                    <button onClick={() => setLessonMode('translationToHanzi')} className={`p-4 rounded-lg border-2 font-semibold transition-colors ${lessonMode === 'translationToHanzi' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-slate-50 hover:border-slate-300'}`}>RU → Hanzi</button>
                    <button onClick={() => setLessonMode('mixed')} className={`p-4 rounded-lg border-2 font-semibold transition-colors ${lessonMode === 'mixed' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-slate-50 hover:border-slate-300'}`}>Mixed Mode</button>
                </div>
              </div>
              <button onClick={handleStartLesson} className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105">
                Start 5-Minute Lesson
              </button>
            </>
          ) : (
            <div className="bg-slate-100 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-700">Your deck is empty!</h3>
              <p className="text-slate-500 mt-1">Add some flashcards from the 'Generator' tab before you can start a lesson.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (lessonState === 'summary') {
    return (
        <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Lesson Complete!</h2>
                <p className="text-slate-600 mb-6">Great work. Here's how you did:</p>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg py-4 px-6 mb-6">
                    <p className="text-lg text-slate-600">Your Score</p>
                    <p className="text-6xl font-bold text-blue-600">{score}</p>
                </div>

                {incorrectAnswers.length > 0 && (
                    <div className="text-left">
                        <h3 className="text-lg font-semibold text-slate-800 mb-3">Words to Review:</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto bg-slate-50 p-3 rounded-lg border">
                            {incorrectAnswers.map(card => (
                                <div key={card.word} className="flex justify-between items-center bg-white p-2 rounded border">
                                    <span className="font-bold text-slate-700">{card.word}</span>
                                    <span className="text-slate-500">{card.pinyin}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <button onClick={() => setLessonState('setup')} className="w-full bg-slate-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-700 transition-transform transform hover:scale-105">
                        Choose Another Mode
                    </button>
                    <button onClick={handleStartLesson} className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105">
                        Practice Again
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // Active Lesson
  const prompt = getPrompt();
  const feedbackColor = feedback === 'correct' ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500';
  const progress = Math.min((cardsAnswered / LESSON_CARD_GOAL) * 100, 100);

  return (
    <div className="max-w-2xl mx-auto">
        <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center gap-4">
                <div className="text-xl font-bold">Score: <span className="text-blue-600">{score}</span></div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsPaused(!isPaused)} className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600">
                        {isPaused ? <PlayIcon className="h-5 w-5"/> : <PauseIcon className="h-5 w-5"/>}
                    </button>
                     <button onClick={() => setLessonState('setup')} className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600">
                        <ExitIcon className="h-5 w-5"/>
                    </button>
                </div>
                <div className="text-xl font-bold">Time: <span className="text-blue-600">{Math.floor(timeLeft / 60)}:{('0' + timeLeft % 60).slice(-2)}</span></div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4">
                <div className="bg-blue-600 h-4 rounded-full transition-all duration-300" style={{width: `${progress}%`}}></div>
            </div>
        </div>
        <div className={`relative bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center transition-colors duration-300 ${feedback !== 'none' ? feedbackColor : ''}`}>
            
            {isPaused && (
                <div className="absolute inset-0 bg-white/90 flex flex-col justify-center items-center rounded-xl z-10">
                    <h3 className="text-4xl font-bold text-slate-800">Paused</h3>
                    <button onClick={() => setIsPaused(false)} className="mt-4 flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700">
                        <PlayIcon className="h-5 w-5"/>
                        Resume
                    </button>
                </div>
            )}

            <p className="text-lg text-slate-500 mb-2">{prompt.type}</p>
            <p className="text-5xl font-bold text-slate-900 mb-8 min-h-[70px] flex items-center justify-center">{prompt.question}</p>
            
            <form onSubmit={handleCheckAnswer}>
                <input 
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your answer here..."
                    disabled={feedback !== 'none' || isPaused}
                    className="w-full text-center text-2xl p-4 border-2 bg-slate-100 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                />
                <button type="submit" disabled={feedback !== 'none' || isPaused} className="mt-4 w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-slate-400">Check</button>
            </form>

            {feedback === 'incorrect' && (
                <div className="mt-4 text-center font-semibold text-red-800">
                    Correct answer: <span className="text-2xl block">{prompt.answer.hanzi} ({prompt.answer.pinyin})</span>
                </div>
            )}
             {feedback === 'correct' && (
                <div className="mt-4 text-center font-semibold text-green-800 text-2xl">
                    Correct!
                </div>
            )}
        </div>
    </div>
  );
};

export default Lesson;