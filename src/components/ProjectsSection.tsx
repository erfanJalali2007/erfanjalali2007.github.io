import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GlassTheme, Project } from '../types';
import { PROJECTS_DATA } from '../data/portfolioData';
import { ProjectDetailsModal } from './ProjectDetailsModal';
import { Gamepad2, Sparkles, Cpu, ExternalLink, Github, ArrowUpRight } from 'lucide-react';
import { playGlassResonance } from '../utils/audio';

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
  const [filter, setFilter] = useState<'all' | 'unity' | 'graphics' | 'systems'>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = filter === 'all'
    ? PROJECTS_DATA
    : PROJECTS_DATA.filter((p) => p.category === filter);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
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

          {/* Filter pills */}
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
              All ({PROJECTS_DATA.length})
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
              {/* Graphic Ambient Banner */}
              <div
                className="w-full h-32 rounded-2xl mb-4 overflow-hidden border border-white/15 relative p-4 flex flex-col justify-between shadow-inner"
                style={{ background: project.imageBanner }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20">
                    {project.engine}
                  </span>
                  <span className={`text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-black/60 ${theme.accentClass.timeText} backdrop-blur-md border border-white/20`}>
                    {project.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 self-end text-xs font-medium text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                  <span>{project.platform[0]}</span>
                </div>
              </div>

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
            <div className="mt-5 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-slate-300">
              <span className="text-xs font-mono font-medium text-slate-300">
                Architecture & Specs
              </span>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View GitHub"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors rgb-interactive-option"
                  >
                    <Github size={13} />
                  </a>
                )}
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Play Demo"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors rgb-interactive-option"
                  >
                    <Gamepad2 size={13} />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Project Details Modal */}
      <ProjectDetailsModal
        project={selectedProject}
        theme={theme}
        blurLevel={blurLevel}
        isMuted={isMuted}
        onClose={() => setSelectedProject(null)}
      />
    </motion.div>
  );
};
