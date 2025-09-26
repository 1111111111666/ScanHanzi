import React from 'react';
import { FlashcardData } from '../types';
import { SpeakerIcon, SaveIcon, CheckIcon } from './icons';

interface FlashcardProps {
  data: FlashcardData;
  onSave?: () => void;
  isSaved?: boolean;
}

const HSKBadge: React.FC<{ level: string }> = ({ level }) => {
  const levelNum = parseInt(level, 10);
  let colorClass = 'bg-slate-200 text-slate-700';
  if (!isNaN(levelNum)) {
    if (levelNum <= 2) colorClass = 'bg-green-100 text-green-800';
    else if (levelNum <= 4) colorClass = 'bg-yellow-100 text-yellow-800';
    else if (levelNum <= 6) colorClass = 'bg-red-100 text-red-800';
  }
  
  const displayText = level.toLowerCase() === 'unknown' ? 'Unknown' : `HSK ${level}`;

  return (
    <span className={`px-2.5 py-0.5 text-sm font-semibold rounded-full ${colorClass} whitespace-nowrap`}>
      {displayText}
    </span>
  );
};

const Flashcard: React.FC<FlashcardProps> = ({ data, onSave, isSaved }) => {
  const handleSpeak = (textToSpeak: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Sorry, your browser does not support text-to-speech.');
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200 flex flex-col">
      <div className="flex justify-between items-start mb-2 gap-4">
        <div className="flex items-center space-x-3 flex-shrink min-w-0">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 truncate" title={data.word}>{data.word}</h3>
              <p className="text-slate-500 text-lg">{data.pinyin}</p>
            </div>
            <button 
              onClick={() => handleSpeak(data.word)}
              className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-slate-100 flex-shrink-0"
              aria-label="Pronounce word"
            >
              <SpeakerIcon className="h-6 w-6" />
            </button>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
            <HSKBadge level={data.hsk_level} />
            {onSave && (
                <>
                {isSaved ? (
                    <span className="flex items-center text-sm font-semibold bg-green-100 text-green-700 py-1 px-2.5 rounded-full">
                        <CheckIcon className="h-4 w-4 mr-1"/>
                        Saved
                    </span>
                ) : (
                    <button
                    onClick={onSave}
                    className="flex items-center text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 py-1 px-2.5 rounded-full transition-colors"
                    aria-label="Save to deck"
                    >
                    <SaveIcon className="h-4 w-4 mr-1.5" />
                    Save
                    </button>
                )}
                </>
            )}
        </div>
      </div>

      <p className="text-slate-700 text-lg mb-4">
        <span className="font-semibold text-blue-600">RU:</span> {data.translation}
      </p>

      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex-grow">
        <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-semibold text-slate-600">Example Sentence:</p>
            <button
              onClick={() => handleSpeak(data.example_sentence)}
              className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-slate-100"
              aria-label="Pronounce sentence"
            >
                <SpeakerIcon className="h-5 w-5" />
            </button>
        </div>
        <p className="text-slate-800 mb-3 text-base">«{data.example_sentence}»</p>
        
        {data.notes && (
          <>
            <p className="text-sm font-semibold text-slate-600 mb-1 mt-3">Notes:</p>
            <p className="text-slate-800 text-base">{data.notes}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Flashcard;