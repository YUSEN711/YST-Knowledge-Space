import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { Button } from './Button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string, password?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (username.trim()) {
      const success = onLogin(username.trim(), password);
      // App.tsx handles closing IF it doesn't return a boolean or actually opens/closes globally
      // Wait, isLoginModalOpen is managed by App.tsx. So onLogin already calls setIsLoginModalOpen(false) if success.
      // We just need to reset the local input fields.
      if (success !== false) {
        setUsername('');
        setPassword('');
      }
    }
  };

  const handleClose = () => {
    setUsername('');
    setPassword('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-[fadeIn_0.3s_ease-out]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            歡迎來到 Knowledge Space
          </h3>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-2">請輸入您的名稱以登入或註冊</p>
          </div>

          <div className="space-y-4">
            <input
              required
              autoFocus
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="您的名稱 (例如: Alex)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black transition-all outline-none text-base text-center"
            />
            {username.toLowerCase() === 'jason' && (
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black transition-all outline-none text-base text-center"
              />
            )}
          </div>

          <Button type="submit" className="w-full" size="lg">
            登入 / 註冊
          </Button>
        </form>
      </div>
    </div>
  );
};