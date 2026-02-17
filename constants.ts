import { Article, Category } from './types';

export const INITIAL_ARTICLES: Article[] = [
  {
    id: '7',
    title: 'M4 iPad Pro 評測：極致纖薄與強大效能的結合',
    summary: '這部影片深入探討了全新 M4 iPad Pro 的各項細節。從令人驚豔的 Tandem OLED 螢幕到不可思議的薄度，再到 M4 晶片的效能測試。MKBHD 分析了這款設備是否能夠真正取代筆記型電腦，以及它在蘋果生態系中的定位，是追求極致硬體愛好者不可錯過的評測。',
    url: 'https://www.youtube.com/watch?v=bs5BjuiaDeI',
    // Using the real YouTube thumbnail for the requested video
    imageUrl: 'https://img.youtube.com/vi/bs5BjuiaDeI/maxresdefault.jpg',
    category: Category.TECH,
    type: 'YOUTUBE',
    date: '2024-05-15',
    author: 'Marques Brownlee',
    isFeatured: true
  },
  {
    id: '1',
    title: '空間運算的未來：Vision Pro 深度解析',
    summary: '探討蘋果最新的空間運算設備如何重新定義我們與數位內容的互動方式，以及其對開發者生態的影響。',
    url: '#',
    imageUrl: 'https://picsum.photos/800/600?random=1',
    category: Category.TECH,
    type: 'ARTICLE',
    date: '2023-10-24',
    author: 'Tech editor'
  },
  {
    id: '2',
    title: '極簡主義設計原則在現代網頁的應用',
    summary: '如何運用負空間與排版層次，創造出既美觀又實用的使用者介面。',
    url: '#',
    imageUrl: 'https://picsum.photos/800/600?random=2',
    category: Category.DESIGN,
    type: 'ARTICLE',
    date: '2023-10-22',
    author: 'Design Lead'
  },
  {
    id: '3',
    title: '永續能源的新突破：固態電池技術',
    summary: '科學家在固態電池領域取得重大進展，電動車續航力將迎來倍數成長。',
    url: '#',
    imageUrl: 'https://picsum.photos/800/600?random=3',
    category: Category.SCIENCE,
    type: 'ARTICLE',
    date: '2023-10-20',
    author: 'Science Daily'
  },
  {
    id: '4',
    title: '原子習慣：細微改變帶來巨大成就',
    summary: '這本書深入探討了習慣養成的心理學機制，讀後讓我重新審視每日的微小決定如何影響長期目標。',
    url: '#',
    imageUrl: 'https://picsum.photos/800/600?random=4',
    category: Category.LIFESTYLE,
    type: 'BOOK',
    date: '2023-10-18',
    author: 'Book Lover'
  },
  {
    id: '5',
    title: '2024 全球經濟趨勢預測',
    summary: '這部影片詳細分析了通膨、AI 產業與地緣政治對明年商業環境的影響，非常值得參考。',
    url: '#',
    imageUrl: 'https://picsum.photos/800/600?random=5',
    category: Category.BUSINESS,
    type: 'YOUTUBE',
    date: '2023-10-15',
    author: 'Market Watch'
  },
  {
    id: '6',
    title: '咖啡沖煮的科學',
    summary: '從化學角度解析萃取過程，讓每一杯咖啡都能保持最佳風味。',
    url: '#',
    imageUrl: 'https://picsum.photos/800/600?random=6',
    category: Category.LIFESTYLE,
    type: 'ARTICLE',
    date: '2023-10-12',
    author: 'Barista Joe'
  }
];

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.TECH]: 'bg-blue-50 text-blue-600',
  [Category.DESIGN]: 'bg-purple-50 text-purple-600',
  [Category.BUSINESS]: 'bg-slate-50 text-slate-600',
  [Category.SCIENCE]: 'bg-green-50 text-green-600',
  [Category.LIFESTYLE]: 'bg-orange-50 text-orange-600',
};

// Default API Key (User requested hardcoded default)
export const DEFAULT_API_KEY = 'AIzaSyA56Mo5P7QweyH_dbjMDLao7tnoi5ydM8M';