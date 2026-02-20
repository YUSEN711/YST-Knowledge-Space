import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Type, FileText, Youtube, BookOpen, Loader2, RefreshCw, Key, ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import { Article, Category, ResourceType, User } from '../types';

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
  currentUser: User | null;
}

// Helper to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// --- Helpers for Robust Fetching ---

const resolveUrl = (relativeUrl: string | null, baseUrl: string): string | null => {
  if (!relativeUrl) return null;
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch {
    return null;
  }
};

const fetchHtmlUsingProxies = async (url: string, logPrefix: string = '[ProxyFetch]'): Promise<Document | null> => {
  const proxies = [
    { name: 'AllOrigins', url: (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, isJson: true },
    { name: 'CodeTabs', url: (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`, isJson: false },
    { name: 'CorsProxyIO', url: (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`, isJson: false }
  ];

  for (const proxy of proxies) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s per proxy

      console.log(`${logPrefix} Trying ${proxy.name} -> ${url}`);
      const response = await fetch(proxy.url(url), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`${logPrefix} Error ${response.status}: ${proxy.name}`);
        continue;
      }

      let htmlContent = '';
      if (proxy.isJson) {
        const data = await response.json();
        htmlContent = data.contents;
      } else {
        htmlContent = await response.text();
      }

      if (!htmlContent) continue;

      const parser = new DOMParser();
      return parser.parseFromString(htmlContent, 'text/html');

    } catch (error) {
      console.warn(`${logPrefix} Failed: ${proxy.name}`, error);
      continue;
    }
  }
  return null;
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
// Fetch OG Image via Proxy (High Res) with Fallbacks
// Fetch OG Image via Proxy (High Res) with Fallbacks
const fetchOgImage = async (url: string): Promise<string | null> => {
  try {
    const doc = await fetchHtmlUsingProxies(url, '[ImageFetch]');
    if (!doc) return null;

    const getMeta = (qs: string) => doc.querySelector(qs)?.getAttribute('content');

    // 1. Meta Tags (High Quality)
    let imageUrl = getMeta('meta[property="og:image"]') ||
      getMeta('meta[name="twitter:image"]') ||
      doc.querySelector('link[rel="image_src"]')?.getAttribute('href');

    if (imageUrl) return resolveUrl(imageUrl, url);

    // 2. First Article Image Fallback
    // Try to find images within common content containers first
    console.log('[ImageFetch] Meta tags failed, trying first image in body...');
    const contentImages = doc.querySelectorAll('article img, main img, .content img, #content img, img');

    for (const img of Array.from(contentImages)) {
      const src = img.getAttribute('src');
      if (!src) continue;

      // Filter out common icons/logos/tracking pixels
      if (src.match(/(logo|icon|avatar|spacer|pixel|tracker|doubleclick|facebook|twitter|ads)/i)) continue;
      if (src.endsWith('.svg') || src.endsWith('.ico')) continue;

      // Check width/height attributes if available to avoid tiny images
      const w = img.getAttribute('width');
      const h = img.getAttribute('height');
      if (w && parseInt(w) < 100) continue;
      if (h && parseInt(h) < 100) continue;

      const finalUrl = resolveUrl(src, url);
      if (finalUrl) return finalUrl;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch OG image:', error);
    return null;
  }
};

// Fetch YouTube Metadata (Web Scraping / API Fallback)
const fetchYouTubeData = async (
  url: string,
  apiKey?: string
): Promise<{ title: string | null; description: string | null; thumbnailUrl: string | null; needsApiKey?: boolean }> => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return { title: null, description: null, thumbnailUrl: null };

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  let title: string | null = null;
  let description: string | null = null;

  // 1. Try Scraping via Proxy / noembed (No key needed)
  if (!apiKey) {
    try {
      // Try noembed.com first (CORS friendly, fast, reliable for YouTube)
      const noembedRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      if (noembedRes.ok) {
        const noembedData = await noembedRes.json();
        if (noembedData.title) title = noembedData.title;
      }

      // If noembed failed, try official oEmbed (might hit CORS)
      if (!title) {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          title = oembedData.title;
        }
      }

      // Fetch Description via Scraping (Best effort)
      const proxyRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`);
      const proxyData = await proxyRes.json();

      if (proxyData.contents) {
        // Attempt to parse description from meta tags or JSON-LD
        const parser = new DOMParser();
        const doc = parser.parseFromString(proxyData.contents, 'text/html');

        // Try meta description
        const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content');
        if (metaDesc) description = metaDesc;

        // If scrape fails or returns empty/default string, mark for API key fallback
        if (!description || description.length < 50) {
          return { title, description: null, thumbnailUrl, needsApiKey: true };
        }
      }
    } catch (e) {
      console.error("Scraping failed:", e);
      // Even if scraping fails, if we got a title from noembed, we can return it
      // But we still need the API key for the description
      return { title, description: null, thumbnailUrl, needsApiKey: true };
    }
  }

  // 2. Use API Key if provided
  if (apiKey) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
      );
      const data = await response.json();
      const item = data.items?.[0];
      if (item) {
        title = item.snippet.title;
        description = item.snippet.description;
      }
    } catch (e) {
      console.error("YouTube API failed:", e);
    }
  }

  return { title, description, thumbnailUrl };
};


// Fetch title from URL (Generic with Multi-Proxy Fallback)
const fetchTitleFromUrl = async (url: string, type: ResourceType): Promise<string | null> => {
  const doc = await fetchHtmlUsingProxies(url, '[TitleFetch]');
  if (!doc) return null;

  const title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    doc.title ||
    doc.querySelector('h1')?.textContent;

  return title ? title.trim() : null;
};

export const SubmitModal: React.FC<SubmitModalProps> = ({ isOpen, onClose, onSubmit, initialData, currentUser }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [category, setCategory] = useState<Category>(Category.TECH);
  const [resourceType, setResourceType] = useState<ResourceType>('ARTICLE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isFetchingImage, setIsFetchingImage] = useState(false);

  // YouTube specific
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [isRetryingWithKey, setIsRetryingWithKey] = useState(false);

  // Auto-fetch logic
  useEffect(() => {
    if (!url) return;
    if (initialData && url === initialData.url) return; // Don't refetch on edit if URL hasn't changed

    const timer = setTimeout(async () => {
      // 1. YouTube Specific Logic
      if (resourceType === 'YOUTUBE') {
        setIsFetchingTitle(true);
        setIsFetchingImage(true);

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

          // 1. Fetch Title (Robust, No API Key needed)
          // Try noembed.com first (CORS friendly)
          const titlePromise = fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${getYouTubeVideoId(url)}`, { signal: controller.signal })
            .then(res => res.json())
            .then(data => data.title || null)
            .catch(() => null)
            .then(async (noembedTitle) => {
              if (noembedTitle) return noembedTitle;
              // Fallback to oEmbed
              const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${getYouTubeVideoId(url)}&format=json`, { signal: controller.signal });
              const data = await res.json();
              return data.title || null;
            })
            .catch(() => null);

          // 2. Fetch Description (Best Effort, might fail/CORS)
          const descPromise = fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal: controller.signal })
            .then(res => res.json())
            .then(data => {
              if (data.contents) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.contents, 'text/html');
                return doc.querySelector('meta[name="description"]')?.getAttribute('content') || null;
              }
              return null;
            })
            .catch(() => null);

          // Execute in parallel but handle independently
          const [fetchedTitle, fetchedDesc] = await Promise.all([titlePromise, descPromise]);
          clearTimeout(timeoutId);

          const videoId = getYouTubeVideoId(url);
          const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

          // Set Title immediately if found
          if (fetchedTitle) setTitle(prev => prev || fetchedTitle);
          if (thumbnailUrl) setImageUrl(thumbnailUrl);

          // Handle Description / API Key Logic
          if (fetchedDesc) {
            if (!content) setContent(fetchedDesc);
            setShowApiKeyInput(false);
          } else {
            // If description is missing, we need API key ONLY for description
            // But we don't want to block the title.
            // We show popup only if we really need description and user hasn't skipped it.
            // Logic: If title found but no description -> Show popup to offer better data, 
            // but user can see title is already there.
            setShowApiKeyInput(true);
          }

        } catch (error) {
          console.error("YouTube fetch timed out or failed:", error);
          // Even on timeout, IF we got title somehow (unlikely if race failed) or just show popup
          setShowApiKeyInput(true);
        }

        setIsFetchingTitle(false);
        setIsFetchingImage(false);
        return;
      }

      // 2. Article Logic
      if (resourceType === 'ARTICLE') {
        setIsFetchingTitle(true);
        const fetchedTitle = await fetchTitleFromUrl(url, resourceType);
        if (fetchedTitle) setTitle(prev => prev || fetchedTitle);
        setIsFetchingTitle(false);

        setIsFetchingImage(true);
        const fetchedImage = await fetchOgImage(url);
        if (fetchedImage) setImageUrl(prev => prev || fetchedImage);
        setIsFetchingImage(false);
        return;
      }

      // 3. Book Logic — prioritise book cover (Google Books / Open Library), fallback to OG image
      if (resourceType === 'BOOK') {
        setIsFetchingTitle(true);
        const fetchedTitle = await fetchTitleFromUrl(url, resourceType);
        if (fetchedTitle) setTitle(prev => prev || fetchedTitle);
        setIsFetchingTitle(false);

        setIsFetchingImage(true);
        // Use the title we just fetched (or whatever's already in state) to get the book cover
        const titleForCover = title || fetchedTitle || '';
        const bookCover = titleForCover ? await fetchBookCover(titleForCover) : null;
        if (bookCover) {
          setImageUrl(prev => prev || bookCover);
        } else {
          // Fallback: OG image from the book page
          const ogImage = await fetchOgImage(url);
          if (ogImage) setImageUrl(prev => prev || ogImage);
        }
        setIsFetchingImage(false);
        return;
      }

      // 3. Book Logic (relies on Title, handled separately or manually)

    }, 500); // Reduced delay to 500ms for faster feedback

    return () => clearTimeout(timer);
  }, [url, resourceType]); // Dependency trimmed to avoid loops

  // Separate effect: if user manually types/changes the title on a BOOK and no cover yet, try to fetch cover
  useEffect(() => {
    if (resourceType !== 'BOOK' || !title || imageUrl) return;
    const timer = setTimeout(async () => {
      setIsFetchingImage(true);
      const cover = await fetchBookCover(title);
      if (cover) setImageUrl(cover);
      setIsFetchingImage(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [title, resourceType]);


  // Handler for Manual Retry with API Key
  const handleRetryWithApiKey = async () => {
    if (!youtubeApiKey) return;
    setIsRetryingWithKey(true);

    const { title: ytTitle, description: ytDesc, thumbnailUrl } = await fetchYouTubeData(url, youtubeApiKey);

    if (ytTitle) setTitle(ytTitle);
    if (ytDesc) {
      setContent(ytDesc);
      setShowApiKeyInput(false); // Success, hide popup
    } else {
      alert("無法透過 API 抓取內容，請確認 Key 是否正確或手動輸入。");
    }

    if (thumbnailUrl) setImageUrl(thumbnailUrl);

    setIsRetryingWithKey(false);
  };


  // Populate form with initialData when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setUrl(initialData.url);
        setCategory(initialData.category);
        setResourceType(initialData.type);
        setImageUrl(initialData.imageUrl || '');
        setContent(initialData.content || '');
        setKeyPoints(initialData.keyPoints || '');
      } else {
        // Reset form for new submission
        setTitle('');
        setUrl('');
        setImageUrl('');
        setCategory(Category.TECH);
        setResourceType('ARTICLE');
        setContent('');
        setKeyPoints('');
        setShowApiKeyInput(false);
        setYoutubeApiKey('');
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Auto-generate summary from content if available, else use title
      const generatedSummary = content
        ? content.slice(0, 150) + (content.length > 150 ? '...' : '')
        : title;

      onSubmit({
        title,
        summary: generatedSummary, // Use generated summary
        category,
        url,
        type: resourceType,
        content: content || undefined,
        keyPoints: keyPoints || undefined,
        conclusion: undefined, // Removed
        imageUrl: imageUrl || undefined
      });

      // Reset form
      setUrl('');
      setTitle('');
      setContent('');
      setKeyPoints('');
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

        {/* API Key Modal Overlay */}
        {showApiKeyInput && (
          <div className="absolute inset-0 z-[110] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-[fadeIn_0.2s_ease-out]">
            {/* Back Button */}
            <button
              onClick={() => setShowApiKeyInput(false)}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>

            <div className="w-full max-w-sm space-y-4 text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Youtube size={24} />
              </div>
              <h4 className="text-xl font-bold text-gray-900">無法自動抓取影片說明</h4>
              <p className="text-sm text-gray-500">
                由於 YouTube 的限制，我們無法直接抓取詳細說明。您可以輸入個人的 YouTube Data API Key 來嘗試獲取完整資訊。
              </p>

              <div className="text-left space-y-1.5 pt-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">YouTube Data API Key</label>
                <input
                  type="text"
                  value={youtubeApiKey}
                  onChange={(e) => setYoutubeApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all outline-none text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowApiKeyInput(false)}
                  className="flex-1"
                >
                  略過，手動輸入
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRetryWithApiKey}
                  isLoading={isRetryingWithKey}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white border-transparent"
                >
                  重試抓取
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                您的 Key 僅會用於此次抓取，不會被儲存。
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-900">{initialData ? '編輯內容' : '分享新知'}</h3>
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
                Article
              </button>
              <button
                type="button"
                onClick={() => setResourceType('YOUTUBE')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${resourceType === 'YOUTUBE' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                <Youtube size={16} />
                Video
              </button>
              <button
                type="button"
                onClick={() => {
                  setResourceType('BOOK');
                  setCategory(Category.BOOKS);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${resourceType === 'BOOK' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                <BookOpen size={16} />
                Book
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

          {/* Image Preview (Auto-fetched only) */}
          {(imageUrl || isFetchingImage) && resourceType !== 'YOUTUBE' && (
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  封面預覽
                </div>
                {isFetchingImage && <Loader2 size={14} className="animate-spin text-blue-500" />}
              </label>

              {imageUrl && (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50 max-h-[200px]">
                  <img src={imageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}

          {/* YouTube Thumbnail Preview (Read-only) */}
          {resourceType === 'YOUTUBE' && imageUrl && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50">
              <img src={imageUrl} alt="Video Thumbnail" className="w-full h-full object-cover" />
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white text-xs font-bold rounded">
                封面預覽
              </div>
            </div>
          )}

          <div className="space-y-1.5 relative">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700 block">文章內容</label>
              {resourceType === 'YOUTUBE' && (
                <button
                  type="button"
                  onClick={() => setShowApiKeyInput(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium transition-colors"
                >
                  <Key size={12} />
                  輸入 API Key 重新抓取
                </button>
              )}
            </div>
            <textarea
              required
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="詳細記錄文章的核心內容、重點段落或引言..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 block">關鍵觀點與分析</label>
            <textarea
              rows={6}
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
              placeholder="列舉文章的關鍵觀點、深入分析或你的思考..."
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