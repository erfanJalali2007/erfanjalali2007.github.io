import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassTheme, Project } from '../types';
import {
  X,
  ExternalLink,
  Github,
  Gamepad2,
  Cpu,
  CheckCircle,
  Youtube,
  Play,
  Images,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Video,
  Calendar,
  Clock,
} from 'lucide-react';
import { playGlassResonance } from '../utils/audio';
import { getYouTubeEmbedUrl } from '../utils/media';
import { isRealImageSource } from '../utils/imageSource';

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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Derive YouTube embed URL
  const youtubeEmbedUrl = project ? getYouTubeEmbedUrl(project.youtubeUrl || project.videoUrl) : null;

  // Derive valid images (strictly exclude CSS gradients)
  const validImages: string[] = [];
  if (project?.galleryImages && project.galleryImages.length > 0) {
    project.galleryImages.forEach((img) => {
      if (img && typeof img === 'string' && img.trim() && isRealImageSource(img)) {
        validImages.push(img.trim());
      }
    });
  }
  if (
    validImages.length === 0 &&
    project?.imageBanner &&
    isRealImageSource(project.imageBanner)
  ) {
    validImages.push(project.imageBanner.trim());
  }

  // Active media view mode: 'video' or 'gallery'
  const [mediaView, setMediaView] = useState<'video' | 'gallery'>('gallery');

  // Set default media view when project changes
  useEffect(() => {
    setActiveImageIndex(0);
    setLightboxImage(null);
    if (youtubeEmbedUrl) {
      setMediaView('video');
    } else {
      setMediaView('gallery');
    }
  }, [project?.id, youtubeEmbedUrl]);

  // Handle escape key for closing modal or lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxImage) {
          setLightboxImage(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, onClose]);

  // Lock background window scroll and restore when modal is opened/closed
  useEffect(() => {
    if (!project) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverscroll = document.body.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overscrollBehavior = originalBodyOverscroll;
    };
  }, [project]);

  if (!project) return null;

  return (
    <AnimatePresence>
      <div
        key={`project-modal-backdrop-${project.id}`}
        id="project-modal-backdrop"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-hidden overscroll-none select-text"
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
          className="relative w-full max-w-4xl h-[92vh] max-h-[92vh] rounded-3xl glass-specular-border shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Prismatic Top Edge Refraction Line matching Theme Aura */}
          <div
            className="absolute top-0 left-0 right-0 h-[1.5px] opacity-80 pointer-events-none z-20"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${theme.cardStyles.highlight} 45%, rgba(${theme.pointerAura.highlightRgb}, 0.95) 50%, ${theme.cardStyles.highlight} 55%, transparent 100%)`,
            }}
          />

          {/* Sticky Modal Header */}
          <div className="flex items-start justify-between gap-4 p-5 sm:p-7 pb-4 border-b border-white/10 shrink-0 z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[10px] uppercase tracking-wider font-mono px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                  {project.engine}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${theme.accentClass.timeText}`}
                >
                  {project.status}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                  {project.platform.join(' • ')}
                </span>
                {project.releaseDate && (
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-200 flex items-center gap-1 shadow-sm">
                    <Calendar size={11} className="text-amber-400" />
                    <span>تاریخ انتشار: {project.releaseDate}</span>
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white tracking-tight">
                {project.title}
              </h2>
            </div>

            <button
              id="btn-close-project-modal"
              onClick={() => {
                onClose();
                playGlassResonance(420, isMuted);
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors border border-white/10 cursor-pointer shrink-0"
              title="بستن پنجره"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Modal Body (Contains Media showcase, Tabs, and Description content) */}
          <div className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-4 text-sm text-slate-300 font-light leading-relaxed custom-modal-scrollbar overscroll-contain">
            {/* Media Header Switcher (When both YouTube video & Gallery Images exist) */}
            {(youtubeEmbedUrl || validImages.length > 0) && (
              <div className="flex items-center justify-between gap-2 pb-1">
                <div className="flex items-center gap-2">
                  {youtubeEmbedUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setMediaView('video');
                        playGlassResonance(550, isMuted);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        mediaView === 'video'
                          ? 'bg-rose-500/25 text-rose-200 border-rose-500/40 shadow-sm'
                          : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <Play size={14} className="text-rose-400 fill-rose-400" />
                      <span>ویدیو گیم‌پلی (یوتیوب)</span>
                    </button>
                  )}

                  {validImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMediaView('gallery');
                        playGlassResonance(520, isMuted);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        mediaView === 'gallery'
                          ? 'bg-white/20 text-white border-white/30 shadow-sm'
                          : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <Images size={14} className={theme.accentClass.icon} />
                      <span>گالری تصاویر ({validImages.length})</span>
                    </button>
                  )}
                </div>

                {mediaView === 'video' && (
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-flex items-center gap-1">
                    <Video size={12} className="text-rose-400" />
                    <span>Interactive YouTube Embed</span>
                  </span>
                )}

                {mediaView === 'gallery' && validImages.length > 0 && (
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-flex items-center gap-1">
                    <span>روی تصویر جهت بزرگ‌نمایی کلیک کنید</span>
                  </span>
                )}
              </div>
            )}

            {/* MAIN MEDIA SHOWCASE AREA */}
            <div className="my-2">
              {/* 1. YouTube Embedded Video Player */}
              {mediaView === 'video' && youtubeEmbedUrl && (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/20 bg-black/90 shadow-2xl">
                  <iframe
                    src={youtubeEmbedUrl}
                    title={`${project.title} - Video`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              )}

              {/* 2. Multi-Image Gallery Showcase */}
              {mediaView === 'gallery' && validImages.length > 0 && (
                <div className="space-y-2.5">
                  {/* Main Large Image Stage */}
                  <div className="relative w-full h-56 sm:h-72 md:h-80 rounded-2xl overflow-hidden border border-white/20 bg-black/60 shadow-2xl flex items-center justify-center group/img">
                    <img
                      src={validImages[activeImageIndex]}
                      alt={`${project.title} screenshot ${activeImageIndex + 1}`}
                      className="w-full h-full object-contain sm:object-cover transition-transform duration-300 cursor-zoom-in"
                      onClick={() => setLightboxImage(validImages[activeImageIndex])}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="%231e293b" width="400" height="300"/><text fill="%2394a3b8" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle">تصویر بارگذاری نشد</text></svg>';
                      }}
                    />

                    {/* Gradient bottom overlay */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-70" />

                    {/* Top Zoom Action */}
                    <button
                      onClick={() => setLightboxImage(validImages[activeImageIndex])}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white/90 hover:text-white border border-white/25 opacity-80 group-hover/img:opacity-100 transition-opacity cursor-pointer shadow"
                      title="مشاهده تصویر در اندازه بزرگ"
                    >
                      <Maximize2 size={15} />
                    </button>

                    {/* Navigation Arrows */}
                    {validImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
                            playGlassResonance(500, isMuted);
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-black/60 hover:bg-black/85 text-white border border-white/25 transition-all cursor-pointer shadow-lg"
                          title="تصویر قبلی"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
                            playGlassResonance(500, isMuted);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-black/60 hover:bg-black/85 text-white border border-white/25 transition-all cursor-pointer shadow-lg"
                          title="تصویر بعدی"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}

                    {/* Image Counter Badge */}
                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-white/20 text-xs font-mono text-white flex items-center gap-1.5 shadow">
                      <span>{activeImageIndex + 1} / {validImages.length}</span>
                    </div>
                  </div>

                  {/* Thumbnails Row */}
                  {validImages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {validImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setActiveImageIndex(idx);
                            playGlassResonance(540, isMuted);
                          }}
                          className={`relative shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                            activeImageIndex === idx
                              ? 'border-white ring-2 ring-white/50 scale-105 shadow-md'
                              : 'border-white/20 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80" viewBox="0 0 100 80"><rect fill="%231e293b" width="100" height="80"/><text fill="%2394a3b8" font-size="10" x="50%" y="50%" text-anchor="middle">IMG</text></svg>';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Fallback Banner if no YouTube video and no custom images */}
              {!youtubeEmbedUrl && validImages.length === 0 && (
                <div
                  className="relative w-full h-36 sm:h-48 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center p-6 shadow-inner"
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
              )}
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/[0.04] border border-white/10 my-3 self-start">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-white/20 text-white border border-white/20 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'features'
                    ? 'bg-white/20 text-white border border-white/20 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Key Features
              </button>
              <button
                onClick={() => setActiveTab('architecture')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'architecture'
                    ? 'bg-white/20 text-white border border-white/20 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Engineering Deep Dive
              </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {activeTab === 'overview' && (
                <div className="space-y-4 pt-1">
                  {/* Dedicated Project Description Section */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-inner">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2 font-medium">
                      توضیحات و جزئیات پروژه (Project Description):
                    </span>
                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal whitespace-pre-line">
                      {project.fullDescription || project.shortDescription}
                    </p>
                  </div>

                  {/* Dedicated Project Links & Deliverables Section */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-inner space-y-2.5">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block font-medium">
                      لینک‌ها و دسترسی به پروژه (Links &amp; Deliverables):
                    </span>
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      {/* GitHub Repository Link */}
                      {project.githubUrl && project.githubUrl.trim() !== '' ? (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all flex items-center gap-2 border border-white/15 shadow-sm hover:scale-[1.02] cursor-pointer"
                          title="مشاهده ریپازیتوری گیت‌هاب"
                        >
                          <Github size={15} />
                          <span>GitHub Repository</span>
                          <ExternalLink size={11} className="opacity-70" />
                        </a>
                      ) : (
                        <div
                          className="px-3.5 py-2 rounded-xl bg-white/[0.03] text-slate-400 text-xs font-medium flex items-center gap-2 border border-white/10 opacity-75 cursor-not-allowed select-none"
                          title="ریپازیتوری گیت‌هاب این پروژه به زودی قرار خواهد گرفت"
                        >
                          <Github size={15} className="opacity-40" />
                          <span className="line-through decoration-rose-400/80 decoration-[1.5px] text-slate-400 font-mono">
                            GitHub Repository
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-sm whitespace-nowrap">
                            <Clock size={10} className="text-amber-400 shrink-0" />
                            <span>coming soon ...</span>
                          </span>
                        </div>
                      )}

                      {/* Playable Demo / Itch.io Link */}
                      {project.demoUrl && project.demoUrl.trim() !== '' ? (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-all flex items-center gap-2 border border-white/20 shadow-sm hover:scale-[1.02] cursor-pointer"
                          title="اجرای دمو یا دانلود بازی در Itch.io"
                        >
                          <Gamepad2 size={15} className={theme.accentClass.icon} />
                          <span>Play Demo / Itch.io</span>
                          <ExternalLink size={11} className="opacity-70" />
                        </a>
                      ) : (
                        <div
                          className="px-3.5 py-2 rounded-xl bg-white/[0.03] text-slate-400 text-xs font-medium flex items-center gap-2 border border-white/10 opacity-75 cursor-not-allowed select-none"
                          title="دموی قابل بازی / لینک Itch.io به زودی در دسترس قرار می‌گیرد"
                        >
                          <Gamepad2 size={15} className="opacity-40" />
                          <span className="line-through decoration-rose-400/80 decoration-[1.5px] text-slate-400 font-mono">
                            Demo / Itch.io
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-sm whitespace-nowrap">
                            <Clock size={10} className="text-amber-400 shrink-0" />
                            <span>coming soon ...</span>
                          </span>
                        </div>
                      )}

                      {/* YouTube Gameplay Link (if available) */}
                      {project.youtubeUrl && project.youtubeUrl.trim() !== '' && (
                        <a
                          href={project.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 text-xs font-medium transition-all flex items-center gap-2 border border-rose-500/25 shadow-sm hover:scale-[1.02] cursor-pointer"
                        >
                          <Youtube size={15} className="text-rose-400" />
                          <span>مشاهده در یوتیوب</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Technologies used chips */}
                  <div className="pt-1">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2 font-medium">
                      Technologies &amp; Architecture Stack:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {project.technologies.map((t, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-slate-200 shadow-sm"
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
                    Engineering Notes &amp; Solutions:
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
          </div>

          {/* Sticky Footer Action Links */}
          <div className="p-4 sm:p-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* GitHub Repository Option */}
              {project.githubUrl && project.githubUrl.trim() !== '' ? (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all flex items-center gap-2 border border-white/15 shadow-sm hover:scale-[1.02] cursor-pointer"
                  title="مشاهده ریپازیتوری گیت‌هاب"
                >
                  <Github size={15} />
                  <span>GitHub Repository</span>
                  <ExternalLink size={11} className="opacity-70" />
                </a>
              ) : (
                <div
                  className="px-3.5 py-2 rounded-xl bg-white/[0.03] text-slate-400 text-xs font-medium flex items-center gap-2 border border-white/10 opacity-75 cursor-not-allowed select-none"
                  title="ریپازیتوری گیت‌هاب این پروژه به زودی قرار خواهد گرفت"
                >
                  <Github size={15} className="opacity-40" />
                  <span className="line-through decoration-rose-400/80 decoration-[1.5px] text-slate-400 font-mono">
                    GitHub Repository
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-sm whitespace-nowrap">
                    <Clock size={10} className="text-amber-400 shrink-0" />
                    <span>coming soon ...</span>
                  </span>
                </div>
              )}

              {/* Demo / Itch.io Option */}
              {project.demoUrl && project.demoUrl.trim() !== '' ? (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-all flex items-center gap-2 border border-white/20 shadow-sm hover:scale-[1.02] cursor-pointer"
                  title="اجرای دمو یا دانلود بازی در Itch.io"
                >
                  <Gamepad2 size={15} className={theme.accentClass.icon} />
                  <span>Demo (Itch.io)</span>
                  <ExternalLink size={11} className="opacity-70" />
                </a>
              ) : (
                <div
                  className="px-3.5 py-2 rounded-xl bg-white/[0.03] text-slate-400 text-xs font-medium flex items-center gap-2 border border-white/10 opacity-75 cursor-not-allowed select-none"
                  title="دموی بازی در Itch.io به زودی قرار خواهد گرفت"
                >
                  <Gamepad2 size={15} className="opacity-40" />
                  <span className="line-through decoration-rose-400/80 decoration-[1.5px] text-slate-400 font-mono">
                    Demo / Itch.io
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-sm whitespace-nowrap">
                    <Clock size={10} className="text-amber-400 shrink-0" />
                    <span>coming soon ...</span>
                  </span>
                </div>
              )}

              {/* YouTube Gameplay Link */}
              {project.youtubeUrl && project.youtubeUrl.trim() !== '' && (
                <a
                  href={project.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 text-xs font-medium transition-all flex items-center gap-2 border border-rose-500/25 shadow-sm hover:scale-[1.02] cursor-pointer"
                >
                  <Youtube size={15} className="text-rose-400" />
                  <span>مشاهده در یوتیوب</span>
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

      {/* Lightbox Fullscreen Image Viewer Modal */}
      {lightboxImage && (
        <div
          key="project-lightbox-backdrop"
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-xl bg-white/10 hover:bg-white/25 text-white border border-white/20 cursor-pointer"
              title="بستن بزرگ‌نمایی"
            >
              <X size={20} />
            </button>
            <img
              src={lightboxImage}
              alt="Fullscreen view"
              className="max-w-full max-h-[85vh] rounded-2xl border border-white/20 shadow-2xl object-contain"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
