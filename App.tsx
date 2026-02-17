import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Youtube, FileText, BookOpen, LayoutGrid } from 'lucide-react';
import { Header, TopLevelCategory } from './components/Header';
import { ArticleCard } from './components/ArticleCard';
import { SubmitModal } from './components/SubmitModal';
import { SavedModal } from './components/SavedModal';
import { TrashModal } from './components/TrashModal';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { ArticleDetail } from './components/ArticleDetail';
import { INITIAL_ARTICLES, DEFAULT_API_KEY } from './constants';
import { Article, Category, ResourceType, User } from './types';
import { Button } from './components/Button';
import { analyzeArticleContent } from './services/geminiService';

// Configuration: Map Top Level Categories to Sub Categories
const CATEGORY_MAPPING: Record<TopLevelCategory, Category[]> = {
  LATEST: Object.values(Category), // Shows everything
  TECH: [Category.TECH, Category.SCIENCE],
  DESIGN: [Category.DESIGN, Category.LIFESTYLE],
  BUSINESS: [Category.BUSINESS],
  BOOKS: Object.values(Category) // Books can be from any category
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

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);

  // API Key State
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('gemini_api_key') || DEFAULT_API_KEY;
    } catch {
      return DEFAULT_API_KEY;
    }
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [currentTopLevel, setCurrentTopLevel] = useState<TopLevelCategory>('LATEST');
  const [currentSubCategory, setCurrentSubCategory] = useState<Category | 'ALL'>('ALL');
  const [isScrolled, setIsScrolled] = useState(false);

  // Load user session
  useEffect(() => {
    const savedUser = localStorage.getItem('yst_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Persist Articles
  useEffect(() => {
    localStorage.setItem('yst_articles', JSON.stringify(articles));
  }, [articles]);

  // Persist Deleted Articles
  useEffect(() => {
    localStorage.setItem('yst_deleted_articles', JSON.stringify(deletedArticles));
  }, [deletedArticles]);

  // Persist Users DB
  useEffect(() => {
    localStorage.setItem('yst_users', JSON.stringify(usersDb));
  }, [usersDb]);

  // Handle Scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update Sub Category when Top Level changes
  const handleTopLevelChange = (level: TopLevelCategory) => {
    setCurrentTopLevel(level);
    setCurrentSubCategory('ALL');
    window.scrollTo(0, 0);
    if (selectedArticle) setSelectedArticle(null);
  };

  // Persist API Key to LocalStorage
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  // Filter Articles based on Top Level & Sub Category
  const filteredArticles = useMemo(() => {
    let filtered = articles;

    // 1. Filter by Top Level Category
    if (currentTopLevel !== 'LATEST') {
      const allowedCategories = CATEGORY_MAPPING[currentTopLevel];
      if (currentTopLevel === 'BOOKS') {
        filtered = filtered.filter(a => a.type === 'BOOK');
      } else {
        filtered = filtered.filter(a => allowedCategories.includes(a.category) && a.type !== 'BOOK');
      }
    } else {
      // LATEST shows everything? Or exclude Books? 
      // Let's keep it simple: LATEST shows everything.
    }

    // 2. Filter by Sub Category (if not ALL)
    if (currentSubCategory !== 'ALL') {
      filtered = filtered.filter(a => a.category === currentSubCategory);
    }

    return filtered;
  }, [articles, currentTopLevel, currentSubCategory]);

  const listArticles = useMemo(() => {
    // If LATEST, we might want to highlight a hero article.
    // Logic: First article is hero if we are in LATEST and page 1 (implied).
    if (filteredArticles.length === 0) return [];

    // If we want a Hero article only on LATEST tab:
    // if (currentTopLevel === 'LATEST') return filteredArticles.slice(1);

    // Current design: Hero is always the first one of the filtered list?
    return filteredArticles.slice(1);
  }, [filteredArticles, currentTopLevel]);

  const heroArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;

  const currentSubCategoriesToDisplay = useMemo(() => {
    return CATEGORY_MAPPING[currentTopLevel] || Object.values(Category);
  }, [currentTopLevel]);

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    window.scrollTo(0, 0);
  };

  const handleAddArticle = (newArticle: Article) => {
    setArticles(prev => [newArticle, ...prev]);
    setIsModalOpen(false);
  };

  const handleUpdateArticle = (updatedArticle: Article) => {
    setArticles(prev => prev.map(a => a.id === updatedArticle.id ? updatedArticle : a));
    setIsModalOpen(false);
    setEditingArticle(null);
    if (selectedArticle?.id === updatedArticle.id) {
      setSelectedArticle(updatedArticle);
    }
  };

  const handleSoftDeleteArticle = (id: string) => {
    const articleToDelete = articles.find(a => a.id === id);
    if (articleToDelete) {
      setDeletedArticles(prev => [articleToDelete, ...prev]);
      setArticles(prev => prev.filter(a => a.id !== id));
      if (selectedArticle?.id === id) setSelectedArticle(null);
    }
  };

  const handleRestoreArticle = (id: string) => {
    const articleToRestore = deletedArticles.find(a => a.id === id);
    if (articleToRestore) {
      setArticles(prev => [articleToRestore, ...prev]);
      setDeletedArticles(prev => prev.filter(a => a.id !== id));
    }
  };

  const handlePermanentDelete = (id: string) => {
    setDeletedArticles(prev => prev.filter(a => a.id !== id));
  };


  const toggleSaveArticle = (id: string) => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }

    setUsersDb(prev => {
      const user = prev[currentUser.username];
      const saved = user.savedArticles || [];
      const newSaved = saved.includes(id)
        ? saved.filter(sid => sid !== id)
        : [...saved, id];

      const updatedUser = { ...user, savedArticles: newSaved };
      // Update current user session as well
      setCurrentUser(updatedUser);
      localStorage.setItem('yst_user', JSON.stringify(updatedUser)); // Update session immediately
      return { ...prev, [currentUser.username]: updatedUser };
    });
  };

  const isArticleSaved = (id: string) => {
    return currentUser?.savedArticles?.includes(id) || false;
  };

  const markAsRead = (id: string) => {
    if (!currentUser) return;
    // Similar to save, update read history
    // For now, simpler implementation or skip if not strictly required by task
  };

  const isArticleRead = (id: string) => false; // Placeholder for now

  const handleLogin = (username: string, pass?: string) => {
    // Simple mock login
    let user = usersDb[username];
    if (!user) {
      // Register if not exists
      user = {
        id: Date.now().toString(),
        name: username, // For simplicity use username as name
        username: username,
        avatar: `https://ui-avatars.com/api/?name=${username}&background=random`,
        role: username.toLowerCase() === 'jason' ? 'ADMIN' : 'USER',
        savedArticles: []
      };
      // For new users, just save them
      setUsersDb(prev => ({ ...prev, [username]: user }));
    }

    // Check password (only for Jason/Admin)
    if (username.toLowerCase() === 'jason') {
      if (pass === 'admin' || pass === '1234') {
        setCurrentUser(user);
        localStorage.setItem('yst_user', JSON.stringify(user));
        setIsLoginModalOpen(false);
      } else {
        alert('Admin password required (Try "admin")');
      }
    } else {
      // Regular users auto-login for now (simplification)
      setCurrentUser(user);
      localStorage.setItem('yst_user', JSON.stringify(user));
      setIsLoginModalOpen(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('yst_user');
  };

  const savedArticles = useMemo(() => {
    if (!currentUser || !currentUser.savedArticles) return [];
    return articles.filter(a => currentUser.savedArticles.includes(a.id));
  }, [articles, currentUser]);

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
          onEdit={(article) => {
            setEditingArticle(article);
            setIsModalOpen(true);
          }}
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

            {/* Unified Content Section */}
            {listArticles.length > 0 ? (
              <Section
                title="最新發布"
                icon={<LayoutGrid size={28} className="text-gray-700" />}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-8 lg:gap-10 animate-[fadeIn_0.7s_ease-out]">
                  {listArticles.map(article => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onClick={() => handleArticleClick(article)}
                      isRead={isArticleRead(article.id)}
                    />
                  ))}
                </div>
              </Section>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-24 flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                  <ArrowLeft size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-lg">此分類暫無內容</p>
                <Button variant="ghost" size="lg" onClick={() => setCurrentSubCategory('ALL')} className="mt-6">
                  查看所有內容
                </Button>
              </div>
            ) : null}
          </main>
        </>
      )}

      <SubmitModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingArticle(null);
        }}
        onSubmit={editingArticle ? handleUpdateArticle : handleAddArticle}
        initialData={editingArticle}
        apiKey={apiKey}
        currentUser={currentUser}
        onSaveApiKey={handleSaveApiKey}
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

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveApiKey}
        currentApiKey={apiKey}
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

export default App;

// Helper Component for Content Sections
const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <section className="space-y-8">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
    </div>
    {children}
  </section>
);