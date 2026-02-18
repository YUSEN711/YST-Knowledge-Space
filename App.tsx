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
import { INITIAL_ARTICLES } from './constants';
import { Article, Category, ResourceType, User } from './types';
import { Button } from './components/Button';

// Configuration: Map Top Level Categories to Sub Categories
// Configuration: Map Top Level Categories to Sub Categories
const CATEGORY_MAPPING: Record<TopLevelCategory, Category[]> = {
  LATEST: Object.values(Category), // Shows everything
  BUSINESS: [
    Category.BUSINESS,
    Category.MARKETS,
    Category.ENTERTAINMENT,
    Category.STYLE,
    Category.TRAVEL,
    Category.SPORTS
  ],
  TECH: [
    Category.TECH,
    Category.SCIENCE,
    Category.CLIMATE,
    Category.WEATHER,
    Category.HEALTH
  ],
  BOOKS: [Category.BOOKS] // Only show books in Books tab
};

// Helper to extract YouTube Thumbnail
const getYoutubeThumbnail = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11)
    ? `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`
    : null;
};

// Helper to normalize legacy Chinese categories to English Enums
const normalizeCategory = (cat: string): Category => {
  const mapping: Record<string, Category> = {
    '商業趨勢': Category.BUSINESS,
    '市場動態': Category.MARKETS,
    '健康醫學': Category.HEALTH,
    '影視娛樂': Category.ENTERTAINMENT,
    '科技創新': Category.TECH,
    '時尚風格': Category.STYLE,
    '旅行': Category.TRAVEL,
    '體育': Category.SPORTS,
    '科學探索': Category.SCIENCE,
    '自然氣候': Category.CLIMATE,
    '天氣': Category.WEATHER,
    '書籍': Category.BOOKS
  };
  // If it's already a valid enum value (English), return it. Otherwise map it.
  return (Object.values(Category).includes(cat as Category))
    ? cat as Category
    : mapping[cat] || cat as Category;
};

