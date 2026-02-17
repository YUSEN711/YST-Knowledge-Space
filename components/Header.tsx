import React, { useState, useEffect, useRef } from 'react';
import { Plus, Bookmark, Menu, X, LogIn, Trash2, LogOut } from 'lucide-react';
import { Button } from './Button';
import { User } from '../types';

export type TopLevelCategory = 'LATEST' | 'BUSINESS' | 'TECH' | 'BOOKS';

interface HeaderProps {
  onOpenSubmit: () => void;
  onOpenSaved: () => void;
  onOpenLogin: () => void;
  onOpenTrash: () => void;

  currentTopLevel: TopLevelCategory;
  onTopLevelChange: (level: TopLevelCategory) => void;
  user: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSubmit,
  onOpenSaved,
  onOpenLogin,
  onOpenTrash,

  currentTopLevel,
  onTopLevelChange,
  user,
  onLogout
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isSuperAdmin = user?.name === 'Jason';

  const navItems: { id: TopLevelCategory; label: string }[] = [
    { id: 'LATEST', label: 'Latest' },
    { id: 'TECH', label: 'Tech' },
    { id: 'BUSINESS', label: 'Business' },
    { id: 'BOOKS', label: 'Books' },
  ];

  const handleMobileNavClick = (id: TopLevelCategory) => {
    onTopLevelChange(id);
    setIsMobileMenuOpen(false);
  };

  // State for animated slider
  const [sliderStyle, setSliderStyle] = useState({ width: 0, left: 0 });
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Update slider position when active tab changes
  useEffect(() => {
    const activeButton = navRefs.current[currentTopLevel];
    if (activeButton) {
      setSliderStyle({
        width: activeButton.offsetWidth,
        left: activeButton.offsetLeft
      });
    }
  }, [currentTopLevel]);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="max-w-[2100px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer z-20"
            onClick={() => onTopLevelChange('LATEST')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-black rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shrink-0">Y</div>
            <span className="font-bold text-base sm:text-xl tracking-tight text-gray-900 block truncate max-w-[180px] sm:max-w-none">
              YST Knowledge Space
            </span>
          </div>

          {/* Desktop Navigation (Hidden on Mobile) */}
          <nav className="hidden md:flex gap-2 sm:gap-4 bg-gray-100/50 p-1.5 rounded-full overflow-x-auto no-scrollbar max-w-[200px] sm:max-w-none relative">
            {/* Animated Background Slider */}
            <div
              className="absolute top-1.5 bg-white rounded-full shadow-sm transition-all duration-300 ease-out"
              style={{
                width: `${sliderStyle.width}px`,
                height: 'calc(100% - 12px)',
                transform: `translateX(${sliderStyle.left}px)`
              }}
            />
            {navItems.map((item) => (
              <button
                key={item.id}
                ref={(el) => {
                  navRefs.current[item.id] = el;
                }}
                onClick={() => onTopLevelChange(item.id)}
                className={`px-5 py-2 rounded-full text-base font-medium transition-all duration-200 whitespace-nowrap relative z-10 ${currentTopLevel === item.id
                  ? 'text-black'
                  : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Action Button & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-4 z-20">

            {/* Admin Trash Button (Desktop) */}
            {isSuperAdmin && (
              <Button
                variant="ghost"
                size="md"
                onClick={onOpenTrash}
                className="hidden md:flex items-center gap-2 !px-3 text-red-500 hover:text-red-600 hover:bg-red-50"
                title="最近刪除"
              >
                <Trash2 size={20} />
              </Button>
            )}



            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={onOpenSaved}
                  className="flex items-center gap-2 !px-2 sm:!px-3"
                  title="我的收藏"
                >
                  <Bookmark size={20} className="md:w-[22px] md:h-[22px]" />
                  <span className="hidden lg:inline text-sm">{user.name}</span>
                </Button>

                {/* Logout Button (Desktop/Tablet) */}
                <Button
                  variant="ghost"
                  size="md"
                  onClick={onLogout}
                  className="hidden sm:flex items-center gap-2 !px-2 sm:!px-3 text-gray-500 hover:text-red-600 hover:bg-red-50"
                  title="登出"
                >
                  <LogOut size={20} className="md:w-[20px] md:h-[20px]" />
                  <span className="hidden lg:inline text-sm">登出</span>
                </Button>

                {/* Share Article Button (Only visible when logged in) */}
                <Button
                  variant="primary"
                  size="md"
                  onClick={onOpenSubmit}
                  className="flex items-center gap-2 !h-8 !px-3 sm:!h-10 sm:!px-6"
                >
                  <Plus className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden md:inline">分享文章</span>
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                size="md"
                onClick={onOpenLogin}
                className="flex items-center gap-2 !h-8 !px-3 sm:!h-10 sm:!px-5"
              >
                <LogIn className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">登入</span>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-20 left-0 w-full bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-lg md:hidden animate-[fadeIn_0.2s_ease-out]">
          <div className="px-6 py-6 space-y-3">
            {/* User Info in Mobile Menu */}
            {user ? (
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center justify-between px-2 bg-gray-50 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                      {user.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">已登入</div>
                    </div>
                  </div>
                  <button onClick={onLogout} className="text-sm text-red-500 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    <LogOut size={16} />
                    登出
                  </button>
                </div>

                {/* Admin Trash Link (Mobile) */}
                {isSuperAdmin && (
                  <button
                    onClick={() => { onOpenTrash(); setIsMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl bg-red-50 text-red-600 font-medium flex items-center gap-2"
                  >
                    <Trash2 size={18} />
                    最近刪除
                  </button>
                )}


              </div>
            ) : (
              <button
                onClick={() => { onOpenLogin(); setIsMobileMenuOpen(false); }}
                className="w-full text-center py-3 mb-4 bg-black text-white rounded-xl font-medium"
              >
                登入 / 註冊
              </button>
            )}

            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">瀏覽分類</div>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMobileNavClick(item.id)}
                className={`w-full text-left px-4 py-4 rounded-2xl text-lg font-medium transition-all flex items-center justify-between group ${currentTopLevel === item.id
                  ? 'bg-gray-100 text-black'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                {item.label}
                {currentTopLevel === item.id && (
                  <div className="w-2 h-2 bg-black rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};