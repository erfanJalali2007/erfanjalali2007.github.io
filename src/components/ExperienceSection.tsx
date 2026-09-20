import React from 'react';
import { motion } from 'motion/react';
import { GlassTheme } from '../types';
import { usePortfolio } from '../context/PortfolioContext';
import { Briefcase, Calendar, CheckCircle2, Award, ArrowUpRight, Edit2 } from 'lucide-react';

interface ExperienceSectionProps {
  theme: GlassTheme;
  blurLevel: number;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  theme,
  blurLevel,
}) => {
  const { experiencesData, currentUser, setIsAdminEditorOpen, setAdminActiveTab } = usePortfolio();

  return (
    <motion.div
      id="experience-section-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 w-full max-w-4xl mx-auto px-4 py-8"
    >
      {/* Header Card */}
      <div
        id="experience-header-card"
        style={{
          backdropFilter: `blur(${blurLevel}px) saturate(160%)`,
          WebkitBackdropFilter: `blur(${blurLevel}px) saturate(160%)`,
          backgroundColor: theme.cardStyles.background,
          borderColor: theme.cardStyles.border,
        }}
        className="relative rounded-3xl p-6 sm:p-8 glass-specular-border overflow-hidden mb-6"
      >
        {/* Top Edge Refraction Line */}
        <div 
          className="absolute top-0 left-0 right-0 h-[1.5px] opacity-70 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${theme.cardStyles.highlight} 45%, rgba(255,255,255,0.9) 50%, ${theme.cardStyles.highlight} 55%, transparent 100%)`,
          }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.accentClass.ping} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.accentClass.dot}`} />
              </span>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-300/80">
                Career Timeline & History
              </span>
            </div>
            <h2 className="text-2xl font-light text-white">Experience & Background</h2>
            <p className="text-xs sm:text-sm text-slate-400 font-light mt-1">
              Professional game engineering, commercial shader production, and competitive game jams.
            </p>
          </div>

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => {
                setAdminActiveTab('experience');
                setIsAdminEditorOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-xs font-semibold border border-amber-500/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0 self-start sm:self-auto"
              title="ویرایش سوابق شغلی"
            >
              <Edit2 size={13} />
              <span>ویرایش سوابق</span>
            </button>
          )}
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-5">
        {experiencesData.map((exp, idx) => (
          <div
            key={exp.id}
            id={`experience-card-${exp.id}`}
            style={{
              backdropFilter: `blur(${blurLevel}px) saturate(160%)`,
              WebkitBackdropFilter: `blur(${blurLevel}px) saturate(160%)`,
              backgroundColor: theme.cardStyles.background,
              borderColor: theme.cardStyles.border,
            }}
            className="rounded-3xl p-6 sm:p-8 glass-specular-border relative overflow-hidden rgb-interactive-card"
          >
            {/* Top Refraction Accent */}
            <div 
              className="absolute top-0 left-0 right-0 h-[1px] opacity-35 pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${theme.cardStyles.highlight} 50%, transparent 100%)`,
              }}
            />

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono border border-white/10">
                    {exp.type}
                  </span>
                  <span className={`text-xs font-mono ${theme.accentClass.timeText}`}>
                    {exp.period}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-white">{exp.role}</h3>
                <p className="text-xs sm:text-sm text-slate-400 font-normal">{exp.organization}</p>
              </div>

              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 self-start">
                <Briefcase size={16} className={theme.accentClass.icon} />
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed mb-4">
              {exp.description}
            </p>

            {/* Achievements Bullet List */}
            <div className="space-y-2 mb-5">
              {exp.achievements.map((ach, aIdx) => (
                <div key={aIdx} className="flex items-start gap-2.5 text-xs text-slate-300/90 font-light">
                  <CheckCircle2 size={13} className={`${theme.accentClass.icon} shrink-0 mt-0.5`} />
                  <span>{ach}</span>
                </div>
              ))}
            </div>

            {/* Tech stack tags */}
            <div className="pt-4 border-t border-white/5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-500 mr-1">Stack:</span>
              {exp.technologies.map((t, tIdx) => (
                <span
                  key={tIdx}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 font-mono border border-white/5"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
