import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, User, ExternalLink, Share2, Bookmark, Check, Link as LinkIcon, Facebook, Twitter, Send, Trash2, Edit2 } from 'lucide-react';
import { Article, User as UserType } from '../types';
import { Button } from './Button';

interface ArticleDetailProps {
  article: Article;
  onBack: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  onDelete: () => void;
  onEdit?: (article: Article) => void;
  currentUser: UserType | null;
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, onBack, isSaved, onToggleSave, onDelete, onEdit, currentUser }) => {
  const [showToast, setShowToast] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setIsShareOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveClick = () => {
    onToggleSave();
    if (!isSaved) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  // Permission Check: Author OR Super Admin (Role based now)
  const canDelete = currentUser && (currentUser.name === article.author || currentUser.role === 'ADMIN');
  const canEdit = currentUser && currentUser.role === 'ADMIN';

  const handleDeleteClick = () => {
    // Remove confirmation for immediate action
    onDelete();
  };

  const handleShare = (platform: 'facebook' | 'twitter' | 'line' | 'copy') => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out "${article.title}" on YST Knowledge Space`);

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
        break;
      case 'line':
        window.open(`https://social-plugins.line.me/lineit/share?url=${url}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(window.location.href);
        alert('連結已複製到剪貼簿');
        break;
    }
    setIsShareOpen(false);
  };

  // Generate dummy content based on category for layout verification
  const getDummyContent = () => {
    return (
      <div className="space-y-8 text-gray-800 leading-relaxed font-serif text-xl md:text-2xl">
        <p>
          <span className="font-sans text-gray-400 text-base block mb-3">[ 範例內文生成中... ]</span>
          這是為了讓您檢視排版效果而自動生成的範例文章內容。在真正的知識分享情境中，這裡通常會包含作者對於該主題的深入見解、數據分析或是具體的操作指南。
        </p>
        <p>
          在{article.category}這個快速發展的領域裡，我們經常會面臨到選擇與取捨。正如這篇文章（或是這本書/影片）所提到的核心概念，理解底層邏輯往往比追求表面的工具更為重要。當我們靜下心來閱讀時，會發現許多細節都隱藏著深刻的智慧。
        </p>

        <h3 className="text-3xl font-bold text-gray-900 font-sans mt-12 mb-6 tracking-tight">關鍵觀點與分析</h3>

        <p>
          首先，我們必須承認改變是不可避免的。從歷史的角度來看，每一次技術或觀念的革新，都伴隨著陣痛期與適應期。作者巧妙地運用了多個案例來佐證這一點，這讓整體的論述顯得更加有說服力。
        </p>

        <ul className="list-disc pl-8 space-y-4 marker:text-gray-400">
          <li>觀點一：持續學習是唯一的出路。</li>
          <li>觀點二：跨領域的整合能力將成為未來的核心競爭力。</li>
          <li>觀點三：保持開放的心態，接納不同的聲音。</li>
        </ul>

        <p>
          這些觀點不僅適用於專業領域，同樣也能夠應用在我們的日常生活中。
        </p>

        <blockquote className="border-l-4 border-gray-900 pl-8 py-4 italic text-gray-600 my-12 bg-gray-50 rounded-r-2xl">
          「知識的價值不在於擁有，而在於應用。真正的洞見，往往來自於實踐中的反思。」
        </blockquote>

        <h3 className="text-3xl font-bold text-gray-900 font-sans mt-12 mb-6 tracking-tight">結語</h3>

        <p>
          總的來說，這是一份非常值得花時間細細品味的資源。無論您是該領域的資深專家，還是剛入門的初學者，都能從中獲得啟發。希望這份整理與範例排版能幫助您更好地構思未來的內容呈現方式。
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] animate-[fadeIn_0.3s_ease-out] relative">
      {/* Toast Notification */}
      <div
        className={`fixed top-24 right-4 sm:right-10 bg-black/80 backdrop-blur-md text-white px-8 py-4 rounded-full shadow-2xl transition-all duration-300 z-[60] flex items-center gap-3 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
      >
        <Check size={20} className="text-green-400" />
        <span className="text-base font-medium">已儲存至個人空間</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Navigation / Actions Bar */}
        <div className="flex flex-nowrap gap-2 md:gap-4 justify-between items-center mb-6 md:mb-10 overflow-x-auto no-scrollbar">
          <button
            onClick={onBack}
            className="group flex-shrink-0 flex items-center gap-1.5 md:gap-3 text-gray-600 hover:text-black transition-colors bg-white px-3 py-2 md:px-6 md:py-3 rounded-full shadow-sm border border-gray-100/50"
          >
            <ArrowLeft size={18} className="md:w-5 md:h-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium text-sm md:text-base whitespace-nowrap">返回列表</span>
          </button>

          <div className="flex gap-1.5 sm:gap-3 relative flex-shrink-0">
            {/* Edit Button - Only visible to Jason */}
            {canEdit && onEdit && (
              <button
                onClick={() => onEdit(article)}
                className="p-2 md:p-3 rounded-full transition-all shadow-sm border border-gray-100/50 bg-white text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                title="編輯文章"
              >
                <Edit2 size={18} className="md:w-5 md:h-5" />
              </button>
            )}

            {/* Delete Button - Only visible to Author or Jason */}
            {canDelete && (
              <button
                onClick={handleDeleteClick}
                className="p-2 md:p-3 rounded-full transition-all shadow-sm border border-gray-100/50 bg-white text-red-500 hover:text-red-600 hover:bg-red-50"
                title="移至垃圾桶"
              >
                <Trash2 size={18} className="md:w-5 md:h-5" />
              </button>
            )}

            {/* Save Button */}
            <button
              onClick={handleSaveClick}
              className={`p-2 md:p-3 rounded-full transition-all shadow-sm border border-gray-100/50 ${isSaved
                ? 'bg-black text-white hover:bg-black/90'
                : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-white/80'
                }`}
              title={isSaved ? "取消收藏" : "儲存至個人空間"}
            >
              <Bookmark size={18} className="md:w-5 md:h-5" fill={isSaved ? "currentColor" : "none"} />
            </button>

            {/* Share Dropdown */}
            <div className="relative" ref={shareMenuRef}>
              <button
                onClick={() => setIsShareOpen(!isShareOpen)}
                className={`p-2 md:p-3 rounded-full transition-all shadow-sm border border-gray-100/50 ${isShareOpen
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-white/80'
                  }`}
              >
                <Share2 size={18} className="md:w-5 md:h-5" />
              </button>

              {/* Popup Menu */}
              {isShareOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-20 animate-[fadeIn_0.1s_ease-out]">
                  <button
                    onClick={() => handleShare('facebook')}
                    className="w-full flex items-center gap-4 px-4 py-3 text-base text-gray-600 hover:bg-gray-50 rounded-xl transition-colors text-left"
                  >
                    <Facebook size={18} className="text-blue-600" />
                    <span>Facebook</span>
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="w-full flex items-center gap-4 px-4 py-3 text-base text-gray-600 hover:bg-gray-50 rounded-xl transition-colors text-left"
                  >
                    <Twitter size={18} className="text-sky-500" />
                    <span>X (Twitter)</span>
                  </button>
                  <button
                    onClick={() => handleShare('line')}
                    className="w-full flex items-center gap-4 px-4 py-3 text-base text-gray-600 hover:bg-gray-50 rounded-xl transition-colors text-left"
                  >
                    <Send size={18} className="text-green-500" />
                    <span>Line</span>
                  </button>
                  <div className="h-[1px] bg-gray-100 my-1"></div>
                  <button
                    onClick={() => handleShare('copy')}
                    className="w-full flex items-center gap-4 px-4 py-3 text-base text-gray-600 hover:bg-gray-50 rounded-xl transition-colors text-left"
                  >
                    <LinkIcon size={18} />
                    <span>複製連結</span>
                  </button>
                </div>
              )}
            </div>

            <Button variant="primary" size="md" onClick={() => window.open(article.url, '_blank')} className="shadow-sm !p-2 md:!px-4 md:!py-2">
              <span className="hidden sm:inline text-base">前往來源</span>
              <ExternalLink size={18} className="sm:ml-2" />
            </Button>
          </div>
        </div>

        <article className="bg-white rounded-[3rem] p-6 md:p-16 shadow-sm border border-gray-100">
          {/* Header Metadata */}
          <div className="text-center mb-12 space-y-8">
            <div className="flex items-center justify-center gap-4">
              <span className="px-4 py-1.5 text-sm font-bold tracking-wider text-blue-600 bg-blue-50 rounded-full uppercase">
                {article.category}
              </span>
              <span className="px-4 py-1.5 text-sm font-bold tracking-wider text-gray-600 bg-gray-100 rounded-full uppercase">
                {article.type === 'YOUTUBE' ? '影片' : article.type === 'BOOK' ? '書籍' : '文章'}
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-[1.15] tracking-tight max-w-4xl mx-auto">
              {article.title}
            </h1>

            <div className="flex items-center justify-center gap-8 text-gray-500 text-base font-medium">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-400" />
                {article.date}
              </div>
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
              <div className="flex items-center gap-2">
                <User size={18} className="text-gray-400" />
                {article.author}
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className={`w-full rounded-[2rem] overflow-hidden shadow-soft mb-16 bg-gray-100 relative group mx-auto
            ${article.type === 'BOOK' ? 'max-w-[70%] aspect-[2/3]' : 'aspect-[16/9]'}`}
          >
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-full"
              title="前往原文連結"
            >
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
              />
            </a>
          </div>

          {/* Main Layout */}
          <div className="max-w-3xl mx-auto">

            {/* Article Content */}
            {article.content && (
              <div className="prose prose-lg max-w-none mb-16">
                <h3 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gray-200">文章內容</h3>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {article.content}
                </div>
              </div>
            )}

            {/* Key Points & Analysis */}
            {article.keyPoints && (
              <div className="bg-blue-50/50 border-l-4 border-blue-500 p-8 md:p-10 rounded-2xl mb-16">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  關鍵觀點與分析
                </h3>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                  {article.keyPoints}
                </div>
              </div>
            )}

          </div>
        </article>
      </div>
    </div>
  );
};

// Helper icon
const SparklesIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </svg>
);