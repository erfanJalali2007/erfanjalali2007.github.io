import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GlassTheme, Project } from '../types';
import { usePortfolio } from '../context/PortfolioContext';
import { ProjectDetailsModal } from './ProjectDetailsModal';
import { Gamepad2, Sparkles, Cpu, ExternalLink, Github, ArrowUpRight, Edit2, Plus, Youtube, Images, Calendar, Clock } from 'lucide-react';
import { playGlassResonance } from '../utils/audio';
import { isRealImageSource } from '../utils/imageSource';

interface ProjectsSectionProps {
  theme: GlassTheme;
  blurLevel: number;
  isMuted: boolean;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  theme,
  blurLevel,
  isMuted,
}) => {
  const { 
    projectsData, 
    currentUser, 
    setIsAdminEditorOpen, 
    setAdminActiveTab,
    activeProjectModal,
    setActiveProjectModal,
  } = usePortfolio();
  const [filter, setFilter] = useState<'all' | 'unity' | 'graphics' | 'systems' | 'other'>('all');

  const filteredProjects = filter === 'all'
    ? projectsData
    : projectsData.filter((p) => p.category === filter);

  const handleSelectProject = (project: Project) => {
    setActiveProjectModal(project);
    playGlassResonance(640, isMuted);
  };

  return (
    <motion.div
      id="projects-section-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8"
    >
      {/* Header Card */}
      <div
        id="projects-header-card"
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
                Selected Works
              </span>
            </div>
            <h2 className="text-2xl font-light text-white">Games & Graphics Engineering</h2>
            <p className="text-xs sm:text-sm text-slate-400 font-light mt-1">
              Unity titles, custom HLSL shaders, DOTS multi-threaded frameworks, and VR prototypes.
            </p>
          </div>

          {/* Filter pills & Admin trigger */}
          <div className="flex items-center flex-wrap gap-2">
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => {
                  setAdminActiveTab('projects');
                  setIsAdminEditorOpen(true);
                }}
                className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-xs font-semibold border border-amber-500/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="مدیریت و افزودن پروژه‌ها"
              >
                <Plus size={14} />
                <span>مدیریت پروژه‌ها</span>
              </button>
            )}

            <div className="flex items-center flex-wrap gap-2 p-1.5 rounded-2xl bg-white/[0.06] border border-white/15">
              <button
                id="project-filter-all"
                onClick={() => {
                  setFilter('all');
                  playGlassResonance(520, isMuted);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all rgb-interactive-option ${
                  filter === 'all'
                    ? 'bg-white/25 text-white border border-white/30 shadow-sm'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                All ({projectsData.length})
              </button>
            <button
              id="project-filter-unity"
              onClick={() => {
                setFilter('unity');
                playGlassResonance(550, isMuted);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all rgb-interactive-option ${
                filter === 'unity'
                  ? 'bg-white/25 text-white border border-white/30 shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Unity Games
            </button>
            <button
              id="project-filter-graphics"
              onClick={() => {
                setFilter('graphics');
                playGlassResonance(580, isMuted);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all rgb-interactive-option ${
                filter === 'graphics'
                  ? 'bg-white/25 text-white border border-white/30 shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Shaders & VFX
            </button>
            <button
              id="project-filter-systems"
              onClick={() => {
                setFilter('systems');
                playGlassResonance(610, isMuted);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all rgb-interactive-option ${
                filter === 'systems'
                  ? 'bg-white/25 text-white border border-white/30 shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              DOTS & Systems
            </button>
            <button
              id="project-filter-other"
              onClick={() => {
                setFilter('other');
                playGlassResonance(640, isMuted);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all rgb-interactive-option ${
                filter === 'other'
                  ? 'bg-white/25 text-white border border-white/30 shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Other
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Projects Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            id={`project-card-${project.id}`}
            onClick={() => handleSelectProject(project)}
            style={{
              backdropFilter: `blur(${blurLevel}px) saturate(160%)`,
              WebkitBackdropFilter: `blur(${blurLevel}px) saturate(160%)`,
              backgroundColor: theme.cardStyles.background,
              borderColor: theme.cardStyles.border,
            }}
            className="group rounded-3xl p-6 glass-specular-border relative overflow-hidden flex flex-col justify-between cursor-pointer select-none rgb-interactive-card"
          >
            {/* Prismatic Top Edge Refraction Line */}
            <div 
              className="absolute top-0 left-0 right-0 h-[1.5px] opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${theme.cardStyles.highlight} 50%, transparent 100%)`,
              }}
            />

            <div>
              {/* Graphic Ambient Banner / Real Screenshot */}
              {(() => {
                const coverImage = (project.galleryImages && project.galleryImages.length > 0 && isRealImageSource(project.galleryImages[0]))
                  ? project.galleryImages[0]
                  : (isRealImageSource(project.imageBanner))
                    ? project.imageBanner
                    : null;
                return (
                  <div className="w-full h-36 rounded-2xl mb-4 overflow-hidden border border-white/15 relative flex flex-col justify-between shadow-inner bg-black/40">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={project.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="absolute inset-0" style={{ background: project.imageBanner }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/50 pointer-events-none" />

                    <div className="relative z-10 p-3 flex items-center justify-between">
                      <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20">
                        {project.engine}
                      </span>
                      <span className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-black/60 ${theme.accentClass.timeText} backdrop-blur-md border border-white/20`}>
                        {project.status}
                      </span>
                    </div>

                    <div className="relative z-10 p-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {project.releaseDate && (
                          <span
                            className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-amber-300 text-[10px] font-mono border border-amber-500/35 flex items-center gap-1 shadow-sm"
                            title={`تاریخ انتشار: ${project.releaseDate}`}
                          >
                            <Calendar size={10} className="text-amber-400 shrink-0" />
                            <span>{project.releaseDate}</span>
                          </span>
                        )}
                        {project.youtubeUrl && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-600/80 backdrop-blur-sm text-white text-[10px] font-medium flex items-center gap-1">
                            <Youtube size={11} />
                            <span>ویدیو</span>
                          </span>
                        )}
                        {project.galleryImages && project.galleryImages.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono border border-white/15 flex items-center gap-1">
                            <Images size={11} />
                            <span>{project.galleryImages.length} تصویر</span>
                          </span>
                        )}
                      </div>
                      <div
                        className="flex items-center gap-1.5 text-[11px] font-medium text-white bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 shrink-0"
                        title={project.platform?.join(' • ') || 'Platform'}
                      >
                        <span>
                          {project.platform && project.platform.length > 0
                            ? project.platform.length > 1
                              ? `${project.platform[0]} (+${project.platform.length - 1})`
                              : project.platform[0]
                            : 'PC'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Title & Description */}
              <h3 className="text-lg sm:text-xl font-semibold text-white group-hover:text-white transition-colors flex items-center justify-between">
                <span>{project.title}</span>
                <ArrowUpRight size={18} className="text-slate-300 group-hover:text-white transition-colors" />
              </h3>

              <p className="text-xs sm:text-sm text-slate-200 font-normal leading-relaxed line-clamp-3 mt-2.5">
                {project.shortDescription}
              </p>

              {/* Tech Tags */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {project.technologies.slice(0, 3).map((tech, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 font-mono font-medium border border-white/15"
                  >
                    {tech}
                  </span>
                ))}
                {project.technologies.length > 3 && (
                  <span className="text-xs px-2 py-1 rounded-lg text-slate-300 font-mono font-medium bg-white/5 border border-white/10">
                    +{project.technologies.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* Card Footer */}
            <div className="mt-5 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <span className="text-[11px] font-mono font-medium text-slate-300">
                {project.platform && project.platform.length > 0 ? project.platform[0] : 'Architecture & Specs'}
              </span>
              <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                {/* GitHub Option */}
                {project.githubUrl && project.githubUrl.trim() !== '' ? (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="مشاهده ریپازیتوری GitHub"
                    className="p-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all flex items-center gap-1.5 border border-white/15 hover:scale-105 rgb-interactive-option cursor-pointer"
                  >
                    <Github size={12} />
                    <span className="font-mono text-[11px]">GitHub</span>
                    <ExternalLink size={10} className="opacity-70" />
                  </a>
                ) : (
                  <div
                    title="ریپازیتوری GitHub: به زودی"
                    className="p-1.5 px-2 rounded-lg bg-white/[0.03] text-slate-400 text-xs font-medium flex items-center gap-1.5 border border-white/10 opacity-70 cursor-not-allowed select-none"
                  >
                    <Github size={12} className="opacity-40" />
                    <span className="line-through decoration-rose-400/80 decoration-[1.5px] text-slate-400 text-[11px] font-mono">
                      GitHub
                    </span>
                    <span className="text-[9px] font-mono font-medium text-amber-300/90 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/25 whitespace-nowrap">
                      coming soon ...
                    </span>
                  </div>
                )}

                {/* Demo / Itch.io Option */}
                {project.demoUrl && project.demoUrl.trim() !== '' ? (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="اجرای آنلاین / دانلود دمو در Itch.io"
                    className="p-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all flex items-center gap-1.5 border border-white/15 hover:scale-105 rgb-interactive-option cursor-pointer"
                  >
                    <Gamepad2 size={12} className={theme.accentClass.icon} />
                    <span className="font-mono text-[11px]">Itch.io</span>
                    <ExternalLink size={10} className="opacity-70" />
                  </a>
                ) : (
                  <div
                    title="دمو یا بازی در Itch.io: به زودی"
                    className="p-1.5 px-2 rounded-lg bg-white/[0.03] text-slate-400 text-xs font-medium flex items-center gap-1.5 border border-white/10 opacity-70 cursor-not-allowed select-none"
                  >
                    <Gamepad2 size={12} className="opacity-40" />
                    <span className="line-through decoration-rose-400/80 decoration-[1.5px] text-slate-400 text-[11px] font-mono">
                      Itch.io
                    </span>
                    <span className="text-[9px] font-mono font-medium text-amber-300/90 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/25 whitespace-nowrap">
                      coming soon ...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Project Details Modal */}
      <ProjectDetailsModal
        project={
          activeProjectModal
            ? projectsData.find((p) => p.id === activeProjectModal.id) || activeProjectModal
            : null
        }
        theme={theme}
        blurLevel={blurLevel}
        isMuted={isMuted}
        onClose={() => setActiveProjectModal(null)}
      />
    </motion.div>
  );
};
