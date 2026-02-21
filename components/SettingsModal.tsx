import React, { useState } from 'react';
import { X, Settings, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from './Button';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (newPassword.length < 6) {
            setError('密碼長度至少需要 6 個字元。');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('兩次輸入的密碼不一致，請重新確認。');
            return;
        }

        setIsLoading(true);
        const { error: supaError } = await supabase.auth.updateUser({ password: newPassword });
        setIsLoading(false);

        if (supaError) {
            setError('更改失敗：' + supaError.message);
        } else {
            setSuccess(true);
            setNewPassword('');
            setConfirmPassword('');
        }
    };

    const handleClose = () => {
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            />
            <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-[fadeIn_0.3s_ease-out]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Settings size={20} className="text-gray-600" />
                        設定
                    </h3>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Change Password Section */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Lock size={14} />
                            更改密碼
                        </h4>

                        {success ? (
                            <div className="flex flex-col items-center gap-2 py-6 text-green-600">
                                <CheckCircle size={40} />
                                <p className="font-semibold">密碼更改成功！</p>
                                <p className="text-sm text-gray-400">下次登入時請使用新密碼。</p>
                            </div>
                        ) : (
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                {/* New Password */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">新密碼</label>
                                    <div className="relative">
                                        <input
                                            type={showNew ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="請輸入新密碼（至少 6 字元）"
                                            className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                        >
                                            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">確認新密碼</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="請再次輸入新密碼"
                                            className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                        >
                                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Error message */}
                                {error && (
                                    <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>
                                )}

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full"
                                    isLoading={isLoading}
                                >
                                    確認更改密碼
                                </Button>
                            </form>
                        )}
                    </div>

                    <p className="text-xs text-center text-gray-400">Knowledge Space v1.0</p>
                </div>
            </div>
        </div>
    );
};
