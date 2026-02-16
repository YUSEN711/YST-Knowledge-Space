
export enum Category {
  TECH = '科技創新',
  DESIGN = '設計美學',
  BUSINESS = '商業趨勢',
  SCIENCE = '科學探索',
  LIFESTYLE = '生活風格'
}

export type ResourceType = 'ARTICLE' | 'YOUTUBE' | 'BOOK';

export interface Article {
  id: string;
  title: string;
  summary: string;
  url: string;
  imageUrl: string;
  category: Category;
  type: ResourceType;
  date: string;
  author: string;
  isFeatured?: boolean;
  content?: string;
  keyPoints?: string;
  conclusion?: string;
}

export interface AIAnalysisResult {
  summary: string;
  category: Category;
  tags: string[];
  content?: string;
  keyPoints?: string;
  conclusion?: string;
}

export interface User {
  id: string;
  name: string;
  savedArticleIds: string[];
  readArticleIds: string[];
}
