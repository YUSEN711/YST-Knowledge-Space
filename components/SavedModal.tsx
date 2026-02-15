import React from 'react';
import { X, Bookmark } from 'lucide-react';
import { ArticleCard } from './ArticleCard';
import { Article } from '../types';
import { Button } from './Button';

interface SavedModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedArticles: Article[];
  onArticleClick: (article: Article) => void;
}

export const SavedModal: React.FC<SavedModalProps> = ({ isOpen, onClose, savedArticles, onArticleClick }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-[#f5f5f7] rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-[fadeIn_0.3s_ease-out] h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10">
          <div className="flex items-center gap-2 text-gray-900">
            <div className="bg-black text-white p-1.5 rounded-lg">
              <Bookmark size={18} fill="currentColor" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">我的收藏空間</h3>
            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
              {savedArticles.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {savedArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onClick={() => {
                    onArticleClick(article);
                    onClose();
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <div className="w-20 h-20 bg-gray-200/50 rounded-full flex items-center justify-center">
                <Bookmark size={32} className="text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-gray-600">這裡目前空空如也</p>
                <p className="text-sm mt-1">點擊文章內的收藏按鈕，將喜歡的內容儲存到這裡</p>
              </div>
              <Button variant="secondary" onClick={onClose} className="mt-4">
                去探索文章
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};