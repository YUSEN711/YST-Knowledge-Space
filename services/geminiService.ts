import { GoogleGenAI, Type } from "@google/genai";
import { Category, AIAnalysisResult } from '../types';

export const analyzeArticleContent = async (title: string, description: string): Promise<AIAnalysisResult> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn("No API Key found for Gemini. Returning fallback.");
    return {
      summary: description.substring(0, 100) + "...",
      category: Category.TECH,
      tags: ["General"]
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are an expert content curator for a high-end tech and knowledge website.
      Analyze the following article title and user description.
      1. Create a concise, professional summary (max 2 sentences, Traditional Chinese).
      2. Categorize it into one of the following exact categories: '科技創新', '設計美學', '商業趨勢', '科學探索', '生活風格'.
      3. Generate 3 short tags.

      Title: ${title}
      Description: ${description}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            category: {
              type: Type.STRING,
              enum: [
                Category.TECH,
                Category.DESIGN,
                Category.BUSINESS,
                Category.SCIENCE,
                Category.LIFESTYLE
              ]
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "category", "tags"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(text) as AIAnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback if AI fails
    return {
      summary: description.substring(0, 100) + "...",
      category: Category.TECH,
      tags: ["General"]
    };
  }
};