function App() {
  // Initialize Articles from LocalStorage or fall back to constants
  const [articles, setArticles] = useState<Article[]>(() => {
    try {
      const saved = localStorage.getItem('yst_articles');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Normalize categories for all legacy data
        return parsed.map((a: Article) => ({
          ...a,
          category: normalizeCategory(a.category)
        }));
      }
      return INITIAL_ARTICLES;
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

  // Sub-category Slider Logic
  const [subCatSliderStyle, setSubCatSliderStyle] = useState({ width: 0, left: 0 });
  const subCatNavRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const subCatContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSliderPosition = () => {
      const activeKey = currentSubCategory;
      const activeEl = subCatNavRefs.current[activeKey];
      if (activeEl) {
        setSubCatSliderStyle({
          width: activeEl.offsetWidth,
          left: activeEl.offsetLeft
        });
      }
    };

    // Initial update
    updateSliderPosition();

    // Create ResizeObserver to handle dynamic content changes (fonts, scroll resize, window resize)
    const observer = new ResizeObserver(() => {
      // Re-measure when container or its content changes size
      updateSliderPosition();
    });

    if (subCatContainerRef.current) {
      observer.observe(subCatContainerRef.current);
    }

    // Also observe the active button itself in case it specifically resizes without affecting container
    const activeBtn = subCatNavRefs.current[currentSubCategory];
    if (activeBtn) {
      observer.observe(activeBtn);
    }

    return () => observer.disconnect();
  }, [currentSubCategory, isScrolled]);

  const currentSubCategoriesToDisplay = useMemo(() => {
    const cats = CATEGORY_MAPPING[currentTopLevel] || Object.values(Category);
    return Array.from(new Set(cats)); // Ensure uniqueness to prevent duplicate keys
  }, [currentTopLevel]);

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
    // window.scrollTo(0, 0); // Keep scroll position to maintain glass effect
    if (selectedArticle) setSelectedArticle(null);
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
        // For other categories (Tech, Business, etc.), exclude Books
        filtered = filtered.filter(a => allowedCategories.includes(a.category) && a.type !== 'BOOK');
      }
    } else {
      // LATEST shows everything including books
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
    // Exception: For BOOKS, we hide the hero section, so we should show ALL items in the grid.
    if (currentTopLevel === 'BOOKS') return filteredArticles;

    return filteredArticles.slice(1);
  }, [filteredArticles, currentTopLevel]);

  const heroArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    window.scrollTo(0, 0);
    markAsRead(article.id);
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

  const handleEmptyTrash = () => {
    if (window.confirm('確定要清空垃圾桶嗎？此動作無法復原。')) {
      setDeletedArticles([]);
    }
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

    setUsersDb(prev => {
      const user = prev[currentUser.username];
      const read = user.readArticleIds || [];
      if (read.includes(id)) return prev; // Already read

      const newRead = [...read, id];
      const updatedUser = { ...user, readArticleIds: newRead };

      // Update current user session
      setCurrentUser(updatedUser);
      localStorage.setItem('yst_user', JSON.stringify(updatedUser)); // Update session immediately
      return { ...prev, [currentUser.username]: updatedUser };
    });
  };

  const isArticleRead = (id: string) => {
    return currentUser?.readArticleIds?.includes(id) || false;
  };

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
        savedArticles: [],
        readArticleIds: []
      };
      // For new users, just save them
      setUsersDb(prev => ({ ...prev, [username]: user }));
    } else {
      // Ensure readArticleIds exists for existing users (migration)
      if (!user.readArticleIds) {
        user = { ...user, readArticleIds: [] };
        setUsersDb(prev => ({ ...prev, [username]: user }));
      }
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
    <div className="min-h-screen flex flex-col bg-[#f5f5f7]">
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
          {/* Sub-Category Filter Bar - Full Width - Hidden for BOOKS */}
          {currentTopLevel !== 'BOOKS' && (
            <div
              className={`sticky top-20 z-40 w-full overflow-x-auto no-scrollbar transition-all duration-300
                ${isScrolled ? 'py-1 md:py-2' : 'py-1 md:py-2'} 
                bg-[#f5f5f7]/70 backdrop-blur-xl backdrop-saturate-150 shadow-sm border-b border-black/5 supports-[backdrop-filter]:bg-[#f5f5f7]/60
                [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]
                md:[mask-image:linear-gradient(to_right,transparent,black_30px,black_calc(100%-30px),transparent)]
              `}
            >
              <div className="max-w-[2100px] mx-auto px-4 sm:px-8 lg:px-12 flex justify-center">
                <div
                  ref={subCatContainerRef} // Add ref to container for ResizeObserver
                  className="relative bg-white/50 backdrop-blur-md p-2.5 rounded-full inline-flex shadow-sm border border-white/20"
                >
                  {/* Animated Background Slider */}
                  <div
                    className="absolute top-2.5 bg-black/80 rounded-full shadow-sm transition-all duration-300 ease-out z-0 backdrop-blur-sm"
                    style={{
                      width: `${subCatSliderStyle.width}px`,
                      height: 'calc(100% - 20px)',
                      transform: `translateX(${subCatSliderStyle.left}px)`
                    }}
                  />

                  <button
                    ref={el => subCatNavRefs.current['ALL'] = el}
                    onClick={() => setCurrentSubCategory('ALL')}
                    className={`
                      relative z-10 flex items-center justify-center leading-none
                      ${isScrolled ? 'px-4 py-1.5 text-[13px]' : 'px-5 py-2 text-sm'}
                      md:px-6 md:py-2.5 md:text-base rounded-full font-medium transition-all duration-200 whitespace-nowrap
                      ${currentSubCategory === 'ALL' ? 'text-white' : 'text-gray-500 hover:text-gray-900'}
                    `}
                  >
                    All
                  </button>
                  {currentSubCategoriesToDisplay.map(cat => (
                    <button
                      key={cat}
                      ref={el => subCatNavRefs.current[cat] = el}
                      onClick={() => setCurrentSubCategory(cat)}
                      className={`
                        relative z-10 flex items-center justify-center leading-none
                        ${isScrolled ? 'px-4 py-1.5 text-[13px]' : 'px-5 py-2 text-sm'}
                        md:px-6 md:py-2.5 md:text-base rounded-full font-medium transition-all duration-200 whitespace-nowrap
                        ${currentSubCategory === cat ? 'text-white' : 'text-gray-500 hover:text-gray-900'}
                      `}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <main className="flex-1 max-w-[2100px] w-full mx-auto px-4 sm:px-8 lg:px-12 pt-6 space-y-16">
            {/* Featured Hero Section - Hide on BOOKS tab */}
            {heroArticle && currentTopLevel !== 'BOOKS' && (
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
                title="Latest Releases"
                icon={<LayoutGrid size={28} className="text-gray-700" />}
              >
                <div className={`grid gap-8 md:gap-8 lg:gap-10 animate-[fadeIn_0.7s_ease-out] ${currentTopLevel === 'BOOKS'
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  }`}>
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
                <p className="text-gray-500 font-medium text-lg">No content in this category</p>
                <Button variant="ghost" size="lg" onClick={() => setCurrentSubCategory('ALL')} className="mt-6">
                  View all content
                </Button>
              </div>
            ) : null}
          </main>
        </>
      )
      }

      <SubmitModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingArticle(null);
        }}
        onSubmit={editingArticle ? handleUpdateArticle : handleAddArticle}
        initialData={editingArticle}
        currentUser={currentUser}
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
        onEmptyTrash={handleEmptyTrash}
        onPermanentDelete={handlePermanentDelete}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />

      {
        !selectedArticle && (
          <footer className="mt-auto border-t border-gray-200 bg-white py-12">
            <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-base">
              <p>&copy; 2026 YST Knowledge Space. All rights reserved.</p>
            </div>
          </footer>
        )
      }
    </div >
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