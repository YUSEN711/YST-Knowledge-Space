import React, { useState, useEffect } from 'react';
import { X, Key, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './Button';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (apiKey: string) => void;
    currentApiKey: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentApiKey }) => {
    const [apiKey, setApiKey] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setApiKey(currentApiKey);
            setIsSaved(false);
        }
    }, [isOpen, currentApiKey]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(apiKey);
        setIsSaved(true);
        setTimeout(() => {
            onClose();
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-[fadeIn_0.3s_ease-out]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Key size={20} className="text-blue-600" />
                        API 設定
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSave} className="p-6 space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 block">
                            Google Gemini API Key
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                    setIsSaved(false);
                                }}
                                placeholder="貼上您的 API Key (AIza...)"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm font-mono"
                            />
                            <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>

                        <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-lg flex items-start gap-2">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <p>
                                您的 API Key 僅會儲存在此瀏覽器的 <strong>LocalStorage</strong> 中，
                                不會傳送到我們的伺服器，請安心使用。
                                <br />
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-semibold hover:text-blue-900 mt-1 inline-block">
                                    取得免費 API Key &rarr;
                                </a>
                            </p>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            variant="primary"
                            className={`w-full transition-all duration-300 ${isSaved ? 'bg-green-600 hover:bg-green-700 border-green-600' : ''}`}
                        >
                            {isSaved ? (
                                <span className="flex items-center gap-2">
                                    <CheckCircle size={18} />
                                    已儲存 !
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Save size={18} />
                                    儲存設定
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
