import React from 'react';
import { X, Trash2, RefreshCcw, AlertTriangle } from 'lucide-react';
import { Article } from '../types';
import { Button } from './Button';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedArticles: Article[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  deletedArticles,
  onRestore,
  onPermanentDelete,
  onEmptyTrash
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-[#f5f5f7] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-[fadeIn_0.3s_ease-out] h-[85vh] flex flex-col border border-red-100">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-red-100 z-10">
          <div className="flex items-center gap-2 text-red-700">
            <div className="bg-red-50 text-red-600 p-1.5 rounded-lg">
              <Trash2 size={18} fill="currentColor" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">最近刪除</h3>
            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-medium">
              {deletedArticles.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {deletedArticles.length > 0 && (
              <button
                onClick={onEmptyTrash}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-full transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 size={14} />
                一鍵清空
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {deletedArticles.length > 0 ? (
            <div className="space-y-4">
              {deletedArticles.map((article) => (
                <div key={article.id} className="bg-white p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-sm border border-gray-100 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4 flex-1">
                    <img src={article.imageUrl} alt={article.title} className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0" />
                    <div>
                      <h4 className="font-bold text-gray-900 line-clamp-1">{article.title}</h4>
                      <p className="text-sm text-gray-500 line-clamp-1">{article.summary}</p>
                      <span className="text-xs text-gray-400 mt-1 block">作者: {article.author} • {article.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onRestore(article.id)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1.5"
                    >
                      <RefreshCcw size={14} />
                      還原
                    </Button>
                    <button
                      onClick={() => onPermanentDelete(article.id)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-full text-xs md:text-sm font-medium transition-colors"
                    >
                      <AlertTriangle size={14} />
                      永久刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <div className="w-20 h-20 bg-gray-200/50 rounded-full flex items-center justify-center">
                <Trash2 size={32} className="text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-gray-600">垃圾桶是空的</p>
                <p className="text-sm mt-1">被刪除的文章會暫時保留在這裡</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};