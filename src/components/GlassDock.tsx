import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { THEMES } from '../data/themes';
import { GlassTheme, GlassThemeId, PortfolioSection } from '../types';
import { 
  Home, 
  User, 
  Cpu, 
  Gamepad2, 
  Briefcase, 
  Mail, 
  Sliders, 
  Droplet, 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX 
} from 'lucide-react';
import { playGlassResonance } from '../utils/audio';

interface GlassDockProps {
  currentSection: PortfolioSection;
  onSelectSection: (section: PortfolioSection) => void;
  currentTheme: GlassTheme;
  onSelectTheme: (id: GlassThemeId) => void;
  blurLevel: number;
  onChangeBlur: (level: number) => void;
  zenMode: boolean;
  onToggleZen: () => void;
  onTriggerRippleCenter: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isHidden?: boolean;
}

export const GlassDock: React.FC<GlassDockProps> = ({
  currentSection,
  onSelectSection,
  currentTheme,
  onSelectTheme,
  blurLevel,
  onChangeBlur,
  zenMode,
  onToggleZen,
  onTriggerRippleCenter,
  isMuted,
  onToggleMute,
  isHidden = false,
}) => {
  const sections: { id: PortfolioSection; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home size={16} /> },
    { id: 'about', label: 'About', icon: <User size={16} /> },
    { id: 'skills', label: 'Skills', icon: <Cpu size={16} /> },
    { id: 'projects', label: 'Projects', icon: <Gamepad2 size={16} /> },
    { id: 'experience', label: 'Timeline', icon: <Briefcase size={16} /> },
    { id: 'contact', label: 'Contact', icon: <Mail size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Sliders size={16} /> },
  ];

  return (
    <nav 
      id="main-navigation-dock"
      aria-label="Portfolio Navigation Dock"
      className="fixed bottom-5 inset-x-0 z-40 flex justify-center px-3 pointer-events-none"
    >
      <AnimatePresence mode="wait">
        {!isHidden && (
          <motion.div
            id="glass-dock"
            key="glass-dock-active"
            initial={{
              opacity: 0,
              y: 90,
              scale: 0.12,
              borderRadius: '9999px',
              maxWidth: '44px',
              paddingLeft: '12px',
              paddingRight: '12px',
              filter: 'blur(12px)',
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              borderRadius: '1rem',
              maxWidth: '1200px',
              paddingLeft: '8px',
              paddingRight: '8px',
              filter: 'blur(0px)',
              transition: {
                duration: 1.0,
                ease: [0.16, 1, 0.3, 1],
                maxWidth: { duration: 0.95, ease: [0.16, 1, 0.3, 1] },
                borderRadius: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                scale: { duration: 0.9, ease: [0.34, 1.3, 0.64, 1] },
                y: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.5 },
              },
            }}
            exit={{
              // Step 1: Smoothly squeeze in from wide dock into a compact circular bullet/orb
              // Step 2: Slightly recoil upwards like a physical marble
              // Step 3: Plunge downwards smoothly off the viewport
              opacity: [1, 1, 0.95, 0],
              maxWidth: ['750px', '220px', '52px', '40px'],
              borderRadius: ['1rem', '2rem', '9999px', '9999px'],
              scale: [1, 0.88, 0.45, 0.08],
              y: [0, -4, 25, 140],
              filter: ['blur(0px)', 'blur(0px)', 'blur(2px)', 'blur(10px)'],
              transition: {
                duration: 1.15,
                ease: [0.25, 1, 0.35, 1],
                times: [0, 0.42, 0.72, 1],
              },
            }}
            style={{
              backdropFilter: `blur(${blurLevel}px) saturate(160%)`,
              WebkitBackdropFilter: `blur(${blurLevel}px) saturate(160%)`,
            }}
            className="pointer-events-auto flex items-center gap-2 p-2 rounded-2xl bg-white/[0.08] border border-white/20 glass-pill-specular shadow-2xl max-w-[96vw] sm:max-w-none overflow-x-auto scrollbar-none"
          >
            {/* Navigation Section Buttons */}
            <div className="flex items-center gap-1.5 pr-2 border-r border-white/15">
              {sections.map((sec) => {
                const isActive = !zenMode && currentSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    id={`dock-nav-${sec.id}`}
                    onClick={() => {
                      if (zenMode) onToggleZen();
                      onSelectSection(sec.id);
                      playGlassResonance(520 + Math.random() * 80, isMuted);
                    }}
                    title={sec.label}
                    className={`relative px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap rgb-interactive-option ${
                      isActive
                        ? `bg-white/25 text-white shadow-md border border-white/30 ${currentTheme.accentClass.timeText}`
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className={isActive ? currentTheme.accentClass.icon : ''}>
                      {sec.icon}
                    </span>
                    <span className="hidden sm:inline font-medium">{sec.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Theme Cycle Switcher */}
            <div className="flex items-center gap-1.5 px-1.5 border-r border-white/15">
              {Object.values(THEMES).map((theme) => {
                const isSelected = currentTheme.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    id={`dock-theme-${theme.id}`}
                    onClick={() => {
                      onSelectTheme(theme.id);
                      playGlassResonance(600, isMuted);
                    }}
                    title={`Theme: ${theme.name}`}
                    className={`relative w-7 h-7 rounded-full transition-all duration-200 flex items-center justify-center rgb-interactive-option ${
                      isSelected
                        ? 'ring-2 ring-white/80 scale-110'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <span
                      className="w-4.5 h-4.5 rounded-full border border-white/40 shadow-inner"
                      style={{ backgroundColor: theme.cardStyles.highlight }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Action Controls: Ripple, Audio, Zen */}
            <div className="flex items-center gap-1.5 pl-1">
              {/* Ripple Trigger */}
              <button
                id="btn-trigger-caustic"
                onClick={() => {
                  onTriggerRippleCenter();
                  playGlassResonance(700, isMuted);
                }}
                title="Interactive background ripple"
                className="p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/15 transition-colors border border-transparent hover:border-white/15 flex items-center gap-1.5 text-xs sm:text-sm font-medium rgb-interactive-option"
              >
                <Droplet size={16} className={currentTheme.accentClass.icon} />
                <span className="hidden lg:inline font-medium">Ripple</span>
              </button>

              {/* Sound Toggle */}
              <button
                id="btn-dock-mute"
                onClick={() => {
                  onToggleMute();
                  playGlassResonance(620, !isMuted);
                }}
                title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
                className="p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/15 transition-colors border border-transparent hover:border-white/15 rgb-interactive-option"
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              {/* Zen View Toggle */}
              <button
                id="btn-toggle-zen"
                onClick={() => {
                  onToggleZen();
                  playGlassResonance(480, isMuted);
                }}
                title={zenMode ? 'Exit Zen Mode' : 'Zen Minimal View'}
                className={`p-2 rounded-xl transition-colors border rgb-interactive-option ${
                  zenMode
                    ? 'bg-white/25 text-white border-white/40'
                    : 'text-slate-200 hover:text-white hover:bg-white/15 border-transparent hover:border-white/15'
                }`}
              >
                {zenMode ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
