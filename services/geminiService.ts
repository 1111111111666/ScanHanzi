import { GoogleGenAI, Type } from "@google/genai";
import { FlashcardData } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const flashcardSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      word: {
        type: Type.STRING,
        description: "The Chinese vocabulary word.",
      },
      pinyin: {
        type: Type.STRING,
        description: "The Hanyu Pinyin for the word.",
      },
      translation: {
        type: Type.STRING,
        description: "The Russian translation of the word.",
      },
      hsk_level: {
        type: Type.STRING,
        description: "The HSK level (1-6) or 'unknown' if not in the HSK list.",
      },
      example_sentence: {
        type: Type.STRING,
        description: "A corrected, grammatically sound example sentence from the text containing the word.",
      },
      notes: {
        type: Type.STRING,
        description: "Additional notes like part of speech, synonyms, or antonyms. Can be an empty string if not applicable.",
      },
    },
    required: ["word", "pinyin", "translation", "hsk_level", "example_sentence", "notes"],
  },
};

interface ImagePart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

export async function generateFlashcards(text: string, image?: ImagePart): Promise<FlashcardData[]> {
  // FIX: Use systemInstruction to separate instructions from data for better model performance.
  const systemInstruction = `You are an intelligent Chinese language assistant. 
Analyze the provided Chinese content and generate flashcards. If an image is provided, extract the Chinese text from the image as the primary source. The provided text field can be used as context or additional notes.

Your task is to perform the following steps on the identified Chinese text and return the result as a JSON array of flashcard objects:
1. Extract all unique Chinese vocabulary words.
2. For each word, determine its HSK level (1-6). If it's not in the standard HSK lists, label it as "unknown".
3. Find an example sentence from the provided text that contains the word. Check this sentence for grammatical and logical errors. Provide a corrected version if necessary.
4. Generate a flashcard for each word with its pinyin, Russian translation, HSK level, the corrected example sentence, and any relevant notes (like part of speech, synonyms, etc.).

The final output must strictly be a JSON array matching the provided schema.`;

  const contentParts = [];
  if (image) {
    contentParts.push(image);
  }
  // The user-provided text is now a separate part.
  contentParts.push({ text });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: contentParts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: flashcardSchema,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        throw new Error("API returned an empty response.");
    }
    
    const parsedJson = JSON.parse(jsonText);
    return parsedJson as FlashcardData[];

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to process text with Gemini API.");
  }
}

export async function findSimilarWords(query: string, flashcards: FlashcardData[]): Promise<string[]> {
    if (flashcards.length === 0) return [];

    const wordList = flashcards.map(c => ({ word: c.word, pinyin: c.pinyin }));

    const prompt = `
        From the following list of Chinese words, identify the ones that are the closest match to the user's search query. The user may misremember the pinyin or the exact characters.
        
        Word list (JSON format):
        ${JSON.stringify(wordList)}

        User's search query: "${query}"

        Return a JSON array containing only the strings of the matching Chinese words from the provided list. For example: ["词", "另一个词"].
    `;

    const similarWordsSchema = {
        type: Type.ARRAY,
        items: { type: Type.STRING }
    };

    try {
        // FIX: Simplify the `contents` parameter for text-only prompts.
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: similarWordsSchema,
            },
        });

        const jsonText = response.text.trim();
        if (!jsonText) return [];

        const parsedJson = JSON.parse(jsonText);
        return parsedJson as string[];

    } catch (error) {
        console.error("Error calling Gemini API for similarity search:", error);
        throw new Error("Failed to perform AI similarity search.");
    }
}
