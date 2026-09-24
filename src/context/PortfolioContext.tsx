import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  ProfileInfo,
  Project,
  SkillCategory,
  SkillItem,
  ExperienceItem,
  User,
  UserRole,
  ContactDetails,
  SocialLinkItem,
} from '../types';
import {
  PROFILE_DATA,
  PROJECTS_DATA,
  SKILL_CATEGORIES,
  EXPERIENCES_DATA,
  DEFAULT_CONTACT_DETAILS,
} from '../data/portfolioData';
import { syncPortfolioDataToServer, exportAssetsZipPackage, exportFullProjectPackage } from '../services/storageService';
import { isRealImageSource } from '../utils/imageSource';

interface RegisteredAccount extends User {
  passwordHash: string;
}

const DEFAULT_ACCOUNTS: RegisteredAccount[] = [
  {
    id: 'user-admin',
    username: 'admin',
    name: 'Erfan Jalali (Admin)',
    email: 'erfanjalaliwork@gmail.com',
    role: 'admin',
    joinedAt: '2024-01-15',
    passwordHash: '123',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'user-guest',
    username: 'user',
    name: 'کاربر مهمان (Guest User)',
    email: 'visitor@portfolio.dev',
    role: 'user',
    joinedAt: '2026-03-01',
    passwordHash: '123',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  },
];

export type AdminTab = 'profile' | 'projects' | 'skills' | 'experience' | 'contact' | 'backup';

