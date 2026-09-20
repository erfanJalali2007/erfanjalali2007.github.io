import React from 'react';
import { motion } from 'motion/react';
import { GlassTheme, PortfolioSection } from '../types';
import { usePortfolio } from '../context/PortfolioContext';
import { Gamepad2, Code2, Sparkles, Cpu, Award, ArrowRight, ExternalLink, Edit2 } from 'lucide-react';
import { playGlassResonance } from '../utils/audio';

interface AboutSectionProps {
  theme: GlassTheme;
  blurLevel: number;
  isMuted: boolean;
  onNavigate: (section: PortfolioSection) => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  theme,
  blurLevel,
  isMuted,
  onNavigate,
}) => {
  const { profileData, currentUser, setIsAdminEditorOpen, setAdminActiveTab } = usePortfolio();

  return (
    <motion.div
      id="about-section-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 w-full max-w-4xl mx-auto px-4 py-8"
    >
      {/* Main Profile About Card */}
      <div
        id="about-card"
        style={{
          backdropFilter: `blur(${blurLevel}px) saturate(160%)`,
          WebkitBackdropFilter: `blur(${blurLevel}px) saturate(160%)`,
          backgroundColor: theme.cardStyles.background,
          borderColor: theme.cardStyles.border,
        }}
        className="relative rounded-3xl p-6 sm:p-9 glass-specular-border overflow-hidden rgb-interactive-card"
      >
        {/* Top Edge Refraction Line */}
        <div 
          className="absolute top-0 left-0 right-0 h-[1.5px] opacity-70 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${theme.cardStyles.highlight} 45%, rgba(255,255,255,0.9) 50%, ${theme.cardStyles.highlight} 55%, transparent 100%)`,
          }}
        />

        {/* Section Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.accentClass.ping} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${theme.accentClass.dot}`} />
            </span>
            <span className="text-xs sm:text-sm tracking-wider uppercase font-semibold text-slate-200">
              Profile & Background
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => {
                  setAdminActiveTab('profile');
                  setIsAdminEditorOpen(true);
                }}
                className="px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-xs font-semibold border border-amber-500/40 flex items-center gap-1 transition-all cursor-pointer"
                title="ویرایش متون پروفایل"
              >
                <Edit2 size={12} />
                <span>ویرایش ادمین</span>
              </button>
            )}
            <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-slate-200 font-mono font-medium border border-white/20">
              {profileData.availability}
            </span>
          </div>
        </div>

        {/* Hero Profile Introduction */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mb-8">
          <div className="lg:col-span-8">
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white mb-2">
              Hi, I'm <span className="font-semibold text-white">{profileData.name}</span>
            </h1>
            <p className={`text-sm sm:text-base font-mono font-medium ${theme.accentClass.timeText} mb-4 tracking-wide`}>
              {profileData.title}
            </p>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal mb-4">
              {profileData.bio}
            </p>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              I believe great games reside at the intersection of mathematical precision and visceral kinetic feedback. Whether writing custom compute passes for fluid caustics, engineering zero-allocation ECS combat loops, or tuning character controllers down to the single-digit millisecond, I focus relentlessly on how games feel in the player's hands.
            </p>
          </div>

          {/* Quick Metrics Bento Glass Box */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            {profileData.stats.map((stat, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/15 backdrop-blur-md text-center rgb-interactive-option shadow-sm"
              >
                <div className={`text-xl sm:text-2xl font-semibold text-white font-mono ${theme.accentClass.timeText}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-slate-300 font-medium mt-1 leading-tight">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Engineering Principles Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-8">
          <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/15 backdrop-blur-sm rgb-interactive-option">
            <div className="flex items-center gap-2 mb-2">
              <Cpu size={18} className={theme.accentClass.icon} />
              <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-200">
                High Performance
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Deep expertise in memory locality, object pooling, and Unity DOTS/Job System to ensure smooth 60–120 FPS across target devices.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/15 backdrop-blur-sm rgb-interactive-option">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className={theme.accentClass.icon} />
              <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-200">
                Shader Craftsmanship
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Crafting custom HLSL shaders, realistic surface shaders, atmospheric lighting, and VFX Graph particle systems tailored for URP and HDRP.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/15 backdrop-blur-sm rgb-interactive-option">
            <div className="flex items-center gap-2 mb-2">
              <Gamepad2 size={18} className={theme.accentClass.icon} />
              <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-200">
                Visceral Game Feel
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Tuning camera impulses, animation hit-stops, procedural juice, and spatial audio to make every interaction satisfying and punchy.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              id="about-btn-projects"
              onClick={() => {
                onNavigate('projects');
                playGlassResonance(560, isMuted);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border border-white/30 rgb-interactive-option shadow-sm"
            >
              <span>Explore Projects</span>
              <ArrowRight size={14} />
            </button>

            <button
              id="about-btn-skills"
              onClick={() => {
                onNavigate('skills');
                playGlassResonance(520, isMuted);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 hover:text-white text-xs sm:text-sm font-semibold transition-all border border-white/20 rgb-interactive-option"
            >
              <span>View Skills & Stack</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`mailto:${profileData.email}`}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs sm:text-sm font-mono font-medium transition-colors border border-white/15 flex items-center gap-2 rgb-interactive-option"
            >
              <span>{profileData.email}</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
