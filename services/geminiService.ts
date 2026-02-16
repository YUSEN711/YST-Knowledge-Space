import { GoogleGenAI, Type } from "@google/genai";
import { Category, AIAnalysisResult } from '../types';

export const analyzeArticleContent = async (title: string, description: string, resourceType: string = 'ARTICLE'): Promise<AIAnalysisResult> => {
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

    let specificInstructions = "";
    if (resourceType === 'BOOK') {
      specificInstructions = `
        4. Generate a 'content' section: A comprehensive book outline, including main chapters and their brief summaries (approx 300-500 words).
        5. Generate 'keyPoints': A detailed analysis of critical reviews, key insights, and common reader perspectives (or user reviews found online).
      `;
    } else {
      specificInstructions = `
        4. Generate a 'content' section: A detailed simulated article body or detailed description based on the title (approx 300 words).
        5. Generate 'keyPoints': A bulleted list of 3-5 key takeaways.
      `;
    }

    const prompt = `
      You are an expert content curator for a high-end tech and knowledge website.
      Analyze the following title and user description (if provided). Resource Type: ${resourceType}
      
      1. Create a concise, professional summary (max 2 sentences, Traditional Chinese).
      2. Categorize it into one of the following exact categories: '科技創新', '設計美學', '商業趨勢', '科學探索', '生活風格'.
      3. Generate 3 short tags.
      ${specificInstructions}
      6. Generate 'conclusion': A thoughtful concluding paragraph.

      Title: ${title}
      Description: ${description || 'No description provided, please generate based on title'}
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
            },
            content: { type: Type.STRING },
            keyPoints: { type: Type.STRING },
            conclusion: { type: Type.STRING }
          },
          required: ["summary", "category", "tags", "content", "keyPoints", "conclusion"]
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
      tags: ["General"],
      content: "無法生成內容",
      keyPoints: "無法生成重點",
      conclusion: "無法生成結語"
    };
  }
};