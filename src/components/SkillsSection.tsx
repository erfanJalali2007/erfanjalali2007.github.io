import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GlassTheme } from '../types';
import { usePortfolio } from '../context/PortfolioContext';
import { Cpu, Sparkles, Layers, Terminal, CheckCircle2, Edit2 } from 'lucide-react';
import { playGlassResonance } from '../utils/audio';
import { getSkillLevelInfo } from '../utils/skills';

interface SkillsSectionProps {
  theme: GlassTheme;
  blurLevel: number;
  isMuted: boolean;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  theme,
  blurLevel,
  isMuted,
}) => {
  const { skillsData, currentUser, setIsAdminEditorOpen, setAdminActiveTab } = usePortfolio();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu':
        return <Cpu size={16} className={theme.accentClass.icon} />;
      case 'Sparkles':
        return <Sparkles size={16} className={theme.accentClass.icon} />;
      case 'Layers':
        return <Layers size={16} className={theme.accentClass.icon} />;
      case 'Terminal':
      default:
        return <Terminal size={16} className={theme.accentClass.icon} />;
    }
  };

  const filteredCategories = activeCategory === 'all'
    ? skillsData
    : skillsData.filter((c) => c.id === activeCategory);

  return (
    <motion.div
      id="skills-section-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 w-full max-w-5xl mx-auto px-4 py-8"
    >
      {/* Top Header Card */}
      <div
        id="skills-header-card"
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
            background: `linear-gradient(90deg, transparent 0%, ${theme.cardStyles.highlight} 45%, rgba(${theme.pointerAura.highlightRgb}, 0.95) 50%, ${theme.cardStyles.highlight} 55%, transparent 100%)`,
          }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.accentClass.ping} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${theme.accentClass.dot}`} />
              </span>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-200">
                Technical Stack & Mastery
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white">Skills & Systems</h2>
            <p className="text-xs sm:text-sm text-slate-200 font-normal mt-1 max-w-xl">
              Production-tested proficiencies across game engines, graphic shaders, architecture patterns, and native tools.
            </p>
          </div>

          {/* Filter Pills & Admin Edit */}
          <div className="flex items-center flex-wrap gap-2">
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => {
                  setAdminActiveTab('skills');
                  setIsAdminEditorOpen(true);
                }}
                className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-xs font-semibold border border-amber-500/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="ویرایش مهارت‌ها و درصد تسلط"
              >
                <Edit2 size={13} />
                <span>ویرایش مهارت‌ها</span>
              </button>
            )}

            <div className="flex items-center flex-wrap gap-2 p-1.5 rounded-2xl bg-white/[0.06] border border-white/15">
              <button
                id="skill-filter-all"
                onClick={() => {
                  setActiveCategory('all');
                  playGlassResonance(520, isMuted);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all rgb-interactive-option ${
                  activeCategory === 'all'
                    ? 'bg-white/25 text-white border border-white/30 shadow-sm'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                All Skills
              </button>
              {skillsData.map((cat) => (
                <button
                  key={cat.id}
                  id={`skill-filter-${cat.id}`}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    playGlassResonance(560, isMuted);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap rgb-interactive-option ${
                    activeCategory === cat.id
                      ? 'bg-white/25 text-white border border-white/30 shadow-sm'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Skill Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            id={`skill-card-${category.id}`}
            style={{
              backdropFilter: `blur(${blurLevel}px) saturate(160%)`,
              WebkitBackdropFilter: `blur(${blurLevel}px) saturate(160%)`,
              backgroundColor: theme.cardStyles.background,
              borderColor: theme.cardStyles.border,
            }}
            className="rounded-3xl p-6 glass-specular-border relative overflow-hidden flex flex-col justify-between rgb-interactive-card"
          >
            <div>
              {/* Category Header */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
                    {getCategoryIcon(category.icon)}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">{category.name}</h3>
                    <p className="text-xs text-slate-300 font-normal">{category.description}</p>
                  </div>
                </div>
              </div>

              {/* Skill Bars */}
              <div className="space-y-3.5 mt-5">
                {category.skills.map((skill, sIdx) => {
                  const levelInfo = getSkillLevelInfo(skill.level);
                  const displayTag = skill.tag || levelInfo.tag;
                  return (
                    <div key={sIdx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-slate-100 font-medium flex items-center gap-1.5">
                          <CheckCircle2 size={14} className={theme.accentClass.icon} />
                          {skill.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-md font-mono font-medium border transition-colors ${levelInfo.badgeBg}`}
                            title={`${displayTag} (${levelInfo.persianLabel}) - ${skill.level}%`}
                          >
                            {displayTag}
                          </span>
                          <span className={`text-xs sm:text-sm font-mono font-semibold ${theme.accentClass.timeText}`}>
                            {skill.level}%
                          </span>
                        </div>
                      </div>

                    {/* Modern Refraction Progress Bar */}
                    <div className="h-2 w-full bg-white/[0.08] rounded-full overflow-hidden p-[1px] border border-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out relative"
                        style={{
                          width: `${skill.level}%`,
                          background: `linear-gradient(90deg, ${theme.cardStyles.border} 0%, ${theme.cardStyles.highlight} 100%)`,
                          boxShadow: `0 0 8px ${theme.liquidBlobs.ambient}`,
                        }}
                      >
                        <div className="absolute inset-0 bg-white/30 opacity-40 animate-pulse" />
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300 font-mono font-medium">
              <span>Domain: {category.skills.length} core stacks</span>
              <span className={theme.accentClass.timeText}>Active Production</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
