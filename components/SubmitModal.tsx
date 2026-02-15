import React, { useState } from 'react';
import { X, Sparkles, Link as LinkIcon, Type, FileText, Youtube, BookOpen } from 'lucide-react';
import { Button } from './Button';
import { Category, ResourceType } from '../types';
import { analyzeArticleContent } from '../services/geminiService';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; summary: string; category: Category; url: string; type: ResourceType }) => void;
}

export const SubmitModal: React.FC<SubmitModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(Category.TECH);
  const [resourceType, setResourceType] = useState<ResourceType>('ARTICLE');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnalyze = async () => {
    if (!title && !description) return;
    setIsAnalyzing(true);
    try {
      // Pass the user input to Gemini to clean up
      const result = await analyzeArticleContent(title, description);
      
      // Update fields with AI suggestions
      setDescription(result.summary);
      setCategory(result.category);
    } catch (e) {
      console.error(e);
      alert('AI 分析暫時無法使用，請手動輸入');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate network delay
    setTimeout(() => {
      onSubmit({ title, summary: description, category, url, type: resourceType });
      // Reset form
      setUrl('');
      setTitle('');
      setDescription('');
      setCategory(Category.TECH);
      setResourceType('ARTICLE');
      setIsSubmitting(false);
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-[fadeIn_0.3s_ease-out] max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">分享新知</h3>
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
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  resourceType === 'ARTICLE' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <FileText size={16} />
                文章
              </button>
              <button
                type="button"
                onClick={() => setResourceType('YOUTUBE')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  resourceType === 'YOUTUBE' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Youtube size={16} />
                影片
              </button>
              <button
                type="button"
                onClick={() => setResourceType('BOOK')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  resourceType === 'BOOK' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'
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

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Type size={14} />
              標題
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="請輸入標題"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm font-medium"
            />
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
                AI 潤飾心得
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
                  <span className="text-xs font-semibold">Gemini 思考中...</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 block">分類</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(Category).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    category === cat
                      ? 'bg-black text-white shadow-md transform scale-[1.02]'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              variant="primary" 
              className="w-full"
              isLoading={isSubmitting}
            >
              發布內容
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};