import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowRight,
  Gamepad2,
  Code2,
  Edit2,
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  Layers,
  Cpu,
  ChevronRight,
} from 'lucide-react';
import { GlassTheme, PortfolioSection } from '../types';
import { playGlassResonance } from '../utils/audio';
import { usePortfolio } from '../context/PortfolioContext';

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
  const {
    profileData,
    projectsData,
    skillsData,
    contactData,
    currentUser,
    setIsAdminEditorOpen,
    setAdminActiveTab,
  } = usePortfolio();

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

    // Subtle gentle 3D tilt for desktop horizontal card
    const rotateY = Math.max(-4, Math.min(4, deltaX * 4));
    const rotateX = Math.max(-4, Math.min(4, -deltaY * 4));

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

  const topProjects = projectsData.slice(0, 2);
  const featuredSkills = skillsData
    .flatMap((c) => c.skills)
    .slice(0, 4);

  return (
    <motion.div
      id="glass-card-wrapper"
      initial={{ opacity: 0, scale: 0.97, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -14 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 w-full max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6"
      style={{ perspective: 1400 }}
    >
      {/* Horizontal Landscape Desktop Card Container */}
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
        className="relative rounded-3xl p-6 sm:p-8 lg:p-9 transition-transform duration-150 ease-out cursor-pointer glass-specular-border overflow-hidden select-none group rgb-interactive-card shadow-2xl"
      >
        {/* Dynamic Optical Glare & Specular Reflection Layer matching Theme Palette */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity duration-500 mix-blend-screen"
          style={{
            background: `radial-gradient(circle 520px at ${tilt.glareX}% ${tilt.glareY}%, rgba(${theme.pointerAura.primaryRgb}, 0.5) 0%, rgba(${theme.pointerAura.secondaryRgb}, 0.22) 36%, rgba(${theme.pointerAura.highlightRgb}, 0.05) 60%, transparent 75%)`,
          }}
        />

        {/* Prismatic Top Edge Refraction Line */}
        <div
          className="absolute top-0 left-0 right-0 h-[1.5px] opacity-70 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${theme.cardStyles.highlight} 40%, rgba(255,255,255,0.9) 50%, ${theme.cardStyles.highlight} 60%, transparent 100%)`,
            transform: `translateX(${(tilt.glareX - 50) * 0.4}%)`,
            transition: 'transform 0.1s ease-out',
          }}
        />

        {/* Top Header: Indicators & Desktop Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.accentClass.ping} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${theme.accentClass.dot}`} />
            </span>
            <span className="text-xs sm:text-sm tracking-wider font-semibold text-slate-200">
              Available for Projects &amp; Studios
            </span>
            <span className="hidden sm:inline-flex text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono font-medium border border-white/15">
              Unity 6 LTS / C#
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 font-mono font-medium border border-white/20">
              {theme.badge}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentUser?.role === 'admin' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAdminActiveTab('profile');
                  setIsAdminEditorOpen(true);
                  playGlassResonance(600, isMuted);
                }}
                title="ویرایش اطلاعات هدر و پروفایل"
                className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Edit2 size={12} />
                <span>ویرایش اطلاعات</span>
              </button>
            )}

            <button
              id="btn-toggle-sound"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
                playGlassResonance(620, !isMuted);
              }}
              title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors border border-white/15 cursor-pointer"
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <span className="font-mono text-xs sm:text-sm text-slate-200 font-medium tracking-tight bg-white/[0.06] px-3 py-1 rounded-xl border border-white/10">
              {currentTime}
            </span>
          </div>
        </div>

        {/* Main Landscape Split Grid (Desktop Horizontal Rectangle) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch my-6">
          {/* Left Column: Developer Identity, Bio & Primary CTAs */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/10 border border-white/20 shadow-inner">
                  <Gamepad2 className={`w-7 h-7 ${theme.accentClass.icon}`} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white">
                    {profileData.name}
                  </h1>
                  <p className={`text-xs sm:text-sm font-mono font-medium ${theme.accentClass.timeText} tracking-wide`}>
                    {profileData.title}
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                {profileData.tagline}
              </p>

              {/* Quick Social / Contact Links */}
              <div className="flex flex-wrap items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                {contactData.socials?.map((soc, idx) => (
                  <a
                    key={`glass-soc-${soc.id || idx}-${idx}`}
                    href={soc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/15 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 border border-white/10 transition-colors"
                  >
                    {soc.icon === 'Github' && <Github size={13} />}
                    {soc.icon === 'Linkedin' && <Linkedin size={13} />}
                    {soc.icon === 'Mail' && <Mail size={13} />}
                    {soc.icon === 'Gamepad2' && <Gamepad2 size={13} />}
                    <span>{soc.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Desktop Call to Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
              <button
                id="hero-btn-explore-projects"
                onClick={() => {
                  onNavigate('projects');
                  playGlassResonance(580, isMuted);
                }}
                className="px-5 py-2.5 rounded-xl bg-white/25 hover:bg-white/35 text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border border-white/30 shadow-lg rgb-interactive-option cursor-pointer"
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
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 hover:text-white text-xs sm:text-sm font-semibold transition-all border border-white/20 rgb-interactive-option cursor-pointer flex items-center gap-2"
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
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 hover:text-white text-xs sm:text-sm font-semibold transition-all border border-white/20 rgb-interactive-option cursor-pointer flex items-center gap-1.5"
              >
                <Mail size={15} />
                <span>Contact</span>
              </button>
            </div>
          </div>

          {/* Right Column: Desktop Metrics, Interactive Feature Bento & Scratchpad */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            {/* Row 1: Key Developer Metrics */}
            <div className="grid grid-cols-3 gap-3">
              {profileData.stats.slice(0, 3).map((stat, idx) => (
                <div
                  key={idx}
                  className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.05] border border-white/15 text-center rgb-interactive-option shadow-sm transition-all hover:bg-white/[0.08]"
                >
                  <div className={`text-xl sm:text-2xl font-semibold text-white font-mono ${theme.accentClass.timeText}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs font-medium text-slate-300 mt-0.5 truncate">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Row 2: Desktop Quick-Access Bento Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" onClick={(e) => e.stopPropagation()}>
              {/* Feature Tile 1: Featured Systems & Projects */}
              <div
                onClick={() => {
                  onNavigate('projects');
                  playGlassResonance(550, isMuted);
                }}
                className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 transition-all cursor-pointer group/tile flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 text-xs font-semibold text-white">
                      <Layers size={15} className={theme.accentClass.icon} />
                      <span>Featured Projects</span>
                    </span>
                    <ChevronRight size={14} className="text-slate-400 group-hover/tile:text-white group-hover/tile:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">
                    {topProjects[0]?.title || 'Chronos: Time Fracture'} &amp; {topProjects[1]?.title || 'Shader Suite'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-slate-300 font-mono">
                    {projectsData.length} Total Titles
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    URP • HLSL • C#
                  </span>
                </div>
              </div>

              {/* Feature Tile 2: Core Engineering Capabilities */}
              <div
                onClick={() => {
                  onNavigate('skills');
                  playGlassResonance(520, isMuted);
                }}
                className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 transition-all cursor-pointer group/tile flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 text-xs font-semibold text-white">
                      <Cpu size={15} className={theme.accentClass.icon} />
                      <span>Core Engine Tech</span>
                    </span>
                    <ChevronRight size={14} className="text-slate-400 group-hover/tile:text-white group-hover/tile:translate-x-0.5 transition-all" />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {featuredSkills.map((sk, sIdx) => (
                      <span key={sIdx} className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                        {sk.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-3 text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <span>Explore full stack breakdown</span>
                  <span>→</span>
                </div>
              </div>
            </div>

            {/* Row 3: Horizontal Developer Scratchpad */}
            <div
              id="thought-slate-container"
              onClick={(e) => e.stopPropagation()}
              className="relative rounded-2xl bg-black/30 p-3.5 border border-white/15 backdrop-blur-sm transition-all focus-within:border-white/35 focus-within:bg-black/40"
            >
              <textarea
                id="thought-input"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Interactive scratchpad: type notes, review systems, or click background to trigger caustics..."
                rows={2}
                className="w-full bg-transparent resize-none text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none font-normal leading-relaxed tracking-wide"
              />

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs font-mono text-slate-300">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Sparkles size={12} className={theme.accentClass.icon} />
                  {noteText.length > 0 ? `${noteText.length} characters` : 'Interactive Canvas Scratchpad'}
                </span>

                {noteText.length > 0 && (
                  <button
                    id="btn-clear-slate"
                    onClick={handleClearNote}
                    className="flex items-center gap-1 text-slate-200 hover:text-white transition-colors px-2 py-0.5 rounded-md hover:bg-white/15 border border-white/10 text-[11px] cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Architecture Specs & Interaction Hint */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 font-mono font-medium">
          <div className="flex items-center gap-2.5">
            <span>Specialization: Gameplay Systems &amp; Real-Time Graphics</span>
            <span className="text-white/25 hidden sm:inline">•</span>
            <span className="hidden sm:inline">Engine: Unity (URP / HDRP)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-[11px]">
            <span>Click any background area to trigger fluid caustics</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
