
export enum Category {
  BUSINESS = 'Business',
  MARKETS = 'Markets',
  HEALTH = 'Health',
  ENTERTAINMENT = 'Entertainment',
  TECH = 'Tech',
  STYLE = 'Style',
  TRAVEL = 'Travel',
  SPORTS = 'Sports',
  SCIENCE = 'Science',
  CLIMATE = 'Climate',
  WEATHER = 'Weather',
  BOOKS = 'Books'
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



export interface User {
  id: string;
  name: string;
  savedArticleIds: string[];
  readArticleIds: string[];
}
