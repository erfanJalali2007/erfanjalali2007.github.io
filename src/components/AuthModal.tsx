import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldCheck,
  User as UserIcon,
  Crown,
  KeyRound,
  LogIn,
  LogOut,
  UserPlus,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { GlassTheme } from '../types';
import { usePortfolio } from '../context/PortfolioContext';
import { playGlassResonance } from '../utils/audio';

interface AuthModalProps {
  theme: GlassTheme;
  blurLevel: number;
  isMuted: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  theme,
  blurLevel,
  isMuted,
}) => {
  const {
    currentUser,
    login,
    quickLogin,
    register,
    logout,
    isAuthModalOpen,
    setIsAuthModalOpen,
    setIsAdminEditorOpen,
  } = usePortfolio();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setStatusMessage(null);
    playGlassResonance(440, isMuted);
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    if (!username.trim() || !password) {
      setStatusMessage({ type: 'error', text: 'لطفاً نام کاربری و رمز عبور را وارد نمایید.' });
      playGlassResonance(320, isMuted);
      return;
    }

    const res = login(username, password);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      playGlassResonance(660, isMuted);
      setTimeout(() => {
        setIsAuthModalOpen(false);
      }, 900);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
      playGlassResonance(300, isMuted);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    if (!username.trim() || !password) {
      setStatusMessage({ type: 'error', text: 'نام کاربری و رمز عبور الزامی است.' });
      playGlassResonance(320, isMuted);
      return;
    }

    const res = register(username, name, email, password);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      playGlassResonance(680, isMuted);
      setTimeout(() => {
        setIsAuthModalOpen(false);
      }, 900);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
      playGlassResonance(300, isMuted);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Optical Blur Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            backdropFilter: `blur(${blurLevel}px) saturate(180%)`,
            WebkitBackdropFilter: `blur(${blurLevel}px) saturate(180%)`,
            backgroundColor: theme.cardStyles.background,
            borderColor: theme.cardStyles.border,
          }}
          className="relative w-full max-w-lg rounded-3xl p-6 sm:p-8 glass-specular-border shadow-2xl z-10 overflow-hidden border border-white/20"
        >
          {/* Top Edge Highlight */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px] opacity-70 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${theme.cardStyles.highlight} 50%, transparent 100%)`,
            }}
          />

          {/* Close Button */}
          <button
            onClick={handleClose}
            title="بستن پنجره"
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/15 shadow-inner">
              {currentUser?.role === 'admin' ? (
                <Crown className={`w-6 h-6 ${theme.accentClass.icon}`} />
              ) : currentUser ? (
                <UserIcon className={`w-6 h-6 ${theme.accentClass.icon}`} />
              ) : (
                <ShieldCheck className={`w-6 h-6 ${theme.accentClass.icon}`} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold text-white tracking-tight">
                  {currentUser ? 'پروفایل و مدیریت دسترسی' : 'سیستم ورود و احراز هویت'}
                </h3>
              </div>
              <p className="text-xs text-slate-300 font-normal mt-0.5">
                {currentUser
                  ? `وارد شده با عنوان: ${currentUser.name}`
                  : 'ورود به عنوان ادمین (دسترسی ویرایش متون و بخش‌ها) یا کاربر معمولی'}
              </p>
            </div>
          </div>

          {/* Status notification banner */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl mb-5 flex items-center gap-2.5 text-xs font-medium border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-200 border-rose-500/30'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={16} className="shrink-0" />
              ) : (
                <AlertCircle size={16} className="shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {currentUser ? (
            /* Logged-In User Profile Card */
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/15 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/20 relative shadow-md">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/10 text-white font-mono text-lg font-bold">
                        {currentUser.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold text-white">{currentUser.name}</h4>
                      <span
                        className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-semibold border ${
                          currentUser.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        }`}
                      >
                        {currentUser.role === 'admin' ? '👑 مدیر سایت (ادمین)' : '👤 کاربر معمولی'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      @{currentUser.username} • {currentUser.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role capabilities box */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-200 space-y-2">
                <div className="font-semibold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <Sparkles size={14} className={theme.accentClass.icon} />
                  <span>سطح دسترسی شما:</span>
                </div>
                {currentUser.role === 'admin' ? (
                  <p className="text-slate-300 leading-relaxed font-normal">
                    شما دسترسی کامل ادمین دارید. می‌توانید عناوین، بیوگرافی، آمار، متون پروژه‌ها، لیست مهارت‌ها و تایم‌لاین سوابق را مستقیماً ویرایش و ذخیره کنید.
                  </p>
                ) : (
                  <p className="text-slate-300 leading-relaxed font-normal">
                    شما با عنوان کاربر معمولی وارد شده‌اید. می‌توانید صفحات را مرور کرده، تنظیمات ظاهر را سفارشی‌سازی کنید و پیام ارسال نمایید. برای تغییر محتوای متنی، به حساب ادمین وارد شوید.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      setIsAuthModalOpen(false);
                      setIsAdminEditorOpen(true);
                      playGlassResonance(640, isMuted);
                    }}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-white/30 shadow-lg cursor-pointer rgb-interactive-option"
                  >
                    <Sliders size={15} className={theme.accentClass.icon} />
                    <span>ویرایش متون و محتوای سایت</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    logout();
                    playGlassResonance(400, isMuted);
                    setStatusMessage({ type: 'success', text: 'با موفقیت خارج شدید.' });
                  }}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 hover:text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 border border-rose-500/25 cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>خروج از حساب</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login & Quick Access Form */
            <div className="space-y-6">
              {/* Quick 1-Click Access Buttons */}
              <div>
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-300 block mb-2.5">
                  دسترسی سریع و تست یک‌کلیکه (Quick Login)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      quickLogin('admin');
                      playGlassResonance(650, isMuted);
                    }}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/40 text-white text-left transition-all flex items-center gap-3 shadow-sm cursor-pointer group rgb-interactive-option"
                  >
                    <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0">
                      <Crown size={18} />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 text-white">
                        <span>ورود به عنوان ادمین</span>
                      </div>
                      <div className="text-[11px] text-amber-200/90 font-medium">
                        دسترسی کامل ویرایش متون و بخش‌ها
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      quickLogin('user');
                      playGlassResonance(550, isMuted);
                    }}
                    className="p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/10 border border-white/15 text-white text-left transition-all flex items-center gap-3 shadow-sm cursor-pointer group rgb-interactive-option"
                  >
                    <div className="p-2 rounded-xl bg-white/10 border border-white/20 text-slate-200 shrink-0">
                      <UserIcon size={18} />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-white">
                        ورود به عنوان کاربر عادی
                      </div>
                      <div className="text-[11px] text-slate-300 font-medium">
                        دسترسی استاندارد و بازدید
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Separator Divider */}
              <div className="flex items-center gap-3">
                <div className="h-[1px] flex-1 bg-white/10" />
                <span className="text-[11px] font-mono text-slate-400">یا ورود دستی با نام کاربری</span>
                <div className="h-[1px] flex-1 bg-white/10" />
              </div>

              {/* Tabs: Sign In / Register */}
              <div className="flex rounded-xl bg-black/30 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setStatusMessage(null);
                  }}
                  className={`flex-1 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                    mode === 'login'
                      ? 'bg-white/20 text-white shadow-sm border border-white/20'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  ورود به حساب (Sign In)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setStatusMessage(null);
                  }}
                  className={`flex-1 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                    mode === 'register'
                      ? 'bg-white/20 text-white shadow-sm border border-white/20'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  ثبت‌نام کاربر جدید (Register)
                </button>
              </div>

              {mode === 'login' ? (
                <form onSubmit={handleManualLogin} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-mono font-medium text-slate-300 block mb-1">
                      نام کاربری (Username)
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin یا user"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/30 border border-white/20 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/40"
                    />
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      راهنما: <code className="text-amber-300 font-semibold">admin</code> (رمز: <code className="text-amber-300">admin123</code>) یا <code className="text-slate-200">user</code> (رمز: <code className="text-slate-200">user123</code>)
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono font-medium text-slate-300 block mb-1">
                      رمز عبور (Password)
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/30 border border-white/20 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/40"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-white/30 shadow-md cursor-pointer rgb-interactive-option"
                  >
                    <LogIn size={15} />
                    <span>ورود به سیستم</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-mono font-medium text-slate-300 block mb-1">
                        نام نمایشی (Display Name)
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="نام شما"
                        className="w-full px-3.5 py-2 rounded-xl bg-black/30 border border-white/20 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/40"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono font-medium text-slate-300 block mb-1">
                        نام کاربری (Username)
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="user_custom"
                        className="w-full px-3.5 py-2 rounded-xl bg-black/30 border border-white/20 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono font-medium text-slate-300 block mb-1">
                      ایمیل (Email)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/30 border border-white/20 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono font-medium text-slate-300 block mb-1">
                      رمز عبور (Password)
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/30 border border-white/20 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/40"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-white/30 shadow-md cursor-pointer rgb-interactive-option"
                  >
                    <UserPlus size={15} />
                    <span>ایجاد حساب و ورود</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
