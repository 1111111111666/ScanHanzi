import React, { useState, useRef } from 'react';
import { AnalyzeIcon, LoaderIcon, UploadIcon } from './icons';

interface InputFormProps {
  onAnalyze: (text: string, imageFile?: File) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onAnalyze, isLoading }) => {
  const [text, setText] = useState<string>('我的名字是小明，我是一个学生。我喜欢学习中文，因为中文很有意思。昨天我去商店，我想买一个苹果，但是商店里没有苹果了。');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
      if (file && file.type.startsWith('image/')) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setText('');
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) processFile(file);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze(text, imageFile ?? undefined);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
      <form onSubmit={handleSubmit}>
        <h2 className="text-xl font-semibold mb-1 text-slate-800">Your Chinese Notes</h2>
        <p className="text-sm text-slate-500 mb-4">Enter text directly or upload a photo of your notes.</p>
        
        <div className="relative">
            <textarea
              value={text}
              onChange={(e) => {
                  setText(e.target.value);
                  if (imageFile) handleImageRemove();
              }}
              placeholder="Paste your Chinese text here..."
              className="w-full h-40 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 resize-y text-base bg-slate-100 text-slate-800"
              disabled={isLoading}
            />
        </div>

        <div className="my-4 text-center">
            <span className="text-sm font-semibold text-slate-400">OR</span>
        </div>

        {imagePreview ? (
            <div className="relative group">
                <img src={imagePreview} alt="Note preview" className="w-full rounded-lg max-h-64 object-contain border border-slate-300" />
                <button 
                    type="button" 
                    onClick={handleImageRemove}
                    disabled={isLoading}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
                    aria-label="Remove image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        ) : (
            <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-slate-50 transition-colors"
                >
                <UploadIcon className="mx-auto h-10 w-10 text-slate-400" />
                <p className="mt-2 text-sm text-slate-600">
                    <span className="font-semibold text-blue-600">Upload a photo</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP, GIF</p>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
        )}

        <button
          type="submit"
          disabled={isLoading || (!text.trim() && !imageFile)}
          className="mt-6 w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
        >
          {isLoading ? (
            <>
              <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Analyzing...
            </>
          ) : (
            <>
              <AnalyzeIcon className="-ml-1 mr-3 h-5 w-5 text-white" />
              Analyze Notes
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default InputForm;