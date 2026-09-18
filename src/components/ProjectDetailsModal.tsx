import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassTheme, Project } from '../types';
import { X, ExternalLink, Github, Gamepad2, Cpu, CheckCircle, Sparkles, Layers, Terminal } from 'lucide-react';
import { playGlassResonance } from '../utils/audio';

interface ProjectDetailsModalProps {
  project: Project | null;
  theme: GlassTheme;
  blurLevel: number;
  isMuted: boolean;
  onClose: () => void;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  project,
  theme,
  blurLevel,
  isMuted,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'architecture'>('overview');

  if (!project) return null;

  return (
    <AnimatePresence>
      <div 
        id="project-modal-backdrop"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          id="project-modal-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            backdropFilter: `blur(${Math.max(blurLevel, 32)}px) saturate(160%)`,
            WebkitBackdropFilter: `blur(${Math.max(blurLevel, 32)}px) saturate(160%)`,
            backgroundColor: theme.cardStyles.background,
            borderColor: theme.cardStyles.border,
          }}
          className="relative w-full max-w-3xl rounded-3xl p-6 sm:p-8 glass-specular-border shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Prismatic Top Edge Refraction Line */}
          <div 
            className="absolute top-0 left-0 right-0 h-[1.5px] opacity-80 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${theme.cardStyles.highlight} 45%, rgba(255,255,255,0.9) 50%, ${theme.cardStyles.highlight} 55%, transparent 100%)`,
            }}
          />

          {/* Modal Header */}
          <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] uppercase tracking-wider font-mono px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                  {project.engine}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${theme.accentClass.timeText}`}>
                  {project.status}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                {project.title}
              </h2>
            </div>

            <button
              id="btn-close-project-modal"
              onClick={() => {
                onClose();
                playGlassResonance(420, isMuted);
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors border border-white/10"
            >
              <X size={18} />
            </button>
          </div>

          {/* Banner Graphic Placeholder with Optical Depth */}
          <div
            className="relative w-full h-36 sm:h-48 rounded-2xl my-4 overflow-hidden border border-white/10 flex items-center justify-center p-6 shadow-inner"
            style={{ background: project.imageBanner }}
          >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
            <div className="relative z-10 text-center">
              <div className="inline-flex p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md mb-2">
                <Gamepad2 className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div className="text-xs font-mono text-white/90">
                Platforms: {project.platform.join(' • ')}
              </div>
            </div>
          </div>

          {/* Modal Tabs */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/[0.04] border border-white/10 mb-4 self-start">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-white/20 text-white border border-white/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'features'
                  ? 'bg-white/20 text-white border border-white/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Key Features
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'architecture'
                  ? 'bg-white/20 text-white border border-white/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Engineering Deep Dive
            </button>
          </div>

          {/* Tab Content - Scrollable if large */}
          <div className="overflow-y-auto flex-1 pr-1 space-y-4 text-sm text-slate-300 font-light leading-relaxed">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <p>{project.fullDescription}</p>

                {/* Technologies used chips */}
                <div className="pt-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">
                    Technologies & Architecture Stack:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {project.technologies.map((t, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-2.5">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">
                  Implementation Deliverables:
                </span>
                {project.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5"
                  >
                    <CheckCircle size={15} className={`${theme.accentClass.icon} shrink-0 mt-0.5`} />
                    <span className="text-xs text-slate-200">{feat}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'architecture' && (
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2">
                  Engineering Notes & Solutions:
                </span>
                {project.highlights?.map((hl, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-300 font-light leading-relaxed"
                  >
                    <div className="flex items-center gap-2 mb-1 text-white font-medium">
                      <Cpu size={13} className={theme.accentClass.icon} />
                      <span>Technical Highlight #{idx + 1}</span>
                    </div>
                    {hl}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Action Links */}
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all flex items-center gap-2 border border-white/15"
                >
                  <Github size={14} />
                  <span>GitHub Repository</span>
                  <ExternalLink size={11} />
                </a>
              )}

              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-all flex items-center gap-2 border border-white/20"
                >
                  <Gamepad2 size={14} className={theme.accentClass.icon} />
                  <span>Launch Playable Demo</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Target: {project.platform[0]}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
