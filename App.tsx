import React, { useState, useEffect } from 'react';
import { generateFlashcards } from './services/geminiService';
import { FlashcardData } from './types';
import InputForm from './components/InputForm';
import FlashcardGrid from './components/FlashcardGrid';
import MyDeck from './components/MyDeck';
import Lesson from './components/Lesson';
import { BookOpenIcon, SparklesIcon, DeckIcon, LessonIcon } from './components/icons';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let encoded = reader.result as string;
      encoded = encoded.substring(encoded.indexOf(',') + 1);
      resolve(encoded);
    };
    reader.onerror = (error) => reject(error);
  });

type View = 'generator' | 'deck' | 'lesson';

const App: React.FC = () => {
  const [generatedFlashcards, setGeneratedFlashcards] = useState<FlashcardData[]>([]);
  const [savedFlashcards, setSavedFlashcards] = useState<FlashcardData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('generator');
  const [analysisSourceImage, setAnalysisSourceImage] = useState<string | null>(null);
  const [autoSave, setAutoSave] = useState(false);


  useEffect(() => {
    try {
      const savedCards = localStorage.getItem('savedFlashcards');
      if (savedCards) {
        setSavedFlashcards(JSON.parse(savedCards));
      }
    } catch (e) {
      console.error("Failed to load saved flashcards from localStorage", e);
    }
  }, []);

  useEffect(() => {
    if (autoSave && generatedFlashcards.length > 0) {
      const savedWords = new Set(savedFlashcards.map(c => c.word));
      const newCardsToSave = generatedFlashcards.filter(card => !savedWords.has(card.word))
        .map(card => ({ ...card, dateAdded: Date.now() }));

      if (newCardsToSave.length > 0) {
        const updatedDeck = [...savedFlashcards, ...newCardsToSave];
        setSavedFlashcards(updatedDeck);
        localStorage.setItem('savedFlashcards', JSON.stringify(updatedDeck));
      }
    }
  }, [generatedFlashcards, autoSave, savedFlashcards]);

  const handleAnalysis = async (text: string, imageFile?: File) => {
    if (!text.trim() && !imageFile) {
      setError('Please enter some Chinese text or upload an image to analyze.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedFlashcards([]);
    setAnalysisSourceImage(null);

    try {
      let imagePart;
      if (imageFile) {
        setAnalysisSourceImage(URL.createObjectURL(imageFile));
        const base64Data = await fileToBase64(imageFile);
        imagePart = {
          inlineData: {
            mimeType: imageFile.type,
            data: base64Data,
          },
        };
      }
      const result = await generateFlashcards(text, imagePart);
      setGeneratedFlashcards(result);
    } catch (err) {
      console.error(err);
      setError('Failed to generate flashcards. The model might be unable to parse the content or an API error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCard = (cardToSave: FlashcardData) => {
    const isAlreadySaved = savedFlashcards.some(card => card.word === cardToSave.word);
    if (!isAlreadySaved) {
      const cardWithDate = { ...cardToSave, dateAdded: Date.now() };
      const updatedDeck = [...savedFlashcards, cardWithDate];
      setSavedFlashcards(updatedDeck);
      localStorage.setItem('savedFlashcards', JSON.stringify(updatedDeck));
    }
  };

  const NavButton: React.FC<{ view: View; label: string; icon: React.ReactNode }> = ({ view, label, icon }) => (
    <button
      onClick={() => setCurrentView(view)}
      title={label} // For accessibility on mobile where label is hidden
      className={`flex items-center rounded-md font-semibold transition-colors duration-200 sm:space-x-2 p-2 sm:px-4 sm:py-2 ${
        currentView === view
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-slate-600 hover:bg-slate-200'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  const renderView = () => {
    switch(currentView) {
      case 'generator':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="lg:sticky lg:top-24 self-start">
                  <InputForm onAnalyze={handleAnalysis} isLoading={isLoading} />
              </div>

              <div className="min-h-[60vh] space-y-4">
                  {analysisSourceImage && (
                    <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200">
                      <h3 className="text-lg font-semibold mb-2 text-slate-800">Analyzed Image</h3>
                      <img src={analysisSourceImage} alt="Analyzed content" className="w-full rounded-lg max-h-64 object-contain border border-slate-300" />
                    </div>
                  )}
                  <div>
                      <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xl font-semibold flex items-center">
                              <SparklesIcon className="h-6 w-6 text-blue-500 mr-2"/>
                              Generated Flashcards
                          </h2>
                          <label className="flex items-center space-x-2 cursor-pointer text-sm text-slate-600">
                              <input 
                                  type="checkbox" 
                                  checked={autoSave} 
                                  onChange={(e) => setAutoSave(e.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                              />
                              <span>
                                <span className="sm:hidden">Auto-save</span>
                                <span className="hidden sm:inline">Auto-save new cards</span>
                              </span>
                          </label>
                      </div>

                      {error && (
                      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                          <p className="font-bold">Error</p>
                          <p>{error}</p>
                      </div>
                      )}
                      <FlashcardGrid 
                          flashcards={generatedFlashcards} 
                          isLoading={isLoading} 
                          onSaveCard={handleSaveCard}
                          savedFlashcards={savedFlashcards}
                      />
                  </div>
              </div>
          </div>
        );
      case 'deck':
        return <MyDeck savedFlashcards={savedFlashcards} />;
      case 'lesson':
        return <Lesson flashcards={savedFlashcards} />;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen font-sans text-slate-800">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <BookOpenIcon className="h-8 w-8 text-blue-600" />
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">ScanHanzi</h1>
                </div>
                <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 p-1 rounded-lg">
                   <NavButton view="generator" label="Generator" icon={<SparklesIcon className="h-5 w-5"/>} />
                   <NavButton view="deck" label="My Deck" icon={<DeckIcon className="h-5 w-5"/>} />
                   <NavButton view="lesson" label="Lesson" icon={<LessonIcon className="h-5 w-5"/>} />
                </nav>
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;