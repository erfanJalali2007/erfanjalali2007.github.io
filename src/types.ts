export type GlassThemeId = 'ruby' | 'prismatic' | 'clear' | 'obsidian' | 'amber';

export type PortfolioSection = 'home' | 'about' | 'skills' | 'projects' | 'experience' | 'contact' | 'settings';

export interface GlassTheme {
  id: GlassThemeId;
  name: string;
  badge: string;
  backgroundClass: string;
  accentClass: {
    ping: string;
    dot: string;
    icon: string;
    timeText: string;
  };
  liquidBlobs: {
    color1: string;
    color2: string;
    color3: string;
    ambient: string;
  };
  cardStyles: {
    background: string;
    border: string;
    highlight: string;
    textColor: string;
    subtextColor: string;
  };
  pointerAura: {
    primaryRgb: string;
    secondaryRgb: string;
    highlightRgb: string;
    cssGradient: string;
  };
}

export interface RipplePoint {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export interface SocialLinkItem {
  id: string;
  name: string;
  url: string;
  icon: string; // 'Github' | 'Linkedin' | 'Gamepad2' | 'Mail' | 'Twitter' | 'Globe' | 'MessageSquare' | 'Send'
}

export interface ContactDetails {
  heading: string;
  subheading: string;
  email: string;
  location: string;
  responseTime: string;
  formHeading: string;
  formSubheading: string;
  socials: SocialLinkItem[];
}

export interface ProfileInfo {
  name: string;
  title: string;
  tagline: string;
  bio: string;
  email: string;
  location: string;
  availability: string;
  stats: { label: string; value: string }[];
  socials: SocialLinkItem[];
}

export interface Project {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: 'unity' | 'graphics' | 'systems' | 'other' | 'all' | (string & {});
  engine: string;
  status: 'Completed' | 'In Development' | 'Prototype' | 'Demo' | 'Early Access' | 'On Hold' | (string & {});
  releaseDate?: string;
  platform: string[];
  technologies: string[];
  features: string[];
  githubUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  youtubeUrl?: string;
  imageBanner: string;
  galleryImages?: string[];
  highlights?: string[];
}

export interface SkillItem {
  name: string;
  level: number;
  tag: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  skills: SkillItem[];
}

export interface ExperienceItem {
  id: string;
  role: string;
  organization: string;
  period: string;
  type: string;
  description: string;
  achievements: string[];
  technologies: string[];
}

export interface AppearanceSettings {
  themeId: GlassThemeId;
  blurLevel: number; // 16, 28, 44
  glassOpacity: number; // 0.02 to 0.15
  borderOpacity: number; // 0.10 to 0.40
  glowIntensity: number; // 0.4 to 1.0
  soundEnabled: boolean;
  reducedMotion: boolean;
}

export interface GitHubProfile {
  username: string;
  name: string;
  bio: string;
  avatarUrl: string;
  profileUrl: string;
  publicRepos: number;
  followers: number;
  following: number;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  updatedAt: string;
  isFork: boolean;
}

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  joinedAt: string;
}