interface PortfolioContextType {
  // Auth
  currentUser: User | null;
  login: (username: string, password: string) => { success: boolean; message: string };
  register: (username: string, name: string, email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  // Active Project Details Modal
  activeProjectModal: Project | null;
  setActiveProjectModal: (project: Project | null) => void;

  // Admin Studio / Editor
  isAdminEditorOpen: boolean;
  setIsAdminEditorOpen: (open: boolean) => void;
  adminActiveTab: AdminTab;
  setAdminActiveTab: (tab: AdminTab) => void;
  lastSavedTime: string;
  saveAllChangesExplicitly: () => { success: boolean; timestamp: string };

  // Profile Data
  profileData: ProfileInfo;
  updateProfileData: (data: Partial<ProfileInfo>) => void;

  // Projects Data
  projectsData: Project[];
  updateProject: (project: Project) => void;
  addProject: (project: Project) => void;
  deleteProject: (id: string) => void;

  // Skills Data & Categories
  skillsData: SkillCategory[];
  updateSkillsData: (skills: SkillCategory[]) => void;
  addSkillCategory: (category: SkillCategory) => void;
  deleteSkillCategory: (categoryId: string) => void;
  addSkillItem: (categoryId: string, skill: SkillItem) => void;
  deleteSkillItem: (categoryId: string, skillIndex: number) => void;

  // Experiences & Timeline Data
  experiencesData: ExperienceItem[];
  updateExperience: (experience: ExperienceItem) => void;
  addExperience: (experience: ExperienceItem) => void;
  deleteExperience: (id: string) => void;

  // Contact Details & Social Links
  contactData: ContactDetails;
  updateContactData: (data: Partial<ContactDetails>) => void;
  addSocialLink: (link: SocialLinkItem) => void;
  updateSocialLink: (id: string, link: Partial<SocialLinkItem>) => void;
  deleteSocialLink: (id: string) => void;

  // Global actions
  resetAllToDefault: () => void;
  exportDataJSON: () => string;
  exportTypeScriptSource: () => string;
  importDataJSON: (jsonStr: string) => { success: boolean; message: string };
  bakeDataToProjectFiles: () => Promise<{ success: boolean; message: string; filesUpdated?: string[] }>;
  downloadFullAssetsZip: (onProgress?: (percent: number, msg: string) => void) => Promise<void>;
  downloadFullProjectZip: (onProgress?: (percent: number, msg: string) => void) => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | null>(null);

const STORAGE_KEYS = {
  USER: 'erfan_portfolio_current_user_v2',
  ACCOUNTS: 'erfan_portfolio_registered_accounts_v2',
  PROFILE: 'erfan_portfolio_profile_data_v2',
  PROJECTS: 'erfan_portfolio_projects_data_v2',
  SKILLS: 'erfan_portfolio_skills_data_v2',
  EXPERIENCES: 'erfan_portfolio_experiences_data_v2',
  CONTACT: 'erfan_portfolio_contact_data_v2',
  LAST_SAVED: 'erfan_portfolio_last_saved_v2',
  BACKUP_SNAPSHOT: 'erfan_portfolio_snapshot_auto_v2',
};

// Safe helper for writing to localStorage with quota overflow handling
function safeStorageSet(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    // If setting fails due to quota exceeded, clean up non-essential backup snapshot first
    try {
      if (key === STORAGE_KEYS.BACKUP_SNAPSHOT) {
        // If the auto snapshot itself exceeds quota, remove it to preserve space for core data
        localStorage.removeItem(STORAGE_KEYS.BACKUP_SNAPSHOT);
        return false;
      }
      localStorage.removeItem(STORAGE_KEYS.BACKUP_SNAPSHOT);
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      // Core storage set failed even after removing snapshot; silently ignore or log non-fatal
      return false;
    }
  }
}

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Free up legacy snapshot storage immediately to prevent QuotaExceeded errors
  try {
    localStorage.removeItem(STORAGE_KEYS.BACKUP_SNAPSHOT);
  } catch {
    // ignore
  }

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [accounts, setAccounts] = useState<RegisteredAccount[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Guarantee admin account always uses the updated password '123'
          let foundAdmin = false;
          const updated = parsed.map((acc: RegisteredAccount) => {
            if (acc.username.toLowerCase() === 'admin' || acc.role === 'admin') {
              foundAdmin = true;
              return { ...acc, passwordHash: '123', role: 'admin' as const };
            }
            return acc;
          });
          if (!foundAdmin) {
            updated.unshift(DEFAULT_ACCOUNTS[0]);
          }
          return updated;
        }
      }
      return DEFAULT_ACCOUNTS;
    } catch {
      return DEFAULT_ACCOUNTS;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [activeProjectModal, setActiveProjectModal] = useState<Project | null>(null);
  const [isAdminEditorOpen, setIsAdminEditorOpen] = useState<boolean>(false);
  const [adminActiveTab, setAdminActiveTab] = useState<AdminTab>('profile');
  const [lastSavedTime, setLastSavedTime] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_SAVED) || 'همین حالا';
    } catch {
      return 'همین حالا';
    }
  });

  // Portfolio Data state
  const [profileData, setProfileData] = useState<ProfileInfo>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return stored ? JSON.parse(stored) : PROFILE_DATA;
    } catch {
      return PROFILE_DATA;
    }
  });

  const [projectsData, setProjectsData] = useState<Project[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return stored ? JSON.parse(stored) : PROJECTS_DATA;
    } catch {
      return PROJECTS_DATA;
    }
  });

  const [skillsData, setSkillsData] = useState<SkillCategory[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SKILLS);
      return stored ? JSON.parse(stored) : SKILL_CATEGORIES;
    } catch {
      return SKILL_CATEGORIES;
    }
  });

  const [experiencesData, setExperiencesData] = useState<ExperienceItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EXPERIENCES);
      return stored ? JSON.parse(stored) : EXPERIENCES_DATA;
    } catch {
      return EXPERIENCES_DATA;
    }
  });

  const [contactData, setContactData] = useState<ContactDetails>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONTACT);
      if (stored) {
        return JSON.parse(stored);
      }
      return DEFAULT_CONTACT_DETAILS;
    } catch {
      return DEFAULT_CONTACT_DETAILS;
    }
  });

  // Sync state to localStorage on changes
  useEffect(() => {
    if (currentUser) {
      safeStorageSet(STORAGE_KEYS.USER, currentUser);
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [currentUser]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.ACCOUNTS, accounts);
  }, [accounts]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.PROFILE, profileData);
  }, [profileData]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.PROJECTS, projectsData);
  }, [projectsData]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.SKILLS, skillsData);
  }, [skillsData]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.EXPERIENCES, experiencesData);
  }, [experiencesData]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.CONTACT, contactData);
  }, [contactData]);

  // Automatically persist any base64 images from browser storage into physical files on disk
  useEffect(() => {
    const hasBase64Images = projectsData.some(
      (p) =>
        (p.imageBanner && p.imageBanner.startsWith('data:image/')) ||
        (Array.isArray(p.galleryImages) && p.galleryImages.some((img) => img && img.startsWith('data:image/')))
    );

    if (hasBase64Images) {
      console.log('[AutoSync] Found base64 images in storage, extracting to physical files in /public/projects/images/...');
      syncPortfolioDataToServer({
        profile: profileData,
        projects: projectsData,
        skills: skillsData,
        experiences: experiencesData,
        contact: contactData,
      })
        .then((res) => {
          if (res.success) {
            if (res.sanitizedProfile) {
              setProfileData(res.sanitizedProfile);
              safeStorageSet(STORAGE_KEYS.PROFILE, res.sanitizedProfile);
            }
            if (res.sanitizedProjects) {
              setProjectsData(res.sanitizedProjects);
              safeStorageSet(STORAGE_KEYS.PROJECTS, res.sanitizedProjects);
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  // Debounced auto-synchronization with backend files on every data modification
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      syncPortfolioDataToServer({
        profile: profileData,
        projects: projectsData,
        skills: skillsData,
        experiences: experiencesData,
        contact: contactData,
      })
        .then((res) => {
          if (res.success) {
            if (res.sanitizedProfile) {
              setProfileData(res.sanitizedProfile);
              safeStorageSet(STORAGE_KEYS.PROFILE, res.sanitizedProfile);
            }
            if (res.sanitizedProjects) {
              setProjectsData(res.sanitizedProjects);
              safeStorageSet(STORAGE_KEYS.PROJECTS, res.sanitizedProjects);
            }
          }
        })
        .catch((e) => {
          console.warn('[AutoSync] Background file sync warning:', e);
        });
    }, 1500);

    return () => clearTimeout(timer);
  }, [profileData, projectsData, skillsData, experiencesData, contactData]);

  const recordSaveTimestamp = useCallback(() => {
    const now = new Date();
    const formatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLastSavedTime(formatted);
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED, formatted);
    } catch {
      // ignore
    }
    return formatted;
  }, []);

  // Authentication Handlers
  const login = (username: string, password: string): { success: boolean; message: string } => {
    const trimmedUser = username.trim().toLowerCase();

    // Direct fast-path for admin login with simple password '123'
    if ((trimmedUser === 'admin' || trimmedUser === 'erfan') && (password === '123' || password === 'admin123')) {
      const adminAccount = accounts.find((a) => a.role === 'admin' || a.username.toLowerCase() === 'admin') || DEFAULT_ACCOUNTS[0];
      const authenticatedUser: User = {
        id: adminAccount.id,
        username: adminAccount.username,
        name: adminAccount.name,
        email: adminAccount.email,
        role: 'admin',
        avatarUrl: adminAccount.avatarUrl,
        joinedAt: adminAccount.joinedAt,
      };
      setCurrentUser(authenticatedUser);
      return { success: true, message: `خوش آمدید، ${adminAccount.name}!` };
    }

    const account = accounts.find((a) => a.username.toLowerCase() === trimmedUser);

    if (!account) {
      return { success: false, message: 'کاربری با این نام کاربری یافت نشد.' };
    }

    if (account.passwordHash !== password) {
      return { success: false, message: 'رمز عبور وارد شده نادرست است.' };
    }

    const authenticatedUser: User = {
      id: account.id,
      username: account.username,
      name: account.name,
      email: account.email,
      role: account.role,
      avatarUrl: account.avatarUrl,
      joinedAt: account.joinedAt,
    };
    setCurrentUser(authenticatedUser);
    return { success: true, message: `خوش آمدید، ${account.name}!` };
  };

  const register = (
    username: string,
    name: string,
    email: string,
    password: string
  ): { success: boolean; message: string } => {
    const trimmedUser = username.trim().toLowerCase();
    if (accounts.some((a) => a.username.toLowerCase() === trimmedUser)) {
      return { success: false, message: 'این نام کاربری قبلاً ثبت شده است.' };
    }

    const newAccount: RegisteredAccount = {
      id: `user-${Date.now()}`,
      username: trimmedUser,
      name: name.trim() || trimmedUser,
      email: email.trim(),
      role: 'user',
      joinedAt: new Date().toISOString().split('T')[0],
      passwordHash: password,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${trimmedUser}`,
    };

    setAccounts((prev) => {
      const next = [...prev, newAccount];
      safeStorageSet(STORAGE_KEYS.ACCOUNTS, next);
      return next;
    });

    const authenticatedUser: User = {
      id: newAccount.id,
      username: newAccount.username,
      name: newAccount.name,
      email: newAccount.email,
      role: newAccount.role,
      avatarUrl: newAccount.avatarUrl,
      joinedAt: newAccount.joinedAt,
    };
    setCurrentUser(authenticatedUser);

    return { success: true, message: 'حساب کاربری جدید با موفقیت ایجاد شد.' };
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAdminEditorOpen(false);
  };

  // Content Modification Functions (For Admin)
  const updateProfileData = (partial: Partial<ProfileInfo>) => {
    setProfileData((prev) => {
      const next = { ...prev, ...partial };
      safeStorageSet(STORAGE_KEYS.PROFILE, next);
      return next;
    });
    // Also sync email/location to contactData if changed
    if (partial.email || partial.location) {
      setContactData((prev) => {
        const nextContact = {
          ...prev,
          ...(partial.email ? { email: partial.email } : {}),
          ...(partial.location ? { location: partial.location } : {}),
        };
        safeStorageSet(STORAGE_KEYS.CONTACT, nextContact);
        return nextContact;
      });
    }
    recordSaveTimestamp();
  };

  const updateProject = (updated: Project) => {
    const nextProjects = (projectsData.length > 0 ? projectsData : [updated]).map((p) =>
      p.id === updated.id ? updated : p
    );
    if (!nextProjects.some((p) => p.id === updated.id)) {
      nextProjects.push(updated);
    }
    setProjectsData(nextProjects);
    safeStorageSet(STORAGE_KEYS.PROJECTS, nextProjects);

    // Immediately synchronize if the modal is currently open for this project
    setActiveProjectModal((prev) => (prev && prev.id === updated.id ? updated : prev));
    recordSaveTimestamp();

    // Auto-sync in background to server so JSON & TS files are immediately updated
    syncPortfolioDataToServer({
      profile: profileData,
      projects: nextProjects,
      skills: skillsData,
      experiences: experiencesData,
      contact: contactData,
    }).catch((e) => console.warn('[AutoSync] Background updateProject sync:', e));
  };

  const addProject = (newProject: Project) => {
    const nextProjects = [newProject, ...projectsData];
    setProjectsData(nextProjects);
    safeStorageSet(STORAGE_KEYS.PROJECTS, nextProjects);
    recordSaveTimestamp();

    syncPortfolioDataToServer({
      profile: profileData,
      projects: nextProjects,
      skills: skillsData,
      experiences: experiencesData,
      contact: contactData,
    }).catch((e) => console.warn('[AutoSync] Background addProject sync:', e));
  };

  const deleteProject = (id: string) => {
    const nextProjects = projectsData.filter((p) => p.id !== id);
    setProjectsData(nextProjects);
    safeStorageSet(STORAGE_KEYS.PROJECTS, nextProjects);
    recordSaveTimestamp();

    syncPortfolioDataToServer({
      profile: profileData,
      projects: nextProjects,
      skills: skillsData,
      experiences: experiencesData,
      contact: contactData,
    }).catch((e) => console.warn('[AutoSync] Background deleteProject sync:', e));
  };

  // Skills Data Handlers
  const updateSkillsData = (newSkills: SkillCategory[]) => {
    setSkillsData(newSkills);
    safeStorageSet(STORAGE_KEYS.SKILLS, newSkills);
    recordSaveTimestamp();
  };

  const addSkillCategory = (category: SkillCategory) => {
    setSkillsData((prev) => {
      const next = [...prev, category];
      safeStorageSet(STORAGE_KEYS.SKILLS, next);
      return next;
    });
    recordSaveTimestamp();
  };

  const deleteSkillCategory = (categoryId: string) => {
    setSkillsData((prev) => {
      const next = prev.filter((c) => c.id !== categoryId);
      safeStorageSet(STORAGE_KEYS.SKILLS, next);
      return next;
    });
    recordSaveTimestamp();
  };

  const addSkillItem = (categoryId: string, skill: SkillItem) => {
    setSkillsData((prev) => {
      const next = prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          skills: [...cat.skills, skill],
        };
      });
      safeStorageSet(STORAGE_KEYS.SKILLS, next);
      return next;
    });
    recordSaveTimestamp();
  };

  const deleteSkillItem = (categoryId: string, skillIndex: number) => {
    setSkillsData((prev) => {
      const next = prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        const newSkills = [...cat.skills];
        newSkills.splice(skillIndex, 1);
        return {
          ...cat,
          skills: newSkills,
        };
      });
      safeStorageSet(STORAGE_KEYS.SKILLS, next);
      return next;
    });
    recordSaveTimestamp();
  };

  // Experience / Timeline Handlers
  const updateExperience = (updated: ExperienceItem) => {
    setExperiencesData((prev) => {
      const next = prev.map((e) => (e.id === updated.id ? updated : e));
      safeStorageSet(STORAGE_KEYS.EXPERIENCES, next);
      return next;
    });
    recordSaveTimestamp();
  };

  const addExperience = (newExp: ExperienceItem) => {
    setExperiencesData((prev) => {
      const next = [newExp, ...prev];
      safeStorageSet(STORAGE_KEYS.EXPERIENCES, next);
      return next;
    });
    recordSaveTimestamp();
  };

  const deleteExperience = (id: string) => {
    setExperiencesData((prev) => {
      const next = prev.filter((e) => e.id !== id);
      safeStorageSet(STORAGE_KEYS.EXPERIENCES, next);
      return next;
    });
    recordSaveTimestamp();
  };

  // Contact Details & Social Links Handlers
  const updateContactData = (partial: Partial<ContactDetails>) => {
    setContactData((prev) => {
      const next = { ...prev, ...partial };
      safeStorageSet(STORAGE_KEYS.CONTACT, next);
      return next;
    });
    if (partial.email || partial.location) {
      setProfileData((prev) => {
        const nextProf = {
          ...prev,
          ...(partial.email ? { email: partial.email } : {}),
          ...(partial.location ? { location: partial.location } : {}),
        };
        safeStorageSet(STORAGE_KEYS.PROFILE, nextProf);
        return nextProf;
      });
    }
    recordSaveTimestamp();
  };

  const addSocialLink = (link: SocialLinkItem) => {
    setContactData((prev) => {
      const nextSocials = [...prev.socials, link];
      const next = { ...prev, socials: nextSocials };
      safeStorageSet(STORAGE_KEYS.CONTACT, next);
      return next;
    });
    setProfileData((prev) => {
      const nextSocials = [...(prev.socials || []), link];
      const next = { ...prev, socials: nextSocials };
      safeStorageSet(STORAGE_KEYS.PROFILE, next);
      return next;
    });
    recordSaveTimestamp();
  };

  const updateSocialLink = (id: string, linkUpdate: Partial<SocialLinkItem>) => {
    setContactData((prev) => {
      const nextSocials = prev.socials.map((s) => (s.id === id ? { ...s, ...linkUpdate } : s));
      const next = { ...prev, socials: nextSocials };
      safeStorageSet(STORAGE_KEYS.CONTACT, next);
      return next;
    });
    setProfileData((prev) => {
      const nextSocials = (prev.socials || []).map((s) => (s.id === id ? { ...s, ...linkUpdate } : s));
      const next = { ...prev, socials: nextSocials };
      safeStorageSet(STORAGE_KEYS.PROFILE, next);
      return next;
    });
    recordSaveTimestamp();
  };

  const deleteSocialLink = (id: string) => {
    setContactData((prev) => {
      const nextSocials = prev.socials.filter((s) => s.id !== id);
      const next = { ...prev, socials: nextSocials };
      safeStorageSet(STORAGE_KEYS.CONTACT, next);
      return next;
    });
    setProfileData((prev) => {
      const nextSocials = (prev.socials || []).filter((s) => s.id !== id);
      const next = { ...prev, socials: nextSocials };
      safeStorageSet(STORAGE_KEYS.PROFILE, next);
      return next;
    });
    recordSaveTimestamp();
  };

  // If static baked JSON exists in /data/portfolioData.json, load it and merge server project images with local state
  useEffect(() => {
    fetch(`/data/portfolioData.json?t=${Date.now()}`)
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (!data || !data.projects) return;

        const hasLocalProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        if (!hasLocalProjects) {
          if (data.profile) setProfileData(data.profile);
          if (data.projects) setProjectsData(data.projects);
          if (data.skills) setSkillsData(data.skills);
          if (data.experiences) setExperiencesData(data.experiences);
          if (data.contact) setContactData(data.contact);
          return;
        }

        // Merge any real server images into local project data so cached localStorage never overwrites real uploaded photos
        setProjectsData((prevProjects) => {
          let hasChanges = false;
          const merged = prevProjects.map((lp) => {
            const sp = data.projects.find((p: any) => p.id === lp.id);
            if (!sp) return lp;

            const updated = { ...lp };
            // If server project has a real image (starts with /projects/images/ or http) and local is gradient or empty, adopt server's
            if (sp.imageBanner && isRealImageSource(sp.imageBanner) && (!updated.imageBanner || !isRealImageSource(updated.imageBanner))) {
              updated.imageBanner = sp.imageBanner;
              hasChanges = true;
            }

            // Merge any gallery images from server not present in local
            if (Array.isArray(sp.galleryImages) && sp.galleryImages.length > 0) {
              const localGallery = Array.isArray(updated.galleryImages) ? updated.galleryImages : [];
              const combined = [...localGallery];
              for (const sImg of sp.galleryImages) {
                if (isRealImageSource(sImg) && !combined.includes(sImg)) {
                  combined.push(sImg);
                  hasChanges = true;
                }
              }
              if (combined.length > localGallery.length) {
                updated.galleryImages = combined;
              }
            }

            return updated;
          });

          if (hasChanges) {
            safeStorageSet(STORAGE_KEYS.PROJECTS, merged);
            return merged;
          }
          return prevProjects;
        });
      })
      .catch(() => {
        // Ignore if file doesn't exist yet
      });
  }, []);

  const saveAllChangesExplicitly = (): { success: boolean; timestamp: string } => {
    safeStorageSet(STORAGE_KEYS.PROFILE, profileData);
    safeStorageSet(STORAGE_KEYS.PROJECTS, projectsData);
    safeStorageSet(STORAGE_KEYS.SKILLS, skillsData);
    safeStorageSet(STORAGE_KEYS.EXPERIENCES, experiencesData);
    safeStorageSet(STORAGE_KEYS.CONTACT, contactData);
    if (currentUser) safeStorageSet(STORAGE_KEYS.USER, currentUser);

    const timestamp = recordSaveTimestamp();

    // Synchronize asynchronously with backend project files
    syncPortfolioDataToServer({
      profile: profileData,
      projects: projectsData,
      skills: skillsData,
      experiences: experiencesData,
      contact: contactData,
    }).catch((e) => console.warn('[AutoSync] Non-fatal sync to server file:', e));

    return { success: true, timestamp };
  };

  const bakeDataToProjectFiles = async (): Promise<{ success: boolean; message: string; filesUpdated?: string[] }> => {
    safeStorageSet(STORAGE_KEYS.PROFILE, profileData);
    safeStorageSet(STORAGE_KEYS.PROJECTS, projectsData);
    safeStorageSet(STORAGE_KEYS.SKILLS, skillsData);
    safeStorageSet(STORAGE_KEYS.EXPERIENCES, experiencesData);
    safeStorageSet(STORAGE_KEYS.CONTACT, contactData);
    recordSaveTimestamp();

    const result = await syncPortfolioDataToServer({
      profile: profileData,
      projects: projectsData,
      skills: skillsData,
      experiences: experiencesData,
      contact: contactData,
    });

    if (result.success) {
      if (result.sanitizedProfile) {
        setProfileData(result.sanitizedProfile);
        safeStorageSet(STORAGE_KEYS.PROFILE, result.sanitizedProfile);
      }
      if (result.sanitizedProjects) {
        setProjectsData(result.sanitizedProjects);
        safeStorageSet(STORAGE_KEYS.PROJECTS, result.sanitizedProjects);
      }
    }

    return result;
  };

  const downloadFullAssetsZip = async (onProgress?: (percent: number, msg: string) => void): Promise<void> => {
    await exportAssetsZipPackage(
      {
        profile: profileData,
        projects: projectsData,
        skills: skillsData,
        experiences: experiencesData,
        contact: contactData,
      },
      onProgress
    );
  };

  const downloadFullProjectZip = async (onProgress?: (percent: number, msg: string) => void): Promise<void> => {
    await exportFullProjectPackage(
      {
        profile: profileData,
        projects: projectsData,
        skills: skillsData,
        experiences: experiencesData,
        contact: contactData,
      },
      onProgress
    );
  };

  const exportTypeScriptSource = (): string => {
    return `// THIS FILE IS AUTOMATICALLY SYNCHRONIZED WITH YOUR PORTFOLIO SETTINGS & ASSETS
// Any changes saved in the Admin Studio are permanently baked into this file and /public/projects/images/

import { Project, SkillCategory, ExperienceItem, ProfileInfo, ContactDetails } from '../types';

export const PROFILE_DATA: ProfileInfo = ${JSON.stringify(profileData, null, 2)};

export const DEFAULT_CONTACT_DETAILS: ContactDetails = ${JSON.stringify(contactData, null, 2)};

export const SKILL_CATEGORIES: SkillCategory[] = ${JSON.stringify(skillsData, null, 2)};

export const PROJECTS_DATA: Project[] = ${JSON.stringify(projectsData, null, 2)};

export const EXPERIENCES_DATA: ExperienceItem[] = ${JSON.stringify(experiencesData, null, 2)};
`;
  };

  const resetAllToDefault = () => {
    setProfileData(PROFILE_DATA);
    setProjectsData(PROJECTS_DATA);
    setSkillsData(SKILL_CATEGORIES);
    setExperiencesData(EXPERIENCES_DATA);
    setContactData(DEFAULT_CONTACT_DETAILS);

    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.SKILLS);
    localStorage.removeItem(STORAGE_KEYS.EXPERIENCES);
    localStorage.removeItem(STORAGE_KEYS.CONTACT);
    recordSaveTimestamp();
  };

  const exportDataJSON = (): string => {
    return JSON.stringify(
      {
        profile: profileData,
        projects: projectsData,
        skills: skillsData,
        experiences: experiencesData,
        contact: contactData,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  };

  const importDataJSON = (jsonStr: string): { success: boolean; message: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.profile) {
        setProfileData(parsed.profile);
        safeStorageSet(STORAGE_KEYS.PROFILE, parsed.profile);
      }
      if (Array.isArray(parsed.projects)) {
        setProjectsData(parsed.projects);
        safeStorageSet(STORAGE_KEYS.PROJECTS, parsed.projects);
      }
      if (Array.isArray(parsed.skills)) {
        setSkillsData(parsed.skills);
        safeStorageSet(STORAGE_KEYS.SKILLS, parsed.skills);
      }
      if (Array.isArray(parsed.experiences)) {
        setExperiencesData(parsed.experiences);
        safeStorageSet(STORAGE_KEYS.EXPERIENCES, parsed.experiences);
      }
      if (parsed.contact) {
        setContactData(parsed.contact);
        safeStorageSet(STORAGE_KEYS.CONTACT, parsed.contact);
      }
      recordSaveTimestamp();
      return { success: true, message: 'داده‌ها با موفقیت بازخوانی و اعمال شدند.' };
    } catch {
      return { success: false, message: 'فرمت فایل JSON نامعتبر است.' };
    }
  };

  return (
    <PortfolioContext.Provider
      value={{
        currentUser,
        login,
        register,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        activeProjectModal,
        setActiveProjectModal,
        isAdminEditorOpen,
        setIsAdminEditorOpen,
        adminActiveTab,
        setAdminActiveTab,
        lastSavedTime,
        saveAllChangesExplicitly,
        profileData,
        updateProfileData,
        projectsData,
        updateProject,
        addProject,
        deleteProject,
        skillsData,
        updateSkillsData,
        addSkillCategory,
        deleteSkillCategory,
        addSkillItem,
        deleteSkillItem,
        experiencesData,
        updateExperience,
        addExperience,
        deleteExperience,
        contactData,
        updateContactData,
        addSocialLink,
        updateSocialLink,
        deleteSocialLink,
        resetAllToDefault,
        exportDataJSON,
        exportTypeScriptSource,
        importDataJSON,
        bakeDataToProjectFiles,
        downloadFullAssetsZip,
        downloadFullProjectZip,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = (): PortfolioContextType => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};
