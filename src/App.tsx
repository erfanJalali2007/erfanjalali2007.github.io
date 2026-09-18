import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { THEMES } from './data/themes';
import { GlassThemeId, PortfolioSection, AppearanceSettings } from './types';
import { LiquidCanvas } from './components/LiquidCanvas';
import { GlassCard } from './components/GlassCard';
import { AboutSection } from './components/AboutSection';
import { SkillsSection } from './components/SkillsSection';
import { ProjectsSection } from './components/ProjectsSection';
import { ExperienceSection } from './components/ExperienceSection';
import { ContactSection } from './components/ContactSection';
import { SettingsSection } from './components/SettingsSection';
import { GlassDock } from './components/GlassDock';
import { playGlassResonance } from './utils/audio';
import { Droplet, Clock } from 'lucide-react';

const DEFAULT_SETTINGS: AppearanceSettings = {
  themeId: 'ruby',
  blurLevel: 28,
  glassOpacity: 0.05,
  borderOpacity: 0.22,
  glowIntensity: 0.8,
  soundEnabled: true,
  reducedMotion: false,
};

export default function App() {
  const [currentSection, setCurrentSection] = useState<PortfolioSection>('home');
  const [settings, setSettings] = useState<AppearanceSettings>(DEFAULT_SETTINGS);
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [pointerPos, setPointerPos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [rippleTrigger, setRippleTrigger] = useState<{ x: number; y: number; timestamp: number } | null>(null);
  const [headerTime, setHeaderTime] = useState<string>('');

  const currentTheme = THEMES[settings.themeId] || THEMES.ruby;
  const isMuted = !settings.soundEnabled;

  // Real-time minimal clock for the header status pill
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setHeaderTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Track cursor coordinates smoothly
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      setPointerPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  // Global surface click to trigger liquid caustics
  const handleGlobalClick = useCallback((e: React.MouseEvent) => {
    // Only trigger if clicking directly on background
    if ((e.target as HTMLElement).id === 'liquid-root-container') {
      setRippleTrigger({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
      });
      playGlassResonance(480 + Math.random() * 120, isMuted);
    }
  }, [isMuted]);

  const triggerCardRipple = useCallback((x: number, y: number) => {
    setRippleTrigger({
      x,
      y,
      timestamp: Date.now(),
    });
  }, []);

  const triggerCenterRipple = useCallback(() => {
    setRippleTrigger({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      timestamp: Date.now(),
    });
  }, []);

  const handleSelectTheme = (id: GlassThemeId) => {
    setSettings((prev) => ({ ...prev, themeId: id }));
  };

  const handleUpdateSettings = (newSettings: Partial<AppearanceSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const handleToggleMute = () => {
    setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const renderSectionContent = () => {
    if (zenMode) {
      return (
        <div 
          onClick={triggerCenterRipple}
          className="cursor-pointer text-center p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl glass-specular-border max-w-sm mx-auto my-auto animate-fade-in"
        >
          <Droplet className={`w-8 h-8 ${currentTheme.accentClass.icon} mx-auto mb-3 animate-bounce`} />
          <p className="text-sm font-light text-slate-300">Zen Canvas Active</p>
          <p className="text-xs text-slate-500 mt-1">Click anywhere to generate fluid caustics</p>
        </div>
      );
    }

    switch (currentSection) {
      case 'about':
        return (
          <AboutSection
            key="about"
            theme={currentTheme}
            blurLevel={settings.blurLevel}
            isMuted={isMuted}
            onNavigate={setCurrentSection}
          />
        );
      case 'skills':
        return (
          <SkillsSection
            key="skills"
            theme={currentTheme}
            blurLevel={settings.blurLevel}
            isMuted={isMuted}
          />
        );
      case 'projects':
        return (
          <ProjectsSection
            key="projects"
            theme={currentTheme}
            blurLevel={settings.blurLevel}
            isMuted={isMuted}
          />
        );
      case 'experience':
        return (
          <ExperienceSection
            key="experience"
            theme={currentTheme}
            blurLevel={settings.blurLevel}
          />
        );
      case 'contact':
        return (
          <ContactSection
            key="contact"
            theme={currentTheme}
            blurLevel={settings.blurLevel}
            isMuted={isMuted}
          />
        );
      case 'settings':
        return (
          <SettingsSection
            key="settings"
            currentTheme={currentTheme}
            onSelectTheme={handleSelectTheme}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetDefaults={handleResetDefaults}
          />
        );
      case 'home':
      default:
        return (
          <GlassCard
            key="home"
            theme={currentTheme}
            pointerPos={pointerPos}
            onTriggerRipple={triggerCardRipple}
            blurLevel={settings.blurLevel}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onNavigate={setCurrentSection}
          />
        );
    }
  };

  return (
    <div
      id="liquid-root-container"
      onClick={handleGlobalClick}
      className={`relative min-h-screen w-full select-none overflow-x-hidden transition-colors duration-1000 ${currentTheme.backgroundClass} flex flex-col items-center`}
    >
      {/* Interactive Liquid Caustics & Chromatic Physics Canvas */}
      <LiquidCanvas
        theme={currentTheme}
        pointerPos={pointerPos}
        intensity={settings.glowIntensity}
        ripplesTrigger={rippleTrigger}
      />

      {/* Top Ambient Branding / Status Pill with Minimal Real-Time Clock */}
      <header className="fixed top-5 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
        <div 
          id="status-pill"
          className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-xl glass-pill-specular text-xs font-mono text-slate-300 shadow-xl"
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${currentTheme.accentClass.ping} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${currentTheme.accentClass.dot}`} />
          </span>
          <span className="font-semibold tracking-wider text-slate-200">LIQUID GLASS</span>
          <span className="text-white/20">•</span>
          <span className="text-slate-300 font-normal uppercase hidden sm:inline">{currentSection}</span>
          <span className="text-white/20 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <Clock size={11} className={currentTheme.accentClass.icon} />
            <span className={`font-mono font-medium tracking-wide ${currentTheme.accentClass.timeText}`}>
              {headerTime}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full z-10 pt-20 pb-28 min-h-screen flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {renderSectionContent()}
        </AnimatePresence>
      </main>

      {/* Bottom Floating Control Dock */}
      <GlassDock
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        blurLevel={settings.blurLevel}
        onChangeBlur={(level) => handleUpdateSettings({ blurLevel: level })}
        zenMode={zenMode}
        onToggleZen={() => setZenMode((prev) => !prev)}
        onTriggerRippleCenter={triggerCenterRipple}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />
    </div>
  );
}
