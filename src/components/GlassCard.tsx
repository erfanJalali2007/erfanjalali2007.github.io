import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Droplets, RotateCcw, Volume2, VolumeX, ArrowRight, Gamepad2, Code2 } from 'lucide-react';
import { GlassTheme, PortfolioSection } from '../types';
import { playGlassResonance } from '../utils/audio';
import { PROFILE_DATA } from '../data/portfolioData';

interface GlassCardProps {
  theme: GlassTheme;
  pointerPos: { x: number; y: number };
  onTriggerRipple: (x: number, y: number) => void;
  blurLevel: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onNavigate: (section: PortfolioSection) => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  theme,
  pointerPos,
  onTriggerRipple,
  blurLevel,
  isMuted,
  onToggleMute,
  onNavigate,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [noteText, setNoteText] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // Update real-time minimal clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute optical tilt and specular angle
  useEffect(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (pointerPos.x - centerX) / (window.innerWidth / 2);
    const deltaY = (pointerPos.y - centerY) / (window.innerHeight / 2);

    // Limit maximum rotation to gentle, realistic 5 degrees
    const rotateY = Math.max(-5, Math.min(5, deltaX * 5));
    const rotateX = Math.max(-5, Math.min(5, -deltaY * 5));

    // Glare position in percent
    const glareX = ((pointerPos.x - rect.left) / rect.width) * 100;
    const glareY = ((pointerPos.y - rect.top) / rect.height) * 100;

    setTilt({
      rotateX,
      rotateY,
      glareX: Math.max(0, Math.min(100, glareX)),
      glareY: Math.max(0, Math.min(100, glareY)),
    });
  }, [pointerPos]);

  const handleCardClick = (e: React.MouseEvent) => {
    onTriggerRipple(e.clientX, e.clientY);
    playGlassResonance(580 + Math.random() * 80, isMuted);
  };

  const handleClearNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNoteText('');
    playGlassResonance(440, isMuted);
  };

  return (
    <motion.div
      id="glass-card-wrapper"
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -16 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 w-full max-w-2xl mx-auto px-4"
      style={{ perspective: 1200 }}
    >
      {/* Outer Floating Glass Sconce / Halo */}
      <div
        ref={cardRef}
        id="glass-main-card"
        onClick={handleCardClick}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateZ(0)`,
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          WebkitFontSmoothing: 'antialiased',
          backdropFilter: `blur(${blurLevel}px) saturate(160%)`,
          WebkitBackdropFilter: `blur(${blurLevel}px) saturate(160%)`,
          backgroundColor: theme.cardStyles.background,
          borderColor: theme.cardStyles.border,
        }}
        className="relative rounded-3xl p-7 md:p-9 transition-transform duration-150 ease-out cursor-pointer glass-specular-border overflow-hidden select-none group rgb-interactive-card"
      >
        {/* Dynamic Optical Glare & Specular Reflection Layer */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-65 transition-opacity duration-500 mix-blend-overlay"
          style={{
            background: `radial-gradient(circle 380px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.1) 45%, transparent 70%)`,
          }}
        />

        {/* Prismatic Top Edge Refraction Line */}
        <div 
          className="absolute top-0 left-0 right-0 h-[1.5px] opacity-70 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${theme.cardStyles.highlight} 45%, rgba(255,255,255,0.9) 50%, ${theme.cardStyles.highlight} 55%, transparent 100%)`,
            transform: `translateX(${(tilt.glareX - 50) * 0.5}%)`,
            transition: 'transform 0.1s ease-out',
          }}
        />

        {/* Header: Minimal State Indicators */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.accentClass.ping} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${theme.accentClass.dot}`} />
            </span>
            <span className="text-xs sm:text-sm tracking-wider uppercase font-semibold text-slate-200">
              Liquid Vessel
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 font-mono font-medium border border-white/20">
              {theme.badge}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="btn-toggle-sound"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
                playGlassResonance(620, !isMuted);
              }}
              title={isMuted ? 'Unmute glass resonance' : 'Mute glass resonance'}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors border border-white/15"
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <span className="font-mono text-xs sm:text-sm text-slate-200 font-medium tracking-tight">
              {currentTime}
            </span>
          </div>
        </div>

        {/* Center: Developer Hero Introduction */}
        <div className="my-6 text-center">
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-white/10 border border-white/20 mb-3.5 shadow-inner">
            <Droplets className={`w-7 h-7 ${theme.accentClass.icon} animate-pulse`} />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white mb-2">
            {PROFILE_DATA.name}
          </h1>
          <p className={`text-xs sm:text-sm font-mono font-medium ${theme.accentClass.timeText} mb-3 tracking-wide`}>
            {PROFILE_DATA.title}
          </p>
          <p className="text-xs sm:text-sm text-slate-200 max-w-lg mx-auto font-normal leading-relaxed">
            {PROFILE_DATA.tagline}
          </p>
        </div>

        {/* Quick Developer Metrics */}
        <div className="grid grid-cols-3 gap-3 my-6">
          {PROFILE_DATA.stats.slice(0, 3).map((stat, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-white/[0.05] border border-white/15 text-center rgb-interactive-option shadow-sm"
            >
              <div className={`text-lg sm:text-xl font-semibold text-white font-mono ${theme.accentClass.timeText}`}>
                {stat.value}
              </div>
              <div className="text-xs font-medium text-slate-300 mt-0.5 truncate">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 my-6" onClick={(e) => e.stopPropagation()}>
          <button
            id="hero-btn-explore-projects"
            onClick={() => {
              onNavigate('projects');
              playGlassResonance(580, isMuted);
            }}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border border-white/30 shadow-md rgb-interactive-option"
          >
            <Gamepad2 size={16} className={theme.accentClass.icon} />
            <span>Explore Projects</span>
            <ArrowRight size={14} />
          </button>

          <button
            id="hero-btn-view-skills"
            onClick={() => {
              onNavigate('skills');
              playGlassResonance(520, isMuted);
            }}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 hover:text-white text-xs sm:text-sm font-semibold transition-all border border-white/20 rgb-interactive-option"
          >
            <Code2 size={16} />
            <span>Tech Stack</span>
          </button>

          <button
            id="hero-btn-contact"
            onClick={() => {
              onNavigate('contact');
              playGlassResonance(620, isMuted);
            }}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 hover:text-white text-xs sm:text-sm font-semibold transition-all border border-white/20 rgb-interactive-option"
          >
            <span>Get in Touch</span>
          </button>
        </div>

        {/* Minimal Thought Slate / Developer Scratchpad */}
        <div
          id="thought-slate-container"
          onClick={(e) => e.stopPropagation()}
          className="relative mt-6 rounded-2xl bg-black/25 p-4 border border-white/15 backdrop-blur-sm transition-all focus-within:border-white/35 focus-within:bg-black/35"
        >
          <textarea
            id="thought-input"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Interactive scratchpad: test gameplay ideas, type notes, or send ripples..."
            rows={2}
            className="w-full bg-transparent resize-none text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none font-normal leading-relaxed tracking-wide"
          />

          <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/10 text-xs font-mono text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className={theme.accentClass.icon} />
              {noteText.length > 0 ? `${noteText.length} chars` : 'Interactive Slate'}
            </span>

            {noteText.length > 0 && (
              <button
                id="btn-clear-slate"
                onClick={handleClearNote}
                className="flex items-center gap-1 text-slate-200 hover:text-white transition-colors px-2.5 py-0.5 rounded-md hover:bg-white/15 border border-white/10"
              >
                <RotateCcw size={12} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Footer: Physical Optics Specifications */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 font-mono font-medium">
          <div className="flex items-center gap-2.5">
            <span>IOR: 1.52 (Silica)</span>
            <span className="text-white/30">•</span>
            <span>Blur: {blurLevel}px</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-200">
            <span>Unity 2022/6 LTS</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

