import React, { useState, useEffect, useCallback } from 'react';
import { X, Sparkles, Link as LinkIcon, Type, FileText, Youtube, BookOpen, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { Article, Category, ResourceType } from '../types';
import { analyzeArticleContent } from '../services/geminiService';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    summary: string;
    category: Category;
    url: string;
    type: ResourceType;
    content?: string;
    keyPoints?: string;
    conclusion?: string;
    imageUrl?: string;
  }) => void;
  initialData?: Article | null;
  apiKey?: string;
  onOpenSettings?: () => void;
}

// Helper to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Fetch Book Cover from Google Books (High Res) with Open Library Fallback
const fetchBookCover = async (title: string): Promise<string | null> => {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=1`);
    const data = await response.json();
    const book = data.items?.[0];

    if (!book) return null;

    // 1. Try Open Library High Res Cover if ISBN exists
    const isbn = book.volumeInfo?.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier;
    if (isbn) {
      const openLibraryUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
      // Check if image exists (Open Library returns 404 if 'default=false' is set and no cover found)
      try {
        const check = await fetch(openLibraryUrl, { method: 'HEAD' });
        if (check.ok) return openLibraryUrl;
      } catch (e) {
        console.warn("Open Library check failed, falling back to Google Books");
      }
    }

    // 2. Google Books Fallback
    const images = book.volumeInfo?.imageLinks;
    if (!images) return null;

    // Prioritize higher resolution images
    let imageUrl = images.extraLarge || images.large || images.medium || images.small || images.thumbnail || images.smallThumbnail;

    if (imageUrl) {
      // Remove edge=curl and ensure https
      imageUrl = imageUrl.replace('http:', 'https:').replace('&edge=curl', '');
      // Try to get higher res by removing zoom or setting it to 0
      imageUrl = imageUrl.replace('&zoom=1', '&zoom=0');
    }

    return imageUrl || null;
  } catch (error) {
    console.error('Failed to fetch book cover:', error);
    return null;
  }
};

// Fetch OG Image via Proxy (High Res)
const fetchOgImage = async (url: string): Promise<string | null> => {
  try {
    // Using a CORS proxy to fetch the page content
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    if (!data.contents) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, 'text/html');

    // Try both twitter:image (often larger) and og:image
    const twitterImage = doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');

    return twitterImage || ogImage || null;
  } catch (error) {
    console.error('Failed to fetch OG image:', error);
    return null;
  }
};

// Fetch title from URL
const fetchTitleFromUrl = async (url: string, type: ResourceType): Promise<string | null> => {
  try {
    if (type === 'YOUTUBE') {
      const videoId = getYouTubeVideoId(url);
      if (!videoId) return null;

      // Use YouTube oEmbed API
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (!response.ok) return null;

      const data = await response.json();
      return data.title || null;
    } else {
      // For regular URLs, try to fetch the title from HTML using proxy
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      if (!data.contents) return null;

      const match = data.contents.match(/<title>([^<]*)<\/title>/i);
      return match ? match[1].trim() : null;
    }
  } catch (error) {
    console.error('Failed to fetch title:', error);
    return null;
  }
};

// Fetch Page Content via Proxy (start)
const fetchPageContent = async (url: string): Promise<string> => {
  try {
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    if (!data.contents) return "";

    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, 'text/html');

    // Remove script and style elements
    const scripts = doc.querySelectorAll('script, style, noscript, iframe, svg');
    scripts.forEach(script => script.remove());

    // Get text content
    let text = doc.body.innerText || "";

    // Simple cleanup: remove excessive whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  } catch (error) {
    console.error('Failed to fetch page content:', error);
    return "";
  }
};

export const SubmitModal: React.FC<SubmitModalProps> = ({ isOpen, onClose, onSubmit, initialData, apiKey, onOpenSettings }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [category, setCategory] = useState<Category>(Category.TECH);
  const [resourceType, setResourceType] = useState<ResourceType>('ARTICLE');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStatus, setAnalyzingStatus] = useState<string>(''); // New status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isFetchingImage, setIsFetchingImage] = useState(false);

  // Auto-fetch title when URL changes (debounced)
  useEffect(() => {
    if (!url || title) return; // Don't fetch if title already exists

    const timer = setTimeout(async () => {
      setIsFetchingTitle(true);
      const fetchedTitle = await fetchTitleFromUrl(url, resourceType);
      if (fetchedTitle && !title) { // Only set if title is still empty
        setTitle(fetchedTitle);
      }
      setIsFetchingTitle(false);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [url, resourceType, title]); // Added title to dependencies to prevent re-fetching if title is manually set

  // Auto-fetch Image when URL (for Article/Video) or Title (for Book) changes
  useEffect(() => {
    if (imageUrl) return; // Don't fetch if image already exists/is set (prevents overwriting manual edits)
    if (resourceType === 'BOOK' && !title) return;
    if (resourceType !== 'BOOK' && !url) return;

    const timer = setTimeout(async () => {
      setIsFetchingImage(true);
      let fetchedImage: string | null = null;

      if (resourceType === 'BOOK' && title) {
        fetchedImage = await fetchBookCover(title);
      } else if (resourceType !== 'BOOK' && url) {
        fetchedImage = await fetchOgImage(url);
      }

      if (fetchedImage) {
        setImageUrl(fetchedImage);
      }
      setIsFetchingImage(false);
    }, 1500); // 1.5 second debounce to wait for user to finish typing

    return () => clearTimeout(timer);
  }, [url, title, resourceType, imageUrl]);


  // Populate form with initialData when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setUrl(initialData.url);
        setDescription(initialData.summary);
        setCategory(initialData.category);
        setResourceType(initialData.type);
        setImageUrl(initialData.imageUrl || ''); // Set initial image
        setContent(initialData.content || '');
        setKeyPoints(initialData.keyPoints || '');
        setConclusion(initialData.conclusion || '');
      } else {
        // Reset form for new submission
        setTitle('');
        setUrl('');
        setDescription('');
        setImageUrl('');
        setCategory(Category.TECH);
        setResourceType('ARTICLE');
        setContent('');
        setKeyPoints('');
        setConclusion('');
      }
    }
  }, [isOpen, initialData]);

  const handleAnalyze = async () => {
    if (!title && !description && !url) return;
    setIsAnalyzing(true);
    setAnalyzingStatus('正在讀取網頁內容...');

    try {
      // 1. Fetch Page Content first
      let pageContent = "";
      if (url && resourceType === 'ARTICLE') {
        pageContent = await fetchPageContent(url);
      }

      setAnalyzingStatus('AI 正在分析與生成內容...');

      // 2. Pass content to Gemini
      // Check for API key first
      if (!apiKey) {
        if (onOpenSettings) {
          const confirm = window.confirm("尚未設定 API Key，無法自動生成內容。\n是否前往設定？");
          if (confirm) {
            onOpenSettings();
            setIsAnalyzing(false);
            setAnalyzingStatus('');
            return;
          }
        }
      }

      const result = await analyzeArticleContent(apiKey || '', title, description, resourceType, url, pageContent);

      // Update fields with AI suggestions
      setDescription(result.summary);
      setCategory(result.category);
      if (result.content) setContent(result.content);
      if (result.keyPoints) setKeyPoints(result.keyPoints);
      if (result.conclusion) setConclusion(result.conclusion);
    } catch (e) {
      console.error(e);
      alert('AI 分析暫時無法使用，請手動輸入');
    } finally {
      setIsAnalyzing(false);
      setAnalyzingStatus('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalDescription = description;
      let finalContent = content;
      let finalKeyPoints = keyPoints;
      let finalConclusion = conclusion;
      let finalCategory = category;

      // 1. Auto-fill content if missing
      if (!description || !content || !keyPoints || !conclusion) {
        setIsAnalyzing(true);
        try {
          // Fetch content for auto-fill if needed
          let pageContent = "";
          if (url && resourceType === 'ARTICLE') {
            // We can try to fetch it, but to save time/bandwidth maybe we skip or rely on handleAnalyze? 
            // Ideally the user uses the button. But if they click submit directly...
            // Let's do a quick fetch
            try {
              pageContent = await fetchPageContent(url);
            } catch (e) { }
          }

          const result = await analyzeArticleContent(apiKey || '', title, description || title, resourceType, url, pageContent);
          if (!description) finalDescription = result.summary;
          if (!content) finalContent = result.content || '';
          if (!keyPoints) finalKeyPoints = result.keyPoints || '';
          if (!conclusion) finalConclusion = result.conclusion || '';
          // Only update category if user hasn't manually selected one (or if it's default)
          if (category === Category.TECH) finalCategory = result.category;
        } catch (error) {
          console.error("Auto-fill failed:", error);
        } finally {
          setIsAnalyzing(false);
        }
      }

      // 2. Use the state imageUrl (fetched or manually entered)
      // If it's still empty, try one last fetch? No, the user saw the preview. 
      // If they explicitly cleared it, it sends undefined/empty.
      // But if they just pasted URL and hit enter fast, debounce might not have fired.
      // Let's rely on the state. If they want an image, they'll see the preview.

      onSubmit({
        title,
        summary: finalDescription,
        category: finalCategory,
        url,
        type: resourceType,
        content: finalContent || undefined,
        keyPoints: finalKeyPoints || undefined,
        conclusion: finalConclusion || undefined,
        imageUrl: imageUrl || undefined
      });

      // Reset form
      setUrl('');
      setTitle('');
      setDescription('');
      setContent('');
      setKeyPoints('');
      setConclusion('');
      setImageUrl('');
      setCategory(Category.TECH);
      setResourceType('ARTICLE');
      setIsSubmitting(false);
      onClose();

    } catch (error) {
      console.error("Submit failed:", error);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-[fadeIn_0.3s_ease-out] max-h-[90vh] overflow-y-auto no-scrollbar">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="text-xl font-semibold text-gray-900">{initialData ? '編輯內容' : '分享新知'}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 block">資源類型</label>
            <div className="flex p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setResourceType('ARTICLE')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${resourceType === 'ARTICLE' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                <FileText size={16} />
                文章
              </button>
              <button
                type="button"
                onClick={() => setResourceType('YOUTUBE')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${resourceType === 'YOUTUBE' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                <Youtube size={16} />
                影片
              </button>
              <button
                type="button"
                onClick={() => setResourceType('BOOK')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${resourceType === 'BOOK' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                <BookOpen size={16} />
                書籍
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <LinkIcon size={14} />
              {resourceType === 'BOOK' ? '書籍連結 (如博客來/Amazon)' : resourceType === 'YOUTUBE' ? '影片連結' : '文章連結'}
            </label>
            <input
              required
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm"
            />
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-1 space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Type size={14} />
                標題
                {isFetchingTitle && <Loader2 size={14} className="animate-spin text-blue-500" />}
              </label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isFetchingTitle ? "正在自動抓取標題..." : "請輸入標題"}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm font-medium"
              />
            </div>
          </div>

          {/* Image URL Input & Preview */}
          <div className="flex gap-4 items-start">
            <div className="flex-1 space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  封面圖片連結
                </div>
                {isFetchingImage && <Loader2 size={14} className="animate-spin text-blue-500" />}
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... (自動抓取或手動輸入)"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm"
              />
            </div>
            {imageUrl && (
              <div className="w-20 h-20 shrink-0 rounded-xl border border-gray-100 overflow-hidden bg-gray-50 mt-6 relative group">
                <img src={imageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
              </div>
            )}
          </div>

          <div className="space-y-1.5 relative">
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText size={14} />
                讀後心得
              </label>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!title && !description)}
                className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles size={12} />
                AI 自動生成內容
              </button>
            </div>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="分享這篇文章、影片或書籍帶給你的啟發..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm resize-none"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2 text-purple-600">
                  <Sparkles className="animate-pulse" size={24} />
                  <span className="text-xs font-semibold">{analyzingStatus || "Gemini 思考中..."}</span>
                </div>
              </div>
            )}
          </div>

          {/* New Fields */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 block">文章內容（選填）</label>
            <textarea
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="詳細記錄文章的核心內容、重點段落或引言..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 block">關鍵觀點與分析（選填）</label>
            <textarea
              rows={6}
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
              placeholder="列舉文章的關鍵觀點、深入分析或你的思考..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 block">結語（選填）</label>
            <textarea
              rows={4}
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="總結這篇內容的啟發、行動建議或個人反思..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm resize-none"
            />
          </div>

          {resourceType !== 'BOOK' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 block">分類</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(Category).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${category === cat
                      ? 'bg-black text-white shadow-md transform scale-[1.02]'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
            >
              {initialData ? '更新內容' : '發布內容'}
            </Button>
          </div>

        </form>
      </div >
    </div >
  );
};