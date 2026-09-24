import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GlassTheme } from '../types';
import {
  Mail,
  Copy,
  Check,
  Send,
  Github,
  Linkedin,
  Gamepad2,
  Sparkles,
  MapPin,
  Clock,
  Loader2,
  Globe,
  MessageSquare,
  Twitter,
  Sliders,
} from 'lucide-react';
import { playGlassResonance } from '../utils/audio';
import { submitContactMessage } from '../services/api';
import { usePortfolio } from '../context/PortfolioContext';

interface ContactSectionProps {
  theme: GlassTheme;
  blurLevel: number;
  isMuted: boolean;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  theme,
  blurLevel,
  isMuted,
}) => {
  const { contactData, currentUser, setIsAdminEditorOpen, setAdminActiveTab } = usePortfolio();
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactData.email);
    setCopied(true);
    playGlassResonance(700, isMuted);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message || isSubmitting) return;

    setIsSubmitting(true);
    playGlassResonance(600, isMuted);

    const result = await submitContactMessage(formData);
    setIsSubmitting(false);

    if (result.success) {
      setSubmitMessage(result.message);
      setFormSubmitted(true);
      playGlassResonance(800, isMuted);
      setTimeout(() => {
        setFormSubmitted(false);
        setFormData({ name: '', email: '', subject: '', message: '' });
      }, 5000);
    } else {
      alert(result.message || 'Error sending message. Please try again or email directly.');
    }
  };

  const renderSocialIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'github':
        return <Github size={18} />;
      case 'linkedin':
        return <Linkedin size={18} />;
      case 'gamepad2':
      case 'itchio':
      case 'itch.io':
      case 'game':
        return <Gamepad2 size={18} />;
      case 'twitter':
      case 'x':
        return <Twitter size={18} />;
      case 'mail':
      case 'email':
        return <Mail size={18} />;
      case 'messagesquare':
      case 'discord':
      case 'telegram':
        return <MessageSquare size={18} />;
      default:
        return <Globe size={18} />;
    }
  };

  return (
    <motion.div
      id="contact-section-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 w-full max-w-4xl mx-auto px-4 py-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Col: Contact Info & Direct Links */}
        <div className="md:col-span-5 space-y-5">
          {/* Profile Quick Glass Card */}
          <div
            style={{
              backdropFilter: `blur(${blurLevel}px) saturate(160%)`,
              WebkitBackdropFilter: `blur(${blurLevel}px) saturate(160%)`,
              backgroundColor: theme.cardStyles.background,
              borderColor: theme.cardStyles.border,
            }}
            className="rounded-3xl p-6 sm:p-7 glass-specular-border relative overflow-hidden rgb-interactive-card"
          >
            {/* Top Refraction Accent */}
            <div 
              className="absolute top-0 left-0 right-0 h-[1.5px] opacity-70 pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${theme.cardStyles.highlight} 50%, transparent 100%)`,
              }}
            />

            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.accentClass.ping} opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${theme.accentClass.dot}`} />
                </span>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-200">
                  Direct Contact
                </span>
              </div>

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => {
                    setAdminActiveTab('contact');
                    setIsAdminEditorOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                  title="ویرایش اطلاعات تماس و لینک‌ها"
                >
                  <Sliders size={11} />
                  <span>ویرایش ادمین</span>
                </button>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
              {contactData.heading || "Let's build together"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 font-normal leading-relaxed mb-6">
              {contactData.subheading || "Available for game development contracts, Unity systems programming, shader engineering, and technical advisory."}
            </p>

            {/* Email Copy Card */}
            <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/15 mb-5">
              <div className="text-xs text-slate-300 font-mono font-medium mb-1.5">Primary Email</div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-mono text-white font-medium truncate">
                  {contactData.email}
                </span>
                <button
                  id="btn-copy-email"
                  onClick={handleCopyEmail}
                  className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors flex items-center gap-1.5 text-xs font-mono font-medium shrink-0 rgb-interactive-option border border-white/20 cursor-pointer"
                  title="Copy email to clipboard"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Location & Availability */}
            <div className="space-y-2.5 text-xs sm:text-sm text-slate-200 font-normal pt-3 border-t border-white/15">
              <div className="flex items-center gap-2">
                <MapPin size={15} className={theme.accentClass.icon} />
                <span>{contactData.location || 'Remote / Worldwide'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={15} className={theme.accentClass.icon} />
                <span>{contactData.responseTime || 'Response time within 24 hours'}</span>
              </div>
            </div>

            {/* Dynamic Social Links Bento Grid */}
            <div className="grid grid-cols-3 gap-2 mt-6">
              {contactData.socials && contactData.socials.length > 0 ? (
                contactData.socials.map((soc, idx) => (
                  <a
                    key={`contact-soc-${soc.id || idx}-${idx}`}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 flex flex-col items-center justify-center gap-1.5 text-slate-200 hover:text-white transition-colors rgb-interactive-option"
                    title={soc.name}
                  >
                    {renderSocialIcon(soc.icon || soc.name)}
                    <span className="text-xs font-mono font-medium truncate max-w-[85px]">{soc.name}</span>
                  </a>
                ))
              ) : (
                <div className="col-span-3 text-center py-2 text-xs text-slate-400">
                  لینکی اضافه نشده است
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Interactive Message Form */}
        <div className="md:col-span-7">
          <div
            style={{
              backdropFilter: `blur(${blurLevel}px) saturate(160%)`,
              WebkitBackdropFilter: `blur(${blurLevel}px) saturate(160%)`,
              backgroundColor: theme.cardStyles.background,
              borderColor: theme.cardStyles.border,
            }}
            className="rounded-3xl p-6 sm:p-8 glass-specular-border relative overflow-hidden rgb-interactive-card"
          >
            {/* Top Refraction Line */}
            <div 
              className="absolute top-0 left-0 right-0 h-[1.5px] opacity-70 pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${theme.cardStyles.highlight} 45%, rgba(${theme.pointerAura.highlightRgb}, 0.95) 50%, ${theme.cardStyles.highlight} 55%, transparent 100%)`,
              }}
            />

            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-1">
              {contactData.formHeading || 'Send a Message'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-normal mb-6">
              {contactData.formSubheading || 'Have a project, game jam idea, or technical question? Drop a note below.'}
            </p>

            {formSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 rounded-2xl bg-white/5 border border-white/15 text-center my-8"
              >
                <div className="inline-flex p-3 rounded-2xl bg-white/10 border border-white/10 mb-3">
                  <Sparkles className={`w-7 h-7 ${theme.accentClass.icon}`} />
                </div>
                <h4 className="text-base font-semibold text-white mb-1">Message Transmitted!</h4>
                <p className="text-xs sm:text-sm text-slate-200 font-normal max-w-xs mx-auto">
                  {submitMessage || "Thank you for reaching out. I'll get back to your email at the earliest opportunity."}
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold block mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Alex Morgan"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/20 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-white/40 backdrop-blur-sm transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold block mb-1.5">
                      Your Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="alex@studio.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/20 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-white/40 backdrop-blur-sm transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold block mb-1.5">
                    Subject / Project Scope
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Unity Game Dev / Shader Commission / Collaboration"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/20 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-white/40 backdrop-blur-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold block mb-1.5">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your game idea, requirements, timeline, or query in detail..."
                    className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/20 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-white/40 backdrop-blur-sm transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 rounded-2xl bg-white/20 hover:bg-white/30 active:bg-white/35 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/25 transition-all shadow-lg hover:shadow-xl rgb-interactive-option cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Transmitting Packet...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} className={theme.accentClass.icon} />
                      <span>Send Dispatch</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
