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
import { supabase } from './lib/supabase';

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
  const [articles, setArticles] = useState<Article[]>([]);
  const [deletedArticles, setDeletedArticles] = useState<Article[]>([]);
  const [usersDb, setUsersDb] = useState<Record<string, User>>({});
  const [isInitializing, setIsInitializing] = useState(true);

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

  // 1. Listen for Auth State Changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
      }
    });

    // Listen for auth changes (login, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper to fetch custom user profile based on Auth UID
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    if (data) {
      const user: User = {
        id: data.id,
        name: data.name,
        username: data.username,
        avatar: data.avatar || `https://ui-avatars.com/api/?name=${data.name}&background=random`,
        role: data.role as 'ADMIN' | 'USER',
        savedArticles: data.saved_articles || [],
        readArticleIds: data.read_articles || []
      };
      setCurrentUser(user);
    }
  };

  // Fetch initial articles and subscribe to changes
  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch articles
      const { data: articlesData } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (articlesData) {
        const active = articlesData.filter(a => !a.is_deleted).map(mapArticleFromDb);
        const deleted = articlesData.filter(a => a.is_deleted).map(mapArticleFromDb);
        if (active.length > 0) setArticles(active);
        // Fallback to initial articles if db is empty (for demo purposes)
        else setArticles(INITIAL_ARTICLES);
        setDeletedArticles(deleted);
      } else {
        setArticles(INITIAL_ARTICLES);
      }

      setIsInitializing(false);
    };

    fetchInitialData();

    // Set up Realtime Subscriptions
    const articlesSubscription = supabase
      .channel('articles-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newArt = mapArticleFromDb(payload.new as any);
          if (newArt.is_deleted) {
            setDeletedArticles(prev => [newArt, ...prev]);
          } else {
            setArticles(prev => [newArt, ...prev]);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedArt = mapArticleFromDb(payload.new as any);

          // Handle soft delete toggle
          if (updatedArt.is_deleted) {
            setArticles(prev => prev.filter(a => a.id !== updatedArt.id));
            setDeletedArticles(prev => {
              if (prev.find(a => a.id === updatedArt.id)) return prev;
              return [updatedArt, ...prev];
            });
          } else {
            setDeletedArticles(prev => prev.filter(a => a.id !== updatedArt.id));
            setArticles(prev => {
              const existing = prev.find(a => a.id === updatedArt.id);
              if (existing) return prev.map(a => a.id === updatedArt.id ? updatedArt : a);
              return [updatedArt, ...prev].sort((a, b) => b.id.localeCompare(a.id));
            });
          }
        } else if (payload.eventType === 'DELETE') {
          setDeletedArticles(prev => prev.filter(a => a.id !== payload.old.id));
          setArticles(prev => prev.filter(a => a.id !== payload.old.id));
        }
      })
      .subscribe();

    const usersSubscription = supabase
      .channel('users-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, (payload) => {
        const u = payload.new as any;
        if (!u || !u.id) return;

        const updatedUser: User = {
          id: u.id,
          name: u.name,
          username: u.username,
          avatar: u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`,
          role: u.role,
          savedArticles: u.saved_articles || [],
          readArticleIds: u.read_articles || []
        };

        setUsersDb(prev => ({ ...prev, [u.username]: updatedUser }));

        // If the updated user is the current logged-in user, refresh their session state
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user?.id === u.id) {
            setCurrentUser(updatedUser);
          }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(articlesSubscription);
      supabase.removeChannel(usersSubscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper map function
  const mapArticleFromDb = (dbArt: any): Article => ({
    id: dbArt.id,
    title: dbArt.title,
    summary: dbArt.summary,
    url: dbArt.url,
    imageUrl: dbArt.image_url || '',
    category: normalizeCategory(dbArt.category),
    type: dbArt.type as ResourceType,
    date: dbArt.date,
    author: dbArt.author_name || 'Anonymous', // Map new schema field
    content: dbArt.content || undefined,
    keyPoints: dbArt.key_points || undefined,
    conclusion: dbArt.conclusion || undefined,
    isFeatured: dbArt.is_featured || false,
    is_deleted: dbArt.is_deleted || false
  });

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

  const handleAddArticle = async (articleData: Omit<Article, 'id' | 'date' | 'author'> & { imageUrl?: string }) => {
    if (!currentUser) return;

    const newArticle = {
      title: articleData.title,
      summary: articleData.summary,
      url: articleData.url,
      image_url: articleData.imageUrl || null,
      category: articleData.category,
      type: articleData.type,
      author_id: currentUser.id,
      author_name: currentUser.name,
      content: articleData.content || null,
      key_points: articleData.keyPoints || null,
      conclusion: articleData.conclusion || null,
      is_featured: false
    };

    // Note: State updates automatically via Realtime subscription!
    const { error } = await supabase.from('articles').insert([newArticle]);
    if (error) {
      console.error("Error adding article:", error);
      alert("發布失敗，請確認您已登入。");
    }

    setIsModalOpen(false);
  };

  const handleUpdateArticle = async (articleData: Omit<Article, 'id' | 'date' | 'author'> & { imageUrl?: string }) => {
    if (!editingArticle) return;

    // Handle Mock Article Update
    if (editingArticle.id.length < 36) {
      const updatedLocalArticle = {
        ...editingArticle,
        title: articleData.title,
        summary: articleData.summary,
        url: articleData.url,
        imageUrl: articleData.imageUrl || editingArticle.imageUrl || '',
        category: articleData.category,
        type: articleData.type,
        content: articleData.content,
        keyPoints: articleData.keyPoints,
        conclusion: articleData.conclusion
      };
      setArticles(prev => prev.map(a => a.id === editingArticle.id ? updatedLocalArticle : a));
      setIsModalOpen(false);
      setEditingArticle(null);
      if (selectedArticle?.id === editingArticle.id) {
        setSelectedArticle(updatedLocalArticle);
      }
      return;
    }

    const updatedDbArticle = {
      title: articleData.title,
      summary: articleData.summary,
      url: articleData.url,
      image_url: articleData.imageUrl || editingArticle.imageUrl || null,
      category: articleData.category,
      type: articleData.type,
      content: articleData.content || null,
      key_points: articleData.keyPoints || null,
      conclusion: articleData.conclusion || null
    };

    const { error } = await supabase
      .from('articles')
      .update(updatedDbArticle)
      .eq('id', editingArticle.id);

    if (error) console.error("Error updating article:", error);

    setIsModalOpen(false);
    setEditingArticle(null);
    if (selectedArticle?.id === editingArticle.id) {
      // Optimistic update for immediately open modal
      setSelectedArticle({ ...editingArticle, ...articleData, imageUrl: updatedDbArticle.image_url || '' });
    }
  };

  const handleSoftDeleteArticle = async (id: string) => {
    // Handle Mock Article Soft Delete
    if (id.length < 36) {
      const mockArticle = articles.find(a => a.id === id);
      if (mockArticle) {
        setArticles(prev => prev.filter(a => a.id !== id));
        setDeletedArticles(prev => [{ ...mockArticle, is_deleted: true }, ...prev]);
      }
      if (selectedArticle?.id === id) setSelectedArticle(null);
      return;
    }

    const { error } = await supabase.from('articles').update({ is_deleted: true }).eq('id', id);
    if (error) {
      console.error("Error soft deleting:", error);
      alert("移至垃圾桶失敗：" + error.message);
    }
    if (selectedArticle?.id === id) setSelectedArticle(null);
  };

  const handleRestoreArticle = async (id: string) => {
    // Handle Mock Article Restore
    if (id.length < 36) {
      const mockArticle = deletedArticles.find(a => a.id === id);
      if (mockArticle) {
        setDeletedArticles(prev => prev.filter(a => a.id !== id));
        setArticles(prev => [{ ...mockArticle, is_deleted: false }, ...prev].sort((a, b) => b.id.localeCompare(a.id)));
      }
      return;
    }

    const { error } = await supabase.from('articles').update({ is_deleted: false }).eq('id', id);
    if (error) console.error("Error restoring:", error);
  };

  const handlePermanentDelete = async (id: string) => {
    // Handle Mock Article Permanent Delete
    if (id.length < 36) {
      setDeletedArticles(prev => prev.filter(a => a.id !== id));
      return;
    }

    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) {
      console.error("Error permanent deleting:", error);
      alert("永久刪除失敗：" + error.message);
    }
  };

  const handleEmptyTrash = async () => {
    if (window.confirm('確定要清空垃圾桶嗎？此動作無法復原。')) {
      // Clear Mock Articles from Trash
      setDeletedArticles(prev => prev.filter(a => a.id.length >= 36));

      // Delete all where is_deleted = true from DB
      const { error } = await supabase.from('articles').delete().eq('is_deleted', true);
      if (error) {
        console.error("Error emptying trash:", error);
        alert("清空垃圾桶失敗：" + error.message);
      }
    }
  };

  const toggleSaveArticle = async (id: string) => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }

    const saved = currentUser.savedArticles || [];
    const newSaved = saved.includes(id)
      ? saved.filter(sid => sid !== id)
      : [...saved, id];

    // Optimistic UI update
    const updatedUser = { ...currentUser, savedArticles: newSaved };
    setCurrentUser(updatedUser);
    localStorage.setItem('yst_user', JSON.stringify(updatedUser));

    // DB Update
    const { error } = await supabase.from('user_profiles').update({ saved_articles: newSaved }).eq('username', currentUser.username);
    if (error) console.error("Error updating saved articles:", error);
  };

  const isArticleSaved = (id: string) => {
    return currentUser?.savedArticles?.includes(id) || false;
  };

  const markAsRead = async (id: string) => {
    if (!currentUser) return;

    const read = currentUser.readArticleIds || [];
    if (read.includes(id)) return;

    const newRead = [...read, id];

    // Optimistic UI update
    const updatedUser = { ...currentUser, readArticleIds: newRead };
    setCurrentUser(updatedUser);
    localStorage.setItem('yst_user', JSON.stringify(updatedUser));

    // DB Update
    const { error } = await supabase.from('user_profiles').update({ read_articles: newRead }).eq('username', currentUser.username);
    if (error) console.error("Error marking as read:", error);
  };

  const isArticleRead = (id: string) => {
    return currentUser?.readArticleIds?.includes(id) || false;
  };

  const handleLogin = async (email: string, password?: string, isSignUp?: boolean) => {
    if (!password) throw new Error("密碼不得為空");

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      // Note: Triggers automatically create the user_profile.
      // We might need to wait a second for the trigger to insert it before selecting, but Realtime will catch it.

      // After sign up, users are automatically logged in or sent a confirmation email depending on Supabase settings.
      // For this case, we assume auto-login if email confirmations are disabled.
      if (data.user) {
        setIsLoginModalOpen(false);
        return true;
      }
      return false;

    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      if (data.user) {
        setIsLoginModalOpen(false);
        return true;
      }
      return false;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
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
                [mask-image:linear-gradient(to_right,transparent,black_4px,black_calc(100%-4px),transparent)]
                md:[mask-image:linear-gradient(to_right,transparent,black_30px,black_calc(100%-30px),transparent)]
              `}
            >
              <div className="max-w-[2100px] mx-auto px-4 sm:px-8 lg:px-12 w-max min-w-full flex justify-center">
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