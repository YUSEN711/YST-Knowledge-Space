import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Youtube, FileText, BookOpen } from 'lucide-react';
import { Header, TopLevelCategory } from './components/Header';
import { ArticleCard } from './components/ArticleCard';
import { SubmitModal } from './components/SubmitModal';
import { SavedModal } from './components/SavedModal';
import { TrashModal } from './components/TrashModal'; // Import new modal
import { AuthModal } from './components/AuthModal';
import { ArticleDetail } from './components/ArticleDetail';
import { INITIAL_ARTICLES } from './constants';
import { Article, Category, ResourceType, User } from './types';
import { Button } from './components/Button';

// Configuration: Map Top Level Categories to Sub Categories
const CATEGORY_MAPPING: Record<TopLevelCategory, Category[]> = {
  LATEST: Object.values(Category), // Shows everything
  TECH: [Category.TECH, Category.SCIENCE],
  DESIGN: [Category.DESIGN, Category.LIFESTYLE],
  BUSINESS: [Category.BUSINESS]
};

// Helper to extract YouTube Thumbnail
const getYoutubeThumbnail = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11)
    ? `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`
    : null;
};

function App() {
  // Initialize Articles from LocalStorage or fall back to constants
  const [articles, setArticles] = useState<Article[]>(() => {
    try {
      const saved = localStorage.getItem('yst_articles');
      return saved ? JSON.parse(saved) : INITIAL_ARTICLES;
    } catch {
      return INITIAL_ARTICLES;
    }
  });

  // Initialize Deleted Articles from LocalStorage
  const [deletedArticles, setDeletedArticles] = useState<Article[]>(() => {
    try {
      const saved = localStorage.getItem('yst_deleted_articles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Initialize Users DB from LocalStorage
  const [usersDb, setUsersDb] = useState<Record<string, User>>(() => {
    try {
      const saved = localStorage.getItem('yst_users');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Persist Articles to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('yst_articles', JSON.stringify(articles));
  }, [articles]);

  // Persist Deleted Articles
  useEffect(() => {
    localStorage.setItem('yst_deleted_articles', JSON.stringify(deletedArticles));
  }, [deletedArticles]);

  // Persist Users DB to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('yst_users', JSON.stringify(usersDb));
  }, [usersDb]);

  // Navigation State
  const [currentTopLevel, setCurrentTopLevel] = useState<TopLevelCategory>('LATEST');
  const [currentSubCategory, setCurrentSubCategory] = useState<Category | 'ALL'>('ALL');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Handle Login / Registration
  const handleLogin = (username: string) => {
    // Check if user exists in the persisted DB
    let user = usersDb[username];

    if (!user) {
      // Register new user if not found
      user = {
        id: Date.now().toString(),
        name: username,
        savedArticleIds: [],
        readArticleIds: []
      };
      setUsersDb(prev => ({ ...prev, [username]: user }));
    }

    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Helper to update current user data and sync with DB
  const updateCurrentUser = (updater: (u: User) => User) => {
    if (!currentUser) return;

    const updatedUser = updater({ ...currentUser });
    setCurrentUser(updatedUser);

    // Update main DB
    setUsersDb(prev => ({ ...prev, [updatedUser.name]: updatedUser }));
  };

  // Handle Saved Toggle
  const toggleSaveArticle = (articleId: string) => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }
    updateCurrentUser(user => {
      const saved = new Set(user.savedArticleIds);
      if (saved.has(articleId)) {
        saved.delete(articleId);
      } else {
        saved.add(articleId);
      }
      user.savedArticleIds = Array.from(saved);
      return user;
    });
  };

  // Mark article as read
  const markAsRead = (articleId: string) => {
    if (!currentUser) return;

    // Only update if not already read to avoid unnecessary state updates
    if (!currentUser.readArticleIds.includes(articleId)) {
      updateCurrentUser(user => {
        const read = new Set(user.readArticleIds);
        read.add(articleId);
        user.readArticleIds = Array.from(read);
        return user;
      });
    }
  };

  // 1. Soft Delete: Move from Articles to DeletedArticles
  const handleSoftDeleteArticle = (articleId: string) => {
    const articleToDelete = articles.find(a => a.id === articleId);
    if (articleToDelete) {
      setDeletedArticles(prev => [articleToDelete, ...prev]);
      setArticles(prev => prev.filter(a => a.id !== articleId));
    }
    setSelectedArticle(null);
  };

  // 2. Restore: Move from DeletedArticles back to Articles
  const handleRestoreArticle = (articleId: string) => {
    const articleToRestore = deletedArticles.find(a => a.id === articleId);
    if (articleToRestore) {
      setArticles(prev => [articleToRestore, ...prev]);
      setDeletedArticles(prev => prev.filter(a => a.id !== articleId));
    }
  };

  // 3. Permanent Delete: Remove from DeletedArticles and User Lists
  const handlePermanentDelete = (articleId: string) => {
    // Remove from Deleted List
    setDeletedArticles(prev => prev.filter(a => a.id !== articleId));

    // Clean up ALL users' data (remove this article from their saved/read lists)
    setUsersDb(prevDb => {
      const newDb: Record<string, User> = {};
      Object.keys(prevDb).forEach(key => {
        const u = prevDb[key];
        newDb[key] = {
          ...u,
          savedArticleIds: u.savedArticleIds.filter(id => id !== articleId),
          readArticleIds: u.readArticleIds.filter(id => id !== articleId)
        };
      });
      return newDb;
    });

    // Update current user state immediately if logged in
    if (currentUser) {
      setCurrentUser(prev => prev ? ({
        ...prev,
        savedArticleIds: prev.savedArticleIds.filter(id => id !== articleId),
        readArticleIds: prev.readArticleIds.filter(id => id !== articleId)
      }) : null);
    }
  };

  // Handle Article Selection
  const handleArticleClick = (article: Article) => {
    window.scrollTo(0, 0);
    setSelectedArticle(article);
    if (currentUser) {
      markAsRead(article.id);
    }
  };

  // Compute Saved Articles List
  const savedArticles = useMemo(() => {
    if (!currentUser) return [];
    const savedSet = new Set(currentUser.savedArticleIds);
    return articles.filter(a => savedSet.has(a.id));
  }, [articles, currentUser]);

  // Handle Top Level Change
  const handleTopLevelChange = (level: TopLevelCategory) => {
    setCurrentTopLevel(level);
    setCurrentSubCategory('ALL'); // Reset sub-category when switching main tabs
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedArticle(null); // Always go back to list view when changing category
  };

  // 1. First, filter articles based on the Top Level Directory + Sub Category Selection
  const visibleArticles = useMemo(() => {
    const allowedSubCategories = CATEGORY_MAPPING[currentTopLevel];

    return articles.filter(article => {
      // Must belong to one of the allowed categories for this Top Level
      const isAllowedInTopLevel = allowedSubCategories.includes(article.category);
      // Must match the specific sub-category filter (if not ALL)
      const matchesSubCategory = currentSubCategory === 'ALL' || article.category === currentSubCategory;

      return isAllowedInTopLevel && matchesSubCategory;
    });
  }, [articles, currentTopLevel, currentSubCategory]);

  // Logic to determine the "Hero" article (Latest Non-Book)
  const heroArticle = useMemo(() => {
    return visibleArticles.find(a => a.type !== 'BOOK');
  }, [visibleArticles]);

  // Remaining articles (exclude the hero so we don't show it twice)
  const listArticles = useMemo(() => {
    if (!heroArticle) return visibleArticles;
    return visibleArticles.filter(a => a.id !== heroArticle.id);
  }, [visibleArticles, heroArticle]);

  // Group remaining articles by Resource Type
  const groupedContent = useMemo(() => {
    return {
      YOUTUBE: listArticles.filter(a => a.type === 'YOUTUBE'),
      ARTICLE: listArticles.filter(a => a.type === 'ARTICLE'),
      BOOK: listArticles.filter(a => a.type === 'BOOK'),
    };
  }, [listArticles]);

  // Helpers for checking status
  const isArticleSaved = (id: string) => currentUser?.savedArticleIds.includes(id) || false;
  const isArticleRead = (id: string) => currentUser?.readArticleIds.includes(id) || false;

  const handleAddArticle = (data: { title: string; summary: string; category: Category; url: string; type: ResourceType }) => {
    // Try to get YouTube thumbnail if it's a video
    let imageUrl = `https://picsum.photos/800/600?random=${Date.now()}`;
    if (data.type === 'YOUTUBE') {
      const thumb = getYoutubeThumbnail(data.url);
      if (thumb) imageUrl = thumb;
    }

    const newArticle: Article = {
      id: Date.now().toString(),
      title: data.title,
      summary: data.summary,
      category: data.category,
      url: data.url,
      imageUrl: imageUrl,
      date: new Date().toISOString().split('T')[0],
      author: currentUser ? currentUser.name : 'Guest User',
      type: data.type
    };
    setArticles(prev => [newArticle, ...prev]);
  };

  // Track scroll for filter bar styling
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get current sub-categories to display in the filter bar
  const currentSubCategoriesToDisplay = CATEGORY_MAPPING[currentTopLevel];

  return (
    <div className="min-h-screen pb-20 bg-[#f5f5f7]">
      <Header
        onOpenSubmit={() => setIsModalOpen(true)}
        onOpenSaved={() => setIsSavedModalOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenTrash={() => setIsTrashModalOpen(true)}
        currentTopLevel={currentTopLevel}
        onTopLevelChange={handleTopLevelChange}
        user={currentUser}
        onLogout={handleLogout}
      />

      {selectedArticle ? (
        <ArticleDetail
          article={selectedArticle}
          onBack={() => {
            window.scrollTo(0, 0);
            setSelectedArticle(null);
          }}
          isSaved={isArticleSaved(selectedArticle.id)}
          onToggleSave={() => toggleSaveArticle(selectedArticle.id)}
          onDelete={() => handleSoftDeleteArticle(selectedArticle.id)}
          currentUser={currentUser}
        />
      ) : (
        <>
          {/* Sub-Category Filter Bar - Full Width */}
          <div
            className={`sticky top-20 z-40 w-full overflow-x-auto no-scrollbar transition-all duration-300
              ${isScrolled ? 'py-1 md:py-2' : 'py-1 md:py-2'} 
              ${isScrolled
                ? 'bg-[#f5f5f7]/95 backdrop-blur-sm shadow-sm'
                : 'bg-[#f5f5f7]'
              }
              [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]
              md:[mask-image:linear-gradient(to_right,transparent,black_30px,black_calc(100%-30px),transparent)]
            `}
          >
            <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex gap-2 md:gap-3 min-w-max">
              <button
                onClick={() => setCurrentSubCategory('ALL')}
                className={`
                  ${isScrolled ? 'px-3 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'}
                  md:px-6 md:py-2.5 md:text-base rounded-full font-medium transition-all duration-300 border ${currentSubCategory === 'ALL'
                    ? 'bg-black text-white border-black shadow-md'
                    : 'bg-white text-gray-500 border-transparent hover:bg-gray-100'
                  }`}
              >
                全部
              </button>
              {currentSubCategoriesToDisplay.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCurrentSubCategory(cat)}
                  className={`
                    ${isScrolled ? 'px-3 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'}
                    md:px-6 md:py-2.5 md:text-base rounded-full font-medium transition-all duration-300 border ${currentSubCategory === cat
                      ? 'bg-black text-white border-black shadow-md'
                      : 'bg-white text-gray-500 border-transparent hover:bg-gray-100'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <main className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 pt-6 space-y-16">
            {/* Featured Hero Section */}
            {heroArticle && (
              <section className="animate-[fadeIn_0.5s_ease-out]">
                <ArticleCard
                  article={heroArticle}
                  featured
                  onClick={() => handleArticleClick(heroArticle)}
                  isRead={isArticleRead(heroArticle.id)}
                />
              </section>
            )}

            {/* Content Sections Grouped by Type */}
            <div className="space-y-16 sm:space-y-24 animate-[fadeIn_0.7s_ease-out]">

              {/* 1. YouTube Section */}
              {groupedContent.YOUTUBE.length > 0 && (
                <Section
                  title="影片"
                  icon={<Youtube size={28} className="text-red-600" />}
                  description="深度解析與趨勢觀察"
                >
                  {/* Mobile: grid-cols-1 (Large images). Tablet+: grid-cols-2 or 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-8 lg:gap-10">
                    {groupedContent.YOUTUBE.map(article => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        onClick={() => handleArticleClick(article)}
                        isRead={isArticleRead(article.id)}
                      />
                    ))}
                  </div>
                </Section>
              )}

              {/* 2. Article Section */}
              {groupedContent.ARTICLE.length > 0 && (
                <Section
                  title="深度文章"
                  icon={<FileText size={28} className="text-blue-600" />}
                  description="專業見解與知識分享"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-8 lg:gap-10">
                    {groupedContent.ARTICLE.map(article => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        onClick={() => handleArticleClick(article)}
                        isRead={isArticleRead(article.id)}
                      />
                    ))}
                  </div>
                </Section>
              )}

              {/* 3. Book Section */}
              {groupedContent.BOOK.length > 0 && (
                <Section
                  title="閱讀書籍"
                  icon={<BookOpen size={28} className="text-orange-600" />}
                  description="值得收藏的經典讀物"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-8 lg:gap-10">
                    {groupedContent.BOOK.map(article => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        onClick={() => handleArticleClick(article)}
                        isRead={isArticleRead(article.id)}
                      />
                    ))}
                  </div>
                </Section>
              )}

              {/* Empty State */}
              {visibleArticles.length === 0 && (
                <div className="text-center py-24 flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                    <ArrowLeft size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium text-lg">此分類暫無內容</p>
                  <Button variant="ghost" size="lg" onClick={() => setCurrentSubCategory('ALL')} className="mt-6">
                    查看所有內容
                  </Button>
                </div>
              )}

            </div>
          </main>
        </>
      )}

      <SubmitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddArticle}
      />

      <SavedModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedArticles={savedArticles}
        onArticleClick={(article) => {
          setSelectedArticle(article);
          if (currentUser) markAsRead(article.id);
        }}
      />

      <TrashModal
        isOpen={isTrashModalOpen}
        onClose={() => setIsTrashModalOpen(false)}
        deletedArticles={deletedArticles}
        onRestore={handleRestoreArticle}
        onPermanentDelete={handlePermanentDelete}
      />

      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />

      {!selectedArticle && (
        <footer className="mt-32 border-t border-gray-200 bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-base">
            <p>&copy; 2026 YST Knowledge Space. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
}

// Helper Component for Content Sections
const Section = ({ title, icon, description, children }: { title: string, icon: React.ReactNode, description: string, children?: React.ReactNode }) => (
  <section className="relative">
    <div className="flex items-end justify-between mb-8 border-b border-gray-200 pb-5">
      <div>
        <div className="flex items-center gap-3 mb-1">
          {icon}
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h2>
        </div>
        <p className="text-base text-gray-500">{description}</p>
      </div>
    </div>
    {children}
  </section>
);

export default App;