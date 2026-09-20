import React from 'react';
import { motion } from 'motion/react';
import { GlassTheme, GlassThemeId, AppearanceSettings } from '../types';
import { THEMES } from '../data/themes';
import { Sliders, Volume2, VolumeX, RotateCcw, Sparkles, Droplets, Eye, Activity } from 'lucide-react';
import { playGlassResonance } from '../utils/audio';

interface SettingsSectionProps {
  currentTheme: GlassTheme;
  onSelectTheme: (id: GlassThemeId) => void;
  settings: AppearanceSettings;
  onUpdateSettings: (newSettings: Partial<AppearanceSettings>) => void;
  onResetDefaults: () => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  currentTheme,
  onSelectTheme,
  settings,
  onUpdateSettings,
  onResetDefaults,
}) => {
  return (
    <motion.div
      id="settings-section-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 w-full max-w-4xl mx-auto px-4 py-8"
    >
      {/* Settings Glass Container */}
      <div
        id="settings-card"
        style={{
          backdropFilter: `blur(${settings.blurLevel}px) saturate(160%)`,
          WebkitBackdropFilter: `blur(${settings.blurLevel}px) saturate(160%)`,
          backgroundColor: currentTheme.cardStyles.background,
          borderColor: currentTheme.cardStyles.border,
        }}
        className="relative rounded-3xl p-6 sm:p-9 glass-specular-border overflow-hidden rgb-interactive-card"
      >
        {/* Top Edge Refraction Line */}
        <div 
          className="absolute top-0 left-0 right-0 h-[1.5px] opacity-70 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${currentTheme.cardStyles.highlight} 45%, rgba(255,255,255,0.9) 50%, ${currentTheme.cardStyles.highlight} 55%, transparent 100%)`,
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${currentTheme.accentClass.ping} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${currentTheme.accentClass.dot}`} />
              </span>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-300/80">
                Theme &amp; Visual Preferences
              </span>
            </div>
            <h2 className="text-2xl font-light text-white">Appearance &amp; Theme Settings</h2>
            <p className="text-xs sm:text-sm text-slate-400 font-light mt-1">
              Customize website color themes, background blur depth, ambient lighting, and sound effects.
            </p>
          </div>

          <button
            id="btn-reset-settings"
            onClick={() => {
              onResetDefaults();
              playGlassResonance(440, !settings.soundEnabled);
            }}
            title="Reset all settings to default values"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors border border-white/10 flex items-center gap-1.5 text-xs font-mono"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Defaults</span>
          </button>
        </div>

        {/* Section 1: Color Theme Palettes */}
        <div className="mb-7 pb-6 border-b border-white/10">
          <label className="text-xs uppercase tracking-wider font-mono text-slate-300 block mb-3">
            1. Website Color Theme
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {Object.values(THEMES).map((theme) => {
              const isSelected = currentTheme.id === theme.id;
              return (
                <button
                  key={theme.id}
                  id={`theme-select-${theme.id}`}
                  onClick={() => {
                    onSelectTheme(theme.id);
                    playGlassResonance(520 + Math.random() * 100, !settings.soundEnabled);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-24 rgb-interactive-option ${
                    isSelected
                      ? 'bg-white/15 border-white/30 shadow-lg scale-[1.02]'
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="relative flex h-2 w-2">
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.accentClass.dot}`} />
                    </span>
                    <span className="text-[9px] font-mono uppercase text-slate-400">
                      {theme.badge}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-white truncate">
                      {theme.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-slate-400 font-light truncate">
                      {theme.name.split(' ').slice(1).join(' ') || 'Theme'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Backdrop Blur & Ambient Lighting */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-7 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider font-mono text-slate-300 flex items-center gap-1.5">
                <Sliders size={13} className={currentTheme.accentClass.icon} />
                <span>Background Blur Depth</span>
              </label>
              <span className={`text-xs font-mono ${currentTheme.accentClass.timeText}`}>
                {settings.blurLevel}px
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Controls the backdrop blur intensity across cards, modals, and navigation dock.
            </p>
            <div className="flex items-center gap-2">
              {[16, 28, 44].map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    onUpdateSettings({ blurLevel: b });
                    playGlassResonance(500 + b * 5, !settings.soundEnabled);
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                    settings.blurLevel === b
                      ? 'bg-white/20 text-white border-white/30 font-medium'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {b === 16 ? 'Subtle (16px)' : b === 28 ? 'Balanced (28px)' : 'Deep (44px)'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider font-mono text-slate-300 flex items-center gap-1.5">
                <Droplets size={13} className={currentTheme.accentClass.icon} />
                <span>Ambient Glow Intensity</span>
              </label>
              <span className={`text-xs font-mono ${currentTheme.accentClass.timeText}`}>
                {Math.round(settings.glowIntensity * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Modulates the radiant brightness of background gradient glows and interactive ripples.
            </p>
            <input
              type="range"
              min="0.3"
              max="1.0"
              step="0.05"
              value={settings.glowIntensity}
              onChange={(e) => onUpdateSettings({ glowIntensity: parseFloat(e.target.value) })}
              className="w-full accent-white cursor-pointer bg-white/10 h-1.5 rounded-full"
            />
          </div>
        </div>

        {/* Section 3: Audio & Interaction Dynamics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sound toggle */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                {settings.soundEnabled ? (
                  <Volume2 size={16} className={currentTheme.accentClass.icon} />
                ) : (
                  <VolumeX size={16} className="text-slate-500" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-medium text-white">Audio Feedback</h4>
                <p className="text-[11px] text-slate-400 font-light">
                  Interactive audio feedback on UI actions
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const next = !settings.soundEnabled;
                onUpdateSettings({ soundEnabled: next });
                playGlassResonance(600, !next);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-all border ${
                settings.soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-white/5 text-slate-400 border-white/10'
              }`}
            >
              {settings.soundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>

          {/* Reduced Motion Toggle */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <Activity size={16} className={currentTheme.accentClass.icon} />
              </div>
              <div>
                <h4 className="text-xs font-medium text-white">Motion &amp; Animations</h4>
                <p className="text-[11px] text-slate-400 font-light">
                  Smooth 3D tilt &amp; card transitions
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onUpdateSettings({ reducedMotion: !settings.reducedMotion });
                playGlassResonance(540, !settings.soundEnabled);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-all border ${
                !settings.reducedMotion
                  ? 'bg-white/20 text-white border-white/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              {!settings.reducedMotion ? 'Full Motion' : 'Reduced'}
            </button>
          </div>
        </div>

        {/* Section 4: Deployment & Architecture Telemetry */}
        <div className="mt-7 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-mono text-slate-300">
              Website Architecture &amp; Infrastructure
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Production Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 rgb-interactive-option">
              <div className="text-[10px] font-mono text-slate-400 mb-1">Frontend Hosting</div>
              <div className="font-medium text-white truncate">GitHub Pages</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                erfanjalali2007.github.io
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 rgb-interactive-option">
              <div className="text-[10px] font-mono text-slate-400 mb-1">Backend API Layer</div>
              <div className="font-medium text-white truncate">Cloudflare Worker</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                worker/src/index.ts
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 rgb-interactive-option">
              <div className="text-[10px] font-mono text-slate-400 mb-1">Security Model</div>
              <div className="font-medium text-white truncate">Zero Secret Exposure</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                Server-side tokens only
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
