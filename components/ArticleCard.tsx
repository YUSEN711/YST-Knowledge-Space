import React from 'react';
import { Article } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { Youtube, BookOpen, FileText, ArrowRight, Circle } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
  onClick: () => void;
  isRead?: boolean;
}

const TypeIcon = ({ type, className }: { type: string, className?: string }) => {
  switch (type) {
    case 'YOUTUBE':
      return <Youtube className={className} />;
    case 'BOOK':
      return <BookOpen className={className} />;
    default:
      return <FileText className={className} />;
  }
};

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, featured = false, onClick, isRead = false }) => {
  if (featured) {
    return (
      <div
        onClick={onClick}
        className="group relative block w-full aspect-[4/3] md:aspect-[2.5/1] overflow-hidden rounded-[2rem] shadow-soft hover:shadow-hover transition-all duration-500 transform hover:scale-[1.01] cursor-pointer"
      >
        <img
          src={article.imageUrl}
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Read Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          {isRead ? (
            <span className="px-3 py-1 bg-black/40 backdrop-blur-md text-white/80 text-xs font-medium rounded-full border border-white/10">
              已讀
            </span>
          ) : (
            <span className="px-3 py-1 bg-blue-600/90 backdrop-blur-md text-white text-xs font-medium rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
              <Circle size={8} fill="currentColor" />
              未讀
            </span>
          )}
        </div>

        <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-3/4 text-white">
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-block px-4 py-1.5 text-xs md:text-sm font-bold tracking-wider uppercase bg-white/20 backdrop-blur-md rounded-full border border-white/10">
              {article.category}
            </span>
            <div className="flex items-center gap-1.5 text-xs md:text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
              <TypeIcon type={article.type} className="w-3 h-3 md:w-4 md:h-4" />
              <span>{article.type === 'YOUTUBE' ? '影片' : article.type === 'BOOK' ? '書籍' : '文章'}</span>
            </div>
          </div>
          <h2 className="text-2xl md:text-5xl font-bold leading-[1.2] mb-4 tracking-tight">
            {article.title}
          </h2>
          <p className="text-gray-200 text-base md:text-xl line-clamp-2 md:line-clamp-3 leading-relaxed font-light opacity-90">
            {article.summary}
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm md:text-lg text-white font-medium group-hover:underline decoration-2 underline-offset-4">
            <span>查看完整內容</span>
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="group flex flex-col bg-white rounded-2xl md:rounded-[2rem] overflow-hidden shadow-soft hover:shadow-hover transition-all duration-300 transform hover:-translate-y-1 h-full cursor-pointer border border-gray-100"
    >
      {/* Aspect Ratio */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2 md:top-4 md:left-4 flex gap-2">
          <span className={`inline-block px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-sm font-bold rounded-lg backdrop-blur-md shadow-sm ${CATEGORY_COLORS[article.category]}`}>
            {article.category}
          </span>
        </div>

        {/* Read Status Badge & Type Icon */}
        <div className="absolute top-2 right-2 md:top-4 md:right-4 flex flex-col gap-2 items-end">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/95 backdrop-blur text-gray-900 flex items-center justify-center shadow-md">
            <TypeIcon type={article.type} className="w-4 h-4 md:w-5 md:h-5" />
          </div>

          {isRead ? (
            <span className="px-2 py-0.5 bg-gray-900/60 backdrop-blur-md text-white text-[10px] font-medium rounded-md">
              已讀
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-blue-600 backdrop-blur-md text-white text-[10px] font-medium rounded-md shadow-sm">
              未讀
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 p-5 md:p-8 flex flex-col">
        {/* Adjusted typography for mobile (larger) */}
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 md:mb-3 line-clamp-2 group-hover:text-apple-blue transition-colors leading-tight tracking-tight">
          {article.title}
        </h3>
        <p className="text-gray-500 text-base md:text-lg line-clamp-3 md:line-clamp-3 mb-4 md:mb-6 flex-1 leading-relaxed font-normal">
          {article.summary}
        </p>
        <div className="flex items-center justify-between mt-auto text-xs md:text-sm text-gray-400 font-medium">
          <span>{article.date}</span>
          <span>{article.author}</span>
        </div>
      </div>
    </div>
  );
};