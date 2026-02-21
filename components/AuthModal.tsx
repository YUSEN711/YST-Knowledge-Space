import React, { useState } from 'react';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password?: string, isSignUp?: boolean) => Promise<boolean>;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (email.trim() && password.trim()) {
      setIsLoading(true);
      try {
        const success = await onLogin(email.trim(), password.trim(), isSignUp);
        if (success) {
          setEmail('');
          setPassword('');
          setIsSignUp(false);
        } else {
          setErrorMsg(isSignUp ? '註冊失敗，請檢查信箱格式或密碼長度（至少 6 碼）。' : '登入失敗，請檢查信箱或密碼是否正確。');
        }
      } catch (err: any) {
        setErrorMsg(err.message || '發生未知錯誤');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setErrorMsg('');
    setIsSignUp(false);
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
              <Mail size={32} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-2">請輸入您的 Email 與密碼</p>
          </div>

          <div className="space-y-4">
            <div className="relative relative-group">
              <input
                required
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="信箱 (Email)"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black transition-all outline-none text-base"
              />
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="relative">
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密碼 (至少 6 個字元)"
                minLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-black focus:ring-1 focus:ring-black transition-all outline-none text-base"
              />
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {errorMsg && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
              {errorMsg}
            </div>
          )}

          <Button type="submit" className="w-full flex justify-center items-center gap-2" size="lg" disabled={isLoading}>
            {isLoading && <Loader2 size={18} className="animate-spin" />}
            {isSignUp ? '建立帳號' : '登入'}
          </Button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-gray-500 hover:text-black transition-colors"
            >
              {isSignUp ? '已經有帳號了嗎？點此登入' : '還沒有帳號嗎？點此註冊'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};