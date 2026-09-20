import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sliders,
  User,
  Gamepad2,
  Cpu,
  Briefcase,
  Save,
  RotateCcw,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
  Download,
  Upload,
  Copy,
  Sparkles,
  Mail,
  Link as LinkIcon,
  Globe,
  MessageSquare,
  Twitter,
  FileDown,
  Layers,
  Check,
  Youtube,
  Images,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Hammer,
  FlaskConical,
  PlayCircle,
  Monitor,
  Smartphone,
  Laptop,
  Terminal,
  Glasses,
  Star,
  Calendar,
  Clock,
  Folder,
  HardDrive,
  FileCode,
  CheckCheck,
  Server,
  Package,
} from 'lucide-react';
import { GlassTheme, Project, SkillCategory, ExperienceItem, SocialLinkItem } from '../types';
import { usePortfolio, AdminTab } from '../context/PortfolioContext';
import { playGlassResonance } from '../utils/audio';
import { getYouTubeEmbedUrl } from '../utils/media';
import { getSkillLevelInfo, getSkillTagFromLevel } from '../utils/skills';
import { optimizeImageFile } from '../utils/imageOptimizer';
import { isRealImageSource } from '../utils/imageSource';
import {
  uploadProjectImageToFolder,
  fetchProjectImagesList,
  ProjectImageFile,
} from '../services/storageService';

const GREGORIAN_MONTHS = [
  { code: 'Jan', nameEn: 'January', nameFa: 'ژانویه (01)' },
  { code: 'Feb', nameEn: 'February', nameFa: 'فوریه (02)' },
  { code: 'Mar', nameEn: 'March', nameFa: 'مارس (03)' },
  { code: 'Apr', nameEn: 'April', nameFa: 'آوریل (04)' },
  { code: 'May', nameEn: 'May', nameFa: 'مه (05)' },
  { code: 'Jun', nameEn: 'June', nameFa: 'ژوئن (06)' },
  { code: 'Jul', nameEn: 'July', nameFa: 'ژوئیه (07)' },
  { code: 'Aug', nameEn: 'August', nameFa: 'اوت (08)' },
  { code: 'Sep', nameEn: 'September', nameFa: 'سپتامبر (09)' },
  { code: 'Oct', nameEn: 'October', nameFa: 'اکتبر (10)' },
  { code: 'Nov', nameEn: 'November', nameFa: 'نوامبر (11)' },
  { code: 'Dec', nameEn: 'December', nameFa: 'دسامبر (12)' },
];

const GREGORIAN_YEARS = [2030, 2029, 2028, 2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

interface AdminEditorModalProps {
  theme: GlassTheme;
  blurLevel: number;
  isMuted: boolean;
}

export const AdminEditorModal: React.FC<AdminEditorModalProps> = ({
  theme,
  blurLevel,
  isMuted,
}) => {
  const {
    currentUser,
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
  } = usePortfolio();

  // Local draft states
  const [draftProfile, setDraftProfile] = useState(profileData);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectsData[0]?.id || '');
  const [saveAlert, setSaveAlert] = useState<string | null>(null);
  const [jsonImportText, setJsonImportText] = useState('');
  const [copiedJSON, setCopiedJSON] = useState(false);

  // Dedicated project image folder & permanent baking states
  const [isBaking, setIsBaking] = useState(false);
  const [bakeResult, setBakeResult] = useState<{ success: boolean; message: string; filesUpdated?: string[] } | null>(null);
  const [projectImagesList, setProjectImagesList] = useState<ProjectImageFile[]>([]);
  const [loadingImagesList, setLoadingImagesList] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string>('');
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipProgressMsg, setZipProgressMsg] = useState('');
  const [isExportingFullProject, setIsExportingFullProject] = useState(false);
  const [fullProjectProgressMsg, setFullProjectProgressMsg] = useState('');
  const [showDirectDownloadHelp, setShowDirectDownloadHelp] = useState(false);

  // New experience form toggle
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [newExpForm, setNewExpForm] = useState({
    role: '',
    organization: '',
    period: '',
    type: 'Full-Time',
    description: '',
  });

  // New skill category form toggle
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Reliable inline confirmation states (replaces blocked browser confirm() in iframe)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmFactoryReset, setConfirmFactoryReset] = useState(false);

  // Gallery and media management states & refs (must be top-level before early return)
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCoverUrlInput, setNewCoverUrlInput] = useState('');
  const [isEditingCoverUrl, setIsEditingCoverUrl] = useState(false);
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [replacingGalleryIndex, setReplacingGalleryIndex] = useState<number | null>(null);

  // Status and platform custom input states
  const [customPlatformInput, setCustomPlatformInput] = useState('');
  const [customStatusInput, setCustomStatusInput] = useState('');
  const [isCustomStatusOpen, setIsCustomStatusOpen] = useState(false);

  // Folder images transfer and server image selector states
  const [folderTargetProjectId, setFolderTargetProjectId] = useState<string>(selectedProjectId || projectsData[0]?.id || '');
  const [folderImageFilter, setFolderImageFilter] = useState<'all' | 'not_in_gallery' | 'in_gallery'>('all');
  const [showServerImagesPickerInGallery, setShowServerImagesPickerInGallery] = useState(false);

  // Keep folderTargetProjectId in sync with selected project if not explicitly set
  useEffect(() => {
    if (selectedProjectId) {
      setFolderTargetProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Refresh physically stored images list
  const refreshImagesList = useCallback(async () => {
    setLoadingImagesList(true);
    try {
      const files = await fetchProjectImagesList();
      if (Array.isArray(files)) {
        setProjectImagesList(files);
      }
    } catch {
      // ignore
    } finally {
      setLoadingImagesList(false);
    }
  }, []);

  useEffect(() => {
    if (isAdminEditorOpen && currentUser?.role === 'admin' && (adminActiveTab === 'backup' || adminActiveTab === 'projects')) {
      refreshImagesList();
    }
  }, [isAdminEditorOpen, currentUser?.role, adminActiveTab, refreshImagesList]);

  const showNotification = (msg: string) => {
    setSaveAlert(msg);
    setTimeout(() => setSaveAlert(null), 3500);
  };

  const handleDeleteProject = (projectId: string) => {
    const remaining = projectsData.filter((p) => p.id !== projectId);
    deleteProject(projectId);
    if (remaining.length > 0) {
      setSelectedProjectId(remaining[0].id);
    }
    setConfirmDeleteId(null);
    playGlassResonance(300, isMuted);
    showNotification('پروژه با موفقیت حذف شد.');
  };

  const handleDeleteSkillCategory = (categoryId: string, catName: string) => {
    deleteSkillCategory(categoryId);
    setConfirmDeleteId(null);
    playGlassResonance(300, isMuted);
    showNotification(`دسته‌بندی "${catName}" و مهارت‌های آن حذف شدند.`);
  };

  const handleDeleteExperience = (expId: string) => {
    deleteExperience(expId);
    setConfirmDeleteId(null);
    playGlassResonance(300, isMuted);
    showNotification('سابقه کاری با موفقیت حذف شد.');
  };

  const handleDeleteSocialLink = (linkId: string) => {
    deleteSocialLink(linkId);
    setConfirmDeleteId(null);
    playGlassResonance(300, isMuted);
    showNotification('لینک ارتباطی با موفقیت حذف شد.');
  };

  const handleFactoryReset = () => {
    resetAllToDefault();
    setDraftProfile(profileData);
    setConfirmFactoryReset(false);
    playGlassResonance(450, isMuted);
    showNotification('تمامی متون و ساختار به تنظیمات اولیه بازنشانی شدند.');
  };

  const handleManualSaveAll = () => {
    const res = saveAllChangesExplicitly();
    playGlassResonance(750, isMuted);
    showNotification(`تمامی تغییرات با موفقیت ذخیره و پایدار شدند! (${res.timestamp})`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileData(draftProfile);
    playGlassResonance(650, isMuted);
    showNotification('جزییات مشخصات و بیوگرافی ذخیره شد!');
  };

  const handleUpdateStat = (index: number, field: 'label' | 'value', value: string) => {
    const updatedStats = [...draftProfile.stats];
    updatedStats[index] = { ...updatedStats[index], [field]: value };
    setDraftProfile((prev) => ({ ...prev, stats: updatedStats }));
  };

  const handleAddNewProject = () => {
    const newId = `custom-proj-${Date.now()}`;
    const newProj: Project = {
      id: newId,
      title: 'پروژه جدید یونیتی',
      shortDescription: 'توضیحات مختصر در مورد گیم‌پلی و شیدرها.',
      fullDescription: 'شرح جامع سیستم‌های توسعه‌یافته، پترن‌های معماری، پروفایلینگ و ویژگی‌های برجسته.',
      category: 'unity',
      engine: 'Unity 2022.3 (URP)',
      status: 'In Development',
      platform: ['PC / Windows'],
      technologies: ['Unity', 'C#', 'HLSL'],
      features: ['معماری شی‌گرا و ماژولار', 'سیستم نورپردازی سفارشی'],
      imageBanner: 'radial-gradient(135deg, rgba(225, 29, 72, 0.45) 0%, rgba(15, 23, 42, 0.8) 100%)',
      youtubeUrl: '',
      galleryImages: [],
    };
    addProject(newProj);
    setSelectedProjectId(newId);
    playGlassResonance(620, isMuted);
    showNotification('پروژه جدید با موفقیت افزوده شد.');
  };

  const handleSaveSkillItem = (catIndex: number, skillIndex: number, updatedSkill: { name: string; level: number; tag: string }) => {
    const updatedCats = [...skillsData];
    updatedCats[catIndex].skills[skillIndex] = updatedSkill;
    updateSkillsData(updatedCats);
    playGlassResonance(600, isMuted);
  };

  const handleCreateNewCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: SkillCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      icon: 'Cpu',
      description: newCatDesc.trim() || 'مهارت‌ها و فناوری‌های این شاخه',
      skills: [
        { name: 'مهارت جدید نمونه', level: 85, tag: getSkillTagFromLevel(85) },
      ],
    };
    addSkillCategory(newCat);
    setNewCatName('');
    setNewCatDesc('');
    setIsAddingCategory(false);
    playGlassResonance(650, isMuted);
    showNotification(`دسته‌بندی جدید "${newCat.name}" اضافه شد.`);
  };

  const handleCreateNewExperience = () => {
    if (!newExpForm.role.trim() || !newExpForm.organization.trim()) {
      showNotification('لطفاً عنوان سمت و سازمان را وارد کنید.');
      return;
    }
    const newExp: ExperienceItem = {
      id: `exp-${Date.now()}`,
      role: newExpForm.role.trim(),
      organization: newExpForm.organization.trim(),
      period: newExpForm.period.trim() || '2024 — Present',
      type: newExpForm.type || 'Full-Time',
      description: newExpForm.description.trim() || 'شرح وظایف و سیستم‌های توسعه داده شده.',
      achievements: ['توسعه مکانیک‌های گیم‌پلی', 'بهینه‌سازی معماری کد'],
      technologies: ['Unity', 'C#'],
    };
    addExperience(newExp);
    setNewExpForm({ role: '', organization: '', period: '', type: 'Full-Time', description: '' });
    setIsAddingExperience(false);
    playGlassResonance(650, isMuted);
    showNotification('سابقه کاری جدید با موفقیت به تایم‌لاین اضافه شد.');
  };

  const handleAddNewSocialLink = () => {
    const newLink: SocialLinkItem = {
      id: `social-${Date.now()}`,
      name: 'شبکه جدید',
      url: 'https://',
      icon: 'Globe',
    };
    addSocialLink(newLink);
    playGlassResonance(620, isMuted);
    showNotification('لینک ارتباطی جدید افزوده شد.');
  };

  const handleExport = () => {
    const jsonStr = exportDataJSON();
    navigator.clipboard.writeText(jsonStr);
    setCopiedJSON(true);
    playGlassResonance(680, isMuted);
    setTimeout(() => setCopiedJSON(false), 2500);
    showNotification('کد JSON با موفقیت به کلیپ‌بورد کپی شد!');
  };

  const handleDownloadBackupFile = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `erfan-portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    playGlassResonance(700, isMuted);
    showNotification('فایل پشتیبان JSON دانلود شد.');
  };

  const handleImport = () => {
    if (!jsonImportText.trim()) return;
    const res = importDataJSON(jsonImportText);
    if (res.success) {
      setDraftProfile(profileData);
      playGlassResonance(650, isMuted);
      showNotification('داده‌ها با موفقیت اعمال و ذخیره شدند.');
      setJsonImportText('');
    } else {
      playGlassResonance(300, isMuted);
      showNotification('خطا: متن JSON وارد شده معتبر نیست.');
    }
  };

  const currentProject = projectsData.find((p) => p.id === selectedProjectId) || projectsData[0];

  // Active cover: imageBanner if valid real image, OR first valid image from gallery
  const activeCoverImage =
    (currentProject?.imageBanner && isRealImageSource(currentProject.imageBanner))
      ? currentProject.imageBanner
      : (currentProject?.galleryImages && currentProject.galleryImages.length > 0 && isRealImageSource(currentProject.galleryImages[0]))
        ? currentProject.galleryImages[0]
        : null;

  // Trigger baking of all current data into project files
  const handleBakeToProjectFiles = async () => {
    setIsBaking(true);
    try {
      const res = await bakeDataToProjectFiles();
      setBakeResult(res);
      playGlassResonance(750, isMuted);
      if (res.success) {
        showNotification('تغییرات با موفقیت در سورس‌کد و فایل JSON پروژه تثبیت شدند!');
        refreshImagesList();
      } else {
        showNotification(res.message);
      }
    } catch (err: any) {
      showNotification(err?.message || 'خطا در ثبت فایل‌های پروژه');
    } finally {
      setIsBaking(false);
    }
  };

  // Download TypeScript source file for offline manual replacement
  const handleDownloadTsSource = () => {
    const tsCode = exportTypeScriptSource();
    const blob = new Blob([tsCode], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'portfolioData.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    playGlassResonance(650, isMuted);
    showNotification('فایل سورس portfolioData.ts دانلود شد.');
  };

  // Download COMPLETE ready-to-run project source code ZIP (all code + images + configs)
  const handleDownloadFullProject = async () => {
    setIsExportingFullProject(true);
    setFullProjectProgressMsg('در حال آماده‌سازی و ارسال بسته سورس کامل...');
    setShowDirectDownloadHelp(true);
    try {
      await downloadFullProjectZip((percent, msg) => {
        setFullProjectProgressMsg(`${msg}`);
      });
      playGlassResonance(800, isMuted);
      showNotification('دانلود سورس کامل پروژه با موفقیت آغاز شد!');
    } catch (err: any) {
      showNotification('خطا: ' + (err?.message || 'دریافت فایل انجام نشد'));
    } finally {
      setTimeout(() => {
        setIsExportingFullProject(false);
        setFullProjectProgressMsg('');
      }, 2500);
    }
  };

  // Download complete ZIP package containing all project images, JSON, and TS source
  const handleDownloadAssetsZip = async () => {
    setIsExportingZip(true);
    setZipProgressMsg('در حال ارسال بسته دارایی‌ها...');
    setShowDirectDownloadHelp(true);
    try {
      await downloadFullAssetsZip((percent, msg) => {
        setZipProgressMsg(`${msg}`);
      });
      playGlassResonance(800, isMuted);
      showNotification('بسته کامل تصاویر و داده‌های پروژه آماده دانلود شد!');
    } catch (err: any) {
      showNotification('خطا در دانلود فایل: ' + (err?.message || 'نامشخص'));
    } finally {
      setTimeout(() => {
        setIsExportingZip(false);
        setZipProgressMsg('');
      }, 2500);
    }
  };

  // Transfer any stored server image from public/projects/images/ directly into a project's gallery
  const handleTransferImageToProjectGallery = (imgUrl: string, targetProjId: string, setAsCover = false) => {
    const targetProj = projectsData.find((p) => p.id === targetProjId);
    if (!targetProj) {
      showNotification('پروژه مقصد یافت نشد.');
      return;
    }
    const existingGallery = Array.isArray(targetProj.galleryImages) ? targetProj.galleryImages : [];
    
    let updatedGallery: string[];
    let updatedBanner = targetProj.imageBanner;

    if (setAsCover) {
      updatedBanner = imgUrl;
      updatedGallery = [imgUrl, ...existingGallery.filter((img) => img !== imgUrl)];
    } else {
      updatedGallery = existingGallery.includes(imgUrl) ? existingGallery : [...existingGallery, imgUrl];
      if (!updatedBanner || !isRealImageSource(updatedBanner)) {
        updatedBanner = imgUrl;
      }
    }

    updateProject({
      ...targetProj,
      imageBanner: updatedBanner,
      galleryImages: updatedGallery,
    });

    playGlassResonance(650, isMuted);
    const actionText = setAsCover ? 'به عنوان کاور اصلی' : 'به گالری تصاویر';
    showNotification(`تصویر با موفقیت ${actionText} پروژه «${targetProj.title}» اضافه شد.`);
  };

  // Remove an image from a project's gallery
  const handleRemoveImageFromProjectGallery = (imgUrl: string, targetProjId: string) => {
    const targetProj = projectsData.find((p) => p.id === targetProjId);
    if (!targetProj) return;
    const existingGallery = Array.isArray(targetProj.galleryImages) ? targetProj.galleryImages : [];
    const updatedGallery = existingGallery.filter((img) => img !== imgUrl);
    const wasCover = targetProj.imageBanner === imgUrl;
    const newBanner = wasCover ? (updatedGallery[0] || '') : targetProj.imageBanner;

    updateProject({
      ...targetProj,
      galleryImages: updatedGallery,
      imageBanner: newBanner,
    });

    playGlassResonance(400, isMuted);
    showNotification(`تصویر از گالری پروژه «${targetProj.title}» برداشته شد.`);
  };

  // Batch transfer all images in public/projects/images/ into a project's gallery
  const handleTransferAllImagesToProject = (targetProjId: string) => {
    const targetProj = projectsData.find((p) => p.id === targetProjId);
    if (!targetProj) return;
    const existingGallery = Array.isArray(targetProj.galleryImages) ? targetProj.galleryImages : [];
    const newImages = projectImagesList.map((f) => f.url).filter((url) => !existingGallery.includes(url));

    if (newImages.length === 0) {
      showNotification('همه تصاویر این پوشه هم‌اکنون در گالری این پروژه موجود هستند.');
      return;
    }

    const updatedGallery = [...existingGallery, ...newImages];
    const updatedBanner = (!targetProj.imageBanner || !isRealImageSource(targetProj.imageBanner)) ? updatedGallery[0] : targetProj.imageBanner;

    updateProject({
      ...targetProj,
      galleryImages: updatedGallery,
      imageBanner: updatedBanner,
    });

    playGlassResonance(700, isMuted);
    showNotification(`تعداد ${newImages.length} تصویر با موفقیت به گالری پروژه «${targetProj.title}» اضافه شد.`);
  };

  // Handle Cover Image Upload from PC with direct upload to project image folder
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProject) return;
    try {
      setIsOptimizingImage(true);
      setUploadProgressMsg('در حال بارگذاری و ذخیره در پوشه اختصاصی تصاویر پروژه...');
      const savedPath = await uploadProjectImageToFolder(file, currentProject.id);
      const existing = Array.isArray(currentProject.galleryImages) ? currentProject.galleryImages : [];
      const updatedGallery = [savedPath, ...existing.filter((img) => img !== savedPath)];
      updateProject({
        ...currentProject,
        imageBanner: savedPath,
        galleryImages: updatedGallery,
      });
      playGlassResonance(600, isMuted);
      showNotification('تصویر کاور پروژه در پوشه اختصاصی ذخیره و ثبت شد.');
      refreshImagesList();
    } catch (err: any) {
      showNotification(err?.message || 'خطا در بارگذاری تصویر کاور');
    } finally {
      setIsOptimizingImage(false);
      setUploadProgressMsg('');
      e.target.value = '';
    }
  };

  // Handle Cover Image via URL
  const handleSetCoverUrl = (url: string) => {
    if (!url.trim() || !currentProject) return;
    const cleanUrl = url.trim();
    const existing = currentProject.galleryImages || [];
    const updatedGallery = [cleanUrl, ...existing.filter((img) => img !== activeCoverImage && img !== cleanUrl)];
    updateProject({
      ...currentProject,
      imageBanner: cleanUrl,
      galleryImages: updatedGallery,
    });
    setNewCoverUrlInput('');
    setIsEditingCoverUrl(false);
    playGlassResonance(600, isMuted);
    showNotification('تصویر کاور اصلی پروژه با موفقیت تنظیم شد.');
  };

  // Handle Removing the Cover Image
  const handleRemoveCover = () => {
    if (!currentProject) return;
    const defaultGradient = 'radial-gradient(135deg, rgba(225, 29, 72, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)';
    const existing = currentProject.galleryImages || [];
    const updatedGallery = activeCoverImage ? existing.filter((img) => img !== activeCoverImage) : existing;

    updateProject({
      ...currentProject,
      imageBanner: defaultGradient,
      galleryImages: updatedGallery,
    });
    playGlassResonance(300, isMuted);
    showNotification('تصویر کاور پروژه حذف شد و به پس‌زمینه رنگی پیش‌فرض برگشت.');
  };

  // Set an existing gallery image as the main cover
  const handleSetAsCover = (imgUrl: string) => {
    if (!currentProject) return;
    const existing = currentProject.galleryImages || [];
    const remaining = existing.filter((item) => item !== imgUrl);
    const reordered = [imgUrl, ...remaining];
    updateProject({
      ...currentProject,
      imageBanner: imgUrl,
      galleryImages: reordered,
    });
    playGlassResonance(600, isMuted);
    showNotification('این تصویر به عنوان کاور و بنر اصلی پروژه تنظیم شد.');
  };

  // Add new image(s) to gallery via file upload to project folder
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !currentProject) return;
    const files = Array.from(fileList);
    try {
      setIsOptimizingImage(true);
      const savedPaths: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressMsg(
          files.length > 1
            ? `در حال ذخیره تصویر ${i + 1} از ${files.length} (${file.name})...`
            : `در حال انتقال تصویر به پوشه تصاویر پروژه (${file.name})...`
        );
        const savedPath = await uploadProjectImageToFolder(file, currentProject.id);
        if (savedPath && isRealImageSource(savedPath)) {
          savedPaths.push(savedPath);
        }
      }

      if (savedPaths.length > 0) {
        const existing = Array.isArray(currentProject.galleryImages) ? currentProject.galleryImages : [];
        const newItems = savedPaths.filter((p) => !existing.includes(p));
        const updatedGallery = [...existing, ...newItems];
        const needsCover = !currentProject.imageBanner || !isRealImageSource(currentProject.imageBanner);
        const updatedBanner = needsCover ? savedPaths[0] : currentProject.imageBanner;

        updateProject({
          ...currentProject,
          galleryImages: updatedGallery,
          imageBanner: updatedBanner,
        });

        playGlassResonance(600, isMuted);
        showNotification(
          savedPaths.length === 1
            ? 'تصویر جدید با موفقیت به گالری پروژه اضافه شد.'
            : `تعداد ${savedPaths.length} تصویر با موفقیت به گالری پروژه اضافه شد.`
        );
        refreshImagesList();
      }
    } catch (err: any) {
      showNotification(err?.message || 'خطا در بارگذاری تصویر');
    } finally {
      setIsOptimizingImage(false);
      setUploadProgressMsg('');
      e.target.value = '';
    }
  };

  // Add new image to gallery via URL
  const handleAddImageUrl = () => {
    if (!newImageUrl.trim() || !currentProject) return;
    const clean = newImageUrl.trim();
    const existing = currentProject.galleryImages || [];
    const isFirst = existing.length === 0 && !activeCoverImage;
    updateProject({
      ...currentProject,
      galleryImages: [...existing, clean],
      imageBanner: isFirst ? clean : currentProject.imageBanner,
    });
    setNewImageUrl('');
    playGlassResonance(600, isMuted);
    showNotification('تصویر جدید به گالری پروژه افزوده شد.');
  };

  // Replace a specific gallery image with upload to project folder
  const handleReplaceGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProject || replacingGalleryIndex === null) return;
    try {
      setIsOptimizingImage(true);
      setUploadProgressMsg('در حال جایگزینی تصویر در پوشه تصاویر پروژه...');
      const savedPath = await uploadProjectImageToFolder(file, currentProject.id);
      const existing = [...(currentProject.galleryImages || [])];
      const oldImg = existing[replacingGalleryIndex];
      existing[replacingGalleryIndex] = savedPath;

      const newBanner = currentProject.imageBanner === oldImg ? savedPath : currentProject.imageBanner;
      updateProject({
        ...currentProject,
        galleryImages: existing,
        imageBanner: newBanner,
      });
      playGlassResonance(600, isMuted);
      showNotification('تصویر در پوشه پروژه جایگزین شد.');
      refreshImagesList();
    } catch (err: any) {
      showNotification(err?.message || 'خطا در جایگزینی تصویر');
    } finally {
      setIsOptimizingImage(false);
      setUploadProgressMsg('');
      setReplacingGalleryIndex(null);
      e.target.value = '';
    }
  };

  // Remove a specific image from gallery
  const handleRemoveGalleryImage = (indexToRemove: number) => {
    if (!currentProject) return;
    const existing = currentProject.galleryImages || [];
    const removedImg = existing[indexToRemove];
    const updated = existing.filter((_, idx) => idx !== indexToRemove);

    let newBanner = currentProject.imageBanner;
    if (newBanner === removedImg) {
      newBanner = updated.length > 0 && (updated[0].startsWith('http') || updated[0].startsWith('data:'))
        ? updated[0]
        : 'radial-gradient(135deg, rgba(225, 29, 72, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)';
    }

    updateProject({
      ...currentProject,
      galleryImages: updated,
      imageBanner: newBanner,
    });
    playGlassResonance(300, isMuted);
    showNotification('تصویر از گالری پروژه حذف شد.');
  };

  return (
    <AnimatePresence>
      {isAdminEditorOpen && currentUser?.role === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Optical Blur Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsAdminEditorOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        />

        {/* Modal Main Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            backdropFilter: `blur(${blurLevel}px) saturate(180%)`,
            WebkitBackdropFilter: `blur(${blurLevel}px) saturate(180%)`,
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            borderColor: theme.cardStyles.border,
          }}
          className="relative w-full max-w-5xl max-h-[92vh] rounded-3xl p-5 sm:p-7 glass-specular-border shadow-2xl z-10 overflow-hidden border border-white/20 flex flex-col"
        >
          {/* Top Edge Ambient Highlight */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px] opacity-80 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${theme.cardStyles.highlight} 50%, transparent 100%)`,
            }}
          />

          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/15 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 shadow-inner shrink-0">
                <Sliders size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    استودیوی مدیریت محتوا و متون سایت
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                    دسترسی ادمین (Full Access)
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  تغییر مستقیم متن‌ها، پروژه‌ها، مهارت‌ها، سوابق و بخش تماس با ذخیره‌سازی دائمی
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleManualSaveAll}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-100 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="ذخیره دستی و تثبیت در حافظه مرورگر"
              >
                <Save size={14} />
                <span>ذخیره دائمی همه تغییرات</span>
              </button>

              <button
                onClick={() => setIsAdminEditorOpen(false)}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/15 cursor-pointer"
                title="بستن پنل"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Alert / Notification Banner */}
          {saveAlert && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm font-medium flex items-center gap-2 shrink-0"
            >
              <CheckCircle2 size={16} />
              <span>{saveAlert}</span>
            </motion.div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/10 overflow-x-auto scrollbar-none mb-5 shrink-0">
            <button
              onClick={() => setAdminActiveTab('profile')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                adminActiveTab === 'profile'
                  ? 'bg-white/25 text-white border border-white/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <User size={15} />
              <span>پروفایل و مشخصات</span>
            </button>

            <button
              onClick={() => setAdminActiveTab('projects')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                adminActiveTab === 'projects'
                  ? 'bg-white/25 text-white border border-white/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Gamepad2 size={15} />
              <span>پروژه‌ها ({projectsData.length})</span>
            </button>

            <button
              onClick={() => setAdminActiveTab('skills')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                adminActiveTab === 'skills'
                  ? 'bg-white/25 text-white border border-white/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Cpu size={15} />
              <span>مهارت‌ها و تب‌ها ({skillsData.length})</span>
            </button>

            <button
              onClick={() => setAdminActiveTab('experience')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                adminActiveTab === 'experience'
                  ? 'bg-white/25 text-white border border-white/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Briefcase size={15} />
              <span>تایم‌لاین و سوابق ({experiencesData.length})</span>
            </button>

            <button
              onClick={() => setAdminActiveTab('contact')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                adminActiveTab === 'contact'
                  ? 'bg-white/25 text-white border border-white/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Mail size={15} />
              <span>ارتباط و لینک‌ها ({contactData.socials?.length || 0})</span>
            </button>

            <button
              onClick={() => setAdminActiveTab('backup')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                adminActiveTab === 'backup'
                  ? 'bg-white/25 text-white border border-white/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Download size={15} />
              <span>پشتیبان‌گیری و ریست</span>
            </button>
          </div>

          {/* Main Tab Content Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {/* TAB 1: PROFILE EDIT */}
            {adminActiveTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                      نام کامل (Full Name)
                    </label>
                    <input
                      type="text"
                      value={draftProfile.name}
                      onChange={(e) => setDraftProfile({ ...draftProfile, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                      عنوان تخصصی (Professional Title)
                    </label>
                    <input
                      type="text"
                      value={draftProfile.title}
                      onChange={(e) => setDraftProfile({ ...draftProfile, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                    شعار و تگ‌لاین (Hero Tagline)
                  </label>
                  <input
                    type="text"
                    value={draftProfile.tagline}
                    onChange={(e) => setDraftProfile({ ...draftProfile, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                    بیوگرافی کامل و شرح تخصص (Bio / About)
                  </label>
                  <textarea
                    rows={4}
                    value={draftProfile.bio}
                    onChange={(e) => setDraftProfile({ ...draftProfile, bio: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-white/40 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                      ایمیل رسمی (Email)
                    </label>
                    <input
                      type="email"
                      value={draftProfile.email}
                      onChange={(e) => setDraftProfile({ ...draftProfile, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono font-medium text-slate-300 block mb-1.5">
                      موقعیت مکانی (Location)
                    </label>
                    <input
                      type="text"
                      value={draftProfile.location}
                      onChange={(e) => setDraftProfile({ ...draftProfile, location: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/20 text-sm text-white focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>

                {/* Stat Counters */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/15 space-y-3">
                  <h4 className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
                    آمارهای کلیدی کارت اصلی (Stats)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {draftProfile.stats.map((stat, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-1">
                        <input
                          type="text"
                          value={stat.value}
                          onChange={(e) => handleUpdateStat(idx, 'value', e.target.value)}
                          className="w-full px-2 py-1 rounded bg-black/40 border border-white/15 text-sm font-mono text-white"
                          placeholder="مقدار مثلا 5+"
                        />
                        <input
                          type="text"
                          value={stat.label}
                          onChange={(e) => handleUpdateStat(idx, 'label', e.target.value)}
                          className="w-full px-2 py-1 rounded bg-black/40 border border-white/15 text-[11px] text-slate-300"
                          placeholder="عنوان"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm flex items-center gap-2 border border-white/25 transition-all shadow-md cursor-pointer"
                  >
                    <Save size={16} />
                    <span>ذخیره تغییرات پروفایل</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: PROJECTS EDIT */}
            {adminActiveTab === 'projects' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-300">
                    انتخاب، ویرایش یا افزودن پروژه‌های به نمایش درآمده:
                  </p>
                  <button
                    onClick={handleAddNewProject}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/40 transition-all cursor-pointer shrink-0"
                  >
                    <Plus size={14} />
                    <span>افزودن پروژه جدید</span>
                  </button>
                </div>

                {/* Project Selector Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {projectsData.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                        p.id === currentProject?.id
                          ? 'bg-white/25 text-white border-white/30 shadow-sm'
                          : 'bg-black/30 text-slate-300 border-white/10 hover:text-white'
                      }`}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>

                {currentProject && (
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/15 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Edit3 size={15} className={theme.accentClass.icon} />
                        <span>ویرایش مشخصات: {currentProject.title}</span>
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleManualSaveAll}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:text-emerald-100 hover:bg-emerald-500/30 transition-colors border border-emerald-500/30 flex items-center gap-1.5 text-xs cursor-pointer font-medium"
                          title="ذخیره و ثبت تغییرات این پروژه در سرور و فایل‌ها"
                        >
                          <Save size={14} />
                          <span>ذخیره تغییرات پروژه</span>
                        </button>
                        {confirmDeleteId === currentProject.id ? (
                          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-rose-950/80 border border-rose-500/40">
                            <span className="text-[11px] text-rose-200 font-medium px-1">حذف قطعی این پروژه؟</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteProject(currentProject.id)}
                              className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors shadow"
                            >
                              بله، حذف کن
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 text-xs cursor-pointer transition-colors"
                            >
                              انصراف
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(currentProject.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 hover:text-rose-100 hover:bg-rose-500/25 transition-colors border border-rose-500/20 flex items-center gap-1.5 text-xs cursor-pointer font-medium"
                            title="حذف کامل پروژه"
                          >
                            <Trash2 size={13} />
                            <span>حذف کامل</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-mono font-medium text-slate-300 block mb-1">
                          عنوان پروژه
                        </label>
                        <input
                          type="text"
                          value={currentProject.title}
                          onChange={(e) => updateProject({ ...currentProject, title: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono font-medium text-slate-300 block mb-1">
                          موتور و ران‌تایم
                        </label>
                        <input
                          type="text"
                          value={currentProject.engine}
                          onChange={(e) => updateProject({ ...currentProject, engine: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-mono font-medium text-slate-300 block mb-1">
                          دسته‌بندی (Category)
                        </label>
                        <select
                          value={currentProject.category}
                          onChange={(e) => updateProject({ ...currentProject, category: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-xs text-white"
                        >
                          <option value="unity">Unity Games</option>
                          <option value="graphics">Shaders & VFX</option>
                          <option value="systems">DOTS & Systems</option>
                          <option value="other">Other (سایر پروژه‌ها)</option>
                        </select>
                      </div>
                    </div>

                    {/* PROJECT STATUS SELECTION (وضعیت و فاز توسعه پروژه) */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/15 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <label className="text-xs font-mono font-semibold text-white flex items-center gap-1.5">
                            <Hammer size={15} className={theme.accentClass.icon} />
                            <span>وضعیت و فاز توسعه پروژه (Project Status)</span>
                          </label>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            نشان فاز پروژه در گوشه بالای کارت پروژه و در پنجره جزئیات نمایش داده می‌شود.
                          </p>
                        </div>
                        {/* Current Status Badge Indicator */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-mono">وضعیت انتخاب شده:</span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-white/15 text-white border border-white/20 shadow-sm">
                            {currentProject.status || 'In Development'}
                          </span>
                        </div>
                      </div>

                      {/* Status Preset Options */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                        {[
                          {
                            id: 'In Development',
                            labelFa: 'در حال توسعه',
                            labelEn: 'In Development',
                            icon: Hammer,
                            color: 'border-amber-500/60 bg-amber-500/20 text-amber-300 ring-amber-500/30',
                            inactiveColor: 'border-white/10 bg-black/30 hover:border-amber-500/30 hover:bg-amber-500/10 text-slate-300',
                          },
                          {
                            id: 'Completed',
                            labelFa: 'تکمیل و نهایی شده',
                            labelEn: 'Completed',
                            icon: CheckCircle2,
                            color: 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 ring-emerald-500/30',
                            inactiveColor: 'border-white/10 bg-black/30 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-slate-300',
                          },
                          {
                            id: 'Prototype',
                            labelFa: 'نمونه اولیه (پروتوتایپ)',
                            labelEn: 'Prototype',
                            icon: FlaskConical,
                            color: 'border-purple-500/60 bg-purple-500/20 text-purple-300 ring-purple-500/30',
                            inactiveColor: 'border-white/10 bg-black/30 hover:border-purple-500/30 hover:bg-purple-500/10 text-slate-300',
                          },
                          {
                            id: 'Demo',
                            labelFa: 'نسخه نمایشی (دمو)',
                            labelEn: 'Demo',
                            icon: PlayCircle,
                            color: 'border-cyan-500/60 bg-cyan-500/20 text-cyan-300 ring-cyan-500/30',
                            inactiveColor: 'border-white/10 bg-black/30 hover:border-cyan-500/30 hover:bg-cyan-500/10 text-slate-300',
                          },
                          {
                            id: 'Early Access',
                            labelFa: 'دسترسی زودهنگام',
                            labelEn: 'Early Access',
                            icon: Sparkles,
                            color: 'border-blue-500/60 bg-blue-500/20 text-blue-300 ring-blue-500/30',
                            inactiveColor: 'border-white/10 bg-black/30 hover:border-blue-500/30 hover:bg-blue-500/10 text-slate-300',
                          },
                          {
                            id: 'On Hold',
                            labelFa: 'متوقف / آرشیو شده',
                            labelEn: 'On Hold',
                            icon: RotateCcw,
                            color: 'border-slate-500/60 bg-slate-500/20 text-slate-200 ring-slate-500/30',
                            inactiveColor: 'border-white/10 bg-black/30 hover:border-slate-500/30 hover:bg-slate-500/10 text-slate-400',
                          },
                        ].map((item) => {
                          const isSelected = currentProject.status === item.id;
                          const IconComp = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                updateProject({ ...currentProject, status: item.id });
                                playGlassResonance(600, isMuted);
                                showNotification(`وضعیت پروژه به «${item.labelFa} (${item.labelEn})» تنظیم شد.`);
                              }}
                              className={`p-2.5 rounded-xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                                isSelected ? `${item.color} ring-2 font-semibold shadow-md` : item.inactiveColor
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <IconComp size={15} />
                                <div>
                                  <div className="text-xs">{item.labelFa}</div>
                                  <div className="text-[10px] opacity-75 font-mono">{item.labelEn}</div>
                                </div>
                              </div>
                              {isSelected && <Check size={14} className="shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Status Input Form */}
                      <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="وضعیت دلخواه (مثلاً: Alpha, Beta, Pre-Alpha, Released)..."
                          value={customStatusInput}
                          onChange={(e) => setCustomStatusInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (customStatusInput.trim()) {
                                updateProject({ ...currentProject, status: customStatusInput.trim() });
                                showNotification(`وضعیت دلخواه «${customStatusInput.trim()}» ثبت شد.`);
                                setCustomStatusInput('');
                                playGlassResonance(600, isMuted);
                              }
                            }
                          }}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-black/50 border border-white/20 text-xs text-white placeholder:text-slate-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customStatusInput.trim()) {
                              updateProject({ ...currentProject, status: customStatusInput.trim() });
                              showNotification(`وضعیت دلخواه «${customStatusInput.trim()}» ثبت شد.`);
                              setCustomStatusInput('');
                              playGlassResonance(600, isMuted);
                            }
                          }}
                          disabled={!customStatusInput.trim()}
                          className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
                        >
                          ثبت وضعیت دلخواه
                        </button>
                      </div>
                    </div>

                    {/* PROJECT RELEASE DATE (تاریخ انتشار به میلادی بر اساس ماه و سال) */}
                    {(() => {
                      const currentRelDate = currentProject.releaseDate || '';
                      let parsedMonth = '';
                      let parsedYear = '';

                      for (const m of GREGORIAN_MONTHS) {
                        const reg = new RegExp(`(^|\\s)(${m.code}|${m.nameEn})(\\s|$)`, 'i');
                        if (reg.test(currentRelDate)) {
                          parsedMonth = m.code;
                          break;
                        }
                      }

                      const yearMatch = currentRelDate.match(/\b(20\d{2}|19\d{2})\b/);
                      if (yearMatch) {
                        parsedYear = yearMatch[1];
                      }

                      const handleMonthSelect = (mCode: string) => {
                        const targetYear = parsedYear || new Date().getFullYear().toString();
                        let updated = '';
                        if (mCode && targetYear) {
                          updated = `${mCode} ${targetYear}`;
                        } else if (mCode) {
                          updated = mCode;
                        } else if (targetYear) {
                          updated = targetYear;
                        }
                        updateProject({ ...currentProject, releaseDate: updated });
                        playGlassResonance(600, isMuted);
                        showNotification(`تاریخ انتشار به «${updated}» تنظیم شد.`);
                      };

                      const handleYearSelect = (yVal: string) => {
                        let updated = '';
                        if (parsedMonth && yVal) {
                          updated = `${parsedMonth} ${yVal}`;
                        } else if (yVal) {
                          updated = yVal;
                        } else if (parsedMonth) {
                          updated = parsedMonth;
                        }
                        updateProject({ ...currentProject, releaseDate: updated || undefined });
                        playGlassResonance(600, isMuted);
                        if (updated) {
                          showNotification(`تاریخ انتشار به «${updated}» تنظیم شد.`);
                        }
                      };

                      return (
                        <div className="p-4 rounded-2xl bg-black/40 border border-white/15 space-y-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <label className="text-xs font-mono font-semibold text-white flex items-center gap-1.5">
                                <Calendar size={15} className="text-amber-400" />
                                <span>تاریخ انتشار میلادی (Release Date)</span>
                              </label>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                تاریخ انتشار بازی را بر اساس ماه و سال میلادی انتخاب یا وارد کنید؛ این برچسب به شکل نشان کوچک روی پیش‌نمایش کارت و پنجره جزئیات قرار می‌گیرد.
                              </p>
                            </div>
                            {/* Live Preview of card badge */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400 font-mono">نشان روی پیش‌نمایش کارت:</span>
                              {currentProject.releaseDate ? (
                                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-black/80 text-amber-300 border border-amber-500/40 shadow-sm flex items-center gap-1.5">
                                  <Calendar size={12} className="text-amber-400" />
                                  <span>{currentProject.releaseDate}</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-white/5 border border-white/10">
                                  (تنظیم نشده)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Selectors for Month and Year */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="text-[11px] font-mono text-slate-300 block mb-1">
                                انتخاب ماه میلادی (Month):
                              </label>
                              <select
                                value={parsedMonth}
                                onChange={(e) => handleMonthSelect(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-xs text-white font-mono cursor-pointer"
                              >
                                <option value="">-- بدون ماه (تنها سال) --</option>
                                {GREGORIAN_MONTHS.map((m) => (
                                  <option key={m.code} value={m.code}>
                                    {m.code} - {m.nameEn} ({m.nameFa})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[11px] font-mono text-slate-300 block mb-1">
                                انتخاب سال میلادی (Year):
                              </label>
                              <select
                                value={parsedYear}
                                onChange={(e) => handleYearSelect(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-xs text-white font-mono cursor-pointer"
                              >
                                <option value="">-- بدون سال --</option>
                                {GREGORIAN_YEARS.map((y) => (
                                  <option key={y} value={y.toString()}>
                                    {y}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Quick Presets */}
                          <div className="space-y-1.5 pt-1">
                            <div className="text-[11px] font-mono text-slate-400">
                              انتخاب سریع بازه زمانی و فصول (Quick Presets):
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {[
                                'Q1 2025',
                                'Q2 2025',
                                'Q3 2025',
                                'Q4 2025',
                                'Q1 2026',
                                'Q2 2026',
                                'Q3 2026',
                                'Q4 2026',
                                '2024',
                                '2025',
                                '2026',
                                'Coming Soon',
                              ].map((preset) => {
                                const isPresetActive = currentProject.releaseDate === preset;
                                return (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => {
                                      updateProject({ ...currentProject, releaseDate: preset });
                                      playGlassResonance(550, isMuted);
                                      showNotification(`تاریخ انتشار به «${preset}» تنظیم شد.`);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border cursor-pointer ${
                                      isPresetActive
                                        ? 'bg-amber-500/25 border-amber-500/60 text-amber-200 font-bold shadow-sm'
                                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                                    }`}
                                  >
                                    {preset}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Direct Manual Input & Clear */}
                          <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="ویرایش مستقیم متن تاریخ (مثلاً: Oct 2024 یا Early 2025 یا 2024-10)..."
                              value={currentProject.releaseDate || ''}
                              onChange={(e) => updateProject({ ...currentProject, releaseDate: e.target.value })}
                              className="flex-1 px-3 py-1.5 rounded-xl bg-black/50 border border-white/20 text-xs text-white placeholder:text-slate-500 font-mono"
                            />
                            {currentProject.releaseDate && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateProject({ ...currentProject, releaseDate: undefined });
                                  playGlassResonance(350, isMuted);
                                  showNotification('تاریخ انتشار حذف شد.');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
                              >
                                پاک کردن تاریخ
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* PROJECT PLATFORMS SECTION (پلتفرم‌های مقصد) */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/15 space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <label className="text-xs font-mono font-semibold text-white flex items-center gap-1.5">
                            <Monitor size={15} className={theme.accentClass.icon} />
                            <span>پلتفرم‌های مقصد پروژه (Target Platforms)</span>
                          </label>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            پلتفرم‌هایی که بازی برای آن‌ها ساخته شده است را انتخاب کنید. پلتفرم دارای نشان ستاره روی کاور کارت نمایش داده می‌شود.
                          </p>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {currentProject.platform?.length || 0} پلتفرم ثبت شده
                        </span>
                      </div>

                      {/* Currently Active Selected Platforms */}
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                        <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                          <span>پلتفرم‌های انتخاب شده برای این پروژه:</span>
                        </div>
                        {currentProject.platform && currentProject.platform.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-2">
                            {currentProject.platform.map((plt, pIdx) => {
                              const isPrimary = pIdx === 0;
                              return (
                                <div
                                  key={pIdx}
                                  className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-2 border transition-all ${
                                    isPrimary
                                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-sm'
                                      : 'bg-white/10 border-white/20 text-white'
                                  }`}
                                >
                                  {isPrimary ? (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300">
                                      <Star size={11} className="fill-amber-300" />
                                      <span>(اصلی روی کارت)</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const reordered = [plt, ...currentProject.platform.filter((x) => x !== plt)];
                                        updateProject({ ...currentProject, platform: reordered });
                                        playGlassResonance(600, isMuted);
                                        showNotification(`«${plt}» به عنوان پلتفرم شاخص روی کاور انتخاب شد.`);
                                      }}
                                      className="text-[10px] text-amber-300 hover:text-white underline cursor-pointer"
                                      title="تنظیم به عنوان پلتفرم اصلی روی کاور کارت"
                                    >
                                      انتخاب به عنوان شاخص
                                    </button>
                                  )}
                                  <span className="font-medium font-mono">{plt}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = currentProject.platform.filter((x) => x !== plt);
                                      updateProject({ ...currentProject, platform: updated });
                                      playGlassResonance(300, isMuted);
                                    }}
                                    className="text-slate-400 hover:text-rose-300 p-0.5 rounded cursor-pointer"
                                    title="حذف این پلتفرم"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-amber-300/80 font-mono">
                            هنوز پلتفرمی انتخاب نشده است. لطفاً از گزینه‌های زیر پلتفرم‌های مورد نظر را انتخاب کنید.
                          </div>
                        )}
                      </div>

                      {/* Preset Platforms Click-to-Toggle Chips */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-mono text-slate-400">
                          روی هر پلتفرم کلیک کنید تا فعال یا غیرفعال شود:
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {[
                            { name: 'PC / Windows', icon: Monitor },
                            { name: 'Steam', icon: Gamepad2 },
                            { name: 'Itch.io', icon: Gamepad2 },
                            { name: 'macOS', icon: Laptop },
                            { name: 'Linux', icon: Terminal },
                            { name: 'Mobile (Android / iOS)', icon: Smartphone },
                            { name: 'Android', icon: Smartphone },
                            { name: 'iOS', icon: Smartphone },
                            { name: 'Web / WebGL', icon: Globe },
                            { name: 'PlayStation', icon: Gamepad2 },
                            { name: 'Xbox', icon: Gamepad2 },
                            { name: 'Nintendo Switch', icon: Gamepad2 },
                            { name: 'VR / Meta Quest / XR', icon: Glasses },
                          ].map((item) => {
                            const isSelected = currentProject.platform?.includes(item.name);
                            const IconComp = item.icon;
                            return (
                              <button
                                key={item.name}
                                type="button"
                                onClick={() => {
                                  const currentList = currentProject.platform || [];
                                  let updated: string[];
                                  if (currentList.includes(item.name)) {
                                    updated = currentList.filter((p) => p !== item.name);
                                  } else {
                                    updated = [...currentList, item.name];
                                  }
                                  updateProject({ ...currentProject, platform: updated });
                                  playGlassResonance(isSelected ? 300 : 600, isMuted);
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400/40 shadow-sm font-semibold'
                                    : 'bg-black/30 border-white/15 text-slate-300 hover:border-white/30 hover:text-white'
                                }`}
                              >
                                <IconComp size={13} />
                                <span>{item.name}</span>
                                {isSelected ? (
                                  <Check size={12} className="text-emerald-300" />
                                ) : (
                                  <Plus size={11} className="text-slate-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Platform Input Form */}
                      <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="نام پلتفرم دلخواه (مثلاً Steam Deck, WebGL Demo, Arcade)..."
                          value={customPlatformInput}
                          onChange={(e) => setCustomPlatformInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (customPlatformInput.trim()) {
                                const val = customPlatformInput.trim();
                                const currentList = currentProject.platform || [];
                                if (!currentList.includes(val)) {
                                  updateProject({ ...currentProject, platform: [...currentList, val] });
                                  showNotification(`پلتفرم «${val}» به پروژه افزوده شد.`);
                                  playGlassResonance(600, isMuted);
                                }
                                setCustomPlatformInput('');
                              }
                            }
                          }}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-black/50 border border-white/20 text-xs text-white placeholder:text-slate-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customPlatformInput.trim()) {
                              const val = customPlatformInput.trim();
                              const currentList = currentProject.platform || [];
                              if (!currentList.includes(val)) {
                                updateProject({ ...currentProject, platform: [...currentList, val] });
                                showNotification(`پلتفرم «${val}» به پروژه افزوده شد.`);
                                playGlassResonance(600, isMuted);
                              }
                              setCustomPlatformInput('');
                            }
                          }}
                          disabled={!customPlatformInput.trim()}
                          className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
                        >
                          + افزودن پلتفرم
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono font-medium text-slate-300 block mb-1">
                        توضیحات مختصر در کارت (Short Description)
                      </label>
                      <input
                        type="text"
                        value={currentProject.shortDescription}
                        onChange={(e) => updateProject({ ...currentProject, shortDescription: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-mono font-medium text-slate-300 block mb-1">
                        توضیحات جامع در مودال جزئیات (Full Description)
                      </label>
                      <textarea
                        rows={3}
                        value={currentProject.fullDescription}
                        onChange={(e) => updateProject({ ...currentProject, fullDescription: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-xs text-white resize-none"
                      />
                    </div>

                    {/* PROJECT LINKS: GITHUB & DEMO / ITCH.IO */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/15 space-y-3">
                      <div>
                        <label className="text-xs font-mono font-semibold text-white flex items-center gap-1.5">
                          <Gamepad2 size={15} className={theme.accentClass.icon} />
                          <span>لینک‌های پروژه (GitHub &amp; Demo / Itch.io)</span>
                        </label>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          در صورت وارد کردن لینک، دکمه به صورت فعال و قابل کلیک نمایش می‌یابد. در صورت خالی بودن لینک، به صورت خودکار روی نام آن خط کشیده شده و نشان <span className="font-mono text-amber-300">coming soon ...</span> کنار آن نمایش داده می‌شود.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-mono font-medium text-slate-300">
                              لینک ریپازیتوری گیت‌هاب (GitHub)
                            </label>
                            {currentProject.githubUrl?.trim() ? (
                              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 size={11} />
                                <span>لینک فعال</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                                <Clock size={11} />
                                <span>حالت coming soon</span>
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="https://github.com/username/repo (یا خالی)"
                            value={currentProject.githubUrl || ''}
                            onChange={(e) => updateProject({ ...currentProject, githubUrl: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-xs text-white placeholder:text-slate-500 font-mono"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-mono font-medium text-slate-300">
                              لینک دمو یا بازی در Itch.io
                            </label>
                            {currentProject.demoUrl?.trim() ? (
                              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 size={11} />
                                <span>لینک فعال</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                                <Clock size={11} />
                                <span>حالت coming soon</span>
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="https://username.itch.io/game (یا خالی)"
                            value={currentProject.demoUrl || ''}
                            onChange={(e) => updateProject({ ...currentProject, demoUrl: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-xs text-white placeholder:text-slate-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* YOUTUBE VIDEO SECTION */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/15 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono font-semibold text-rose-300 flex items-center gap-1.5">
                          <Youtube size={16} className="text-rose-400" />
                          <span>ویدیوی گیم‌پلی یا تریلر پروژه از یوتیوب (YouTube Video)</span>
                        </label>
                        {currentProject.youtubeUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              updateProject({ ...currentProject, youtubeUrl: '' });
                              showNotification('لینک ویدیوی یوتیوب از این پروژه برداشته شد.');
                            }}
                            className="text-[11px] text-rose-300 hover:text-rose-100 hover:underline cursor-pointer"
                          >
                            حذف لینک ویدیو
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=... یا https://youtu.be/... یا کد ۱۱ رقمی"
                        value={currentProject.youtubeUrl || ''}
                        onChange={(e) => updateProject({ ...currentProject, youtubeUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-xs text-white placeholder:text-slate-500 font-mono"
                      />
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        با قرار دادن آدرس ویدیوی یوتیوب، این ویدیو مستقیماً و به صورت کامل با پلیر تعاملی (Play، صدا، کیفیت، تمام‌صفحه) درون صفحه پروژه نمایش داده می‌شود.
                      </p>

                      {/* Live YouTube Embed Preview inside Admin */}
                      {currentProject.youtubeUrl && (
                        <div className="pt-2 border-t border-white/10">
                          {getYouTubeEmbedUrl(currentProject.youtubeUrl) ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                                <CheckCircle2 size={13} />
                                <span>پیش‌نمایش ویدیو یوتیوب درون سایت:</span>
                              </div>
                              <div className="w-full max-w-md aspect-video rounded-xl overflow-hidden border border-white/20 bg-black/80 shadow-lg">
                                <iframe
                                  src={getYouTubeEmbedUrl(currentProject.youtubeUrl)!}
                                  title="YouTube Preview"
                                  className="w-full h-full border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-amber-300/90 font-mono">
                              ⚠️ فرمت لینک یوتیوب تشخیص داده نشد. لطفاً از آدرس استاندارد (youtube.com یا youtu.be) استفاده نمایید.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* OPTIMIZING IMAGE BANNER NOTIFICATION */}
                    {isOptimizingImage && (
                      <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center gap-2 text-xs font-mono text-cyan-200 animate-pulse">
                        <Loader2 size={16} className="animate-spin" />
                        <span>در حال بهینه‌سازی و فشرده‌سازی تصویر برای بارگذاری سریع و بدون خطا...</span>
                      </div>
                    )}

                    {/* 1. PROJECT MAIN COVER / BANNER SECTION */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/15 space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <label className="text-xs font-mono font-semibold text-white flex items-center gap-1.5">
                            <ImageIcon size={16} className={theme.accentClass.icon} />
                            <span>تصویر بنر و کاور اصلی پروژه (Main Cover & Banner)</span>
                          </label>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            این تصویر به عنوان کاور اصلی کارت بازی در صفحه پروژه‌ها و بنر بالای صفحه جزئیات نمایش داده می‌شود.
                          </p>
                        </div>
                        {activeCoverImage && (
                          <button
                            type="button"
                            onClick={handleRemoveCover}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="حذف کامل تصویر کاور و استفاده از پس‌زمینه رنگی پیش‌فرض"
                          >
                            <Trash2 size={13} />
                            <span>حذف تصویر کاور</span>
                          </button>
                        )}
                      </div>

                      {/* Active Cover Display & Preview */}
                      {activeCoverImage ? (
                        <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-black/60 aspect-[21/9] sm:aspect-[24/9] max-h-56 group shadow-lg">
                          <img
                            src={activeCoverImage}
                            alt="کاور اصلی پروژه"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />
                          
                          {/* Cover Badges & Info */}
                          <div className="absolute top-3 right-3 flex items-center gap-2">
                            <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-500/90 text-white flex items-center gap-1 shadow">
                              <Check size={12} />
                              <span>کاور فعال پروژه</span>
                            </span>
                          </div>

                          {/* Cover Action Bar */}
                          <div className="absolute bottom-3 inset-x-3 flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/15">
                            <span className="text-xs text-slate-200 truncate max-w-xs font-mono">
                              {activeCoverImage.startsWith('data:') ? 'تصویر بهینه‌شده از سیستم' : activeCoverImage}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => coverFileInputRef.current?.click()}
                                className="px-2.5 py-1 rounded-lg bg-cyan-500/25 hover:bg-cyan-500/40 text-cyan-200 border border-cyan-500/40 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Upload size={13} />
                                <span>تغییر با آپلود</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsEditingCoverUrl(!isEditingCoverUrl)}
                                className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <LinkIcon size={13} />
                                <span>تغییر با لینک</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleRemoveCover}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/25 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                                <span>حذف کاور</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* No cover image - Empty state with direct options */
                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-dashed border-white/20 flex flex-col items-center justify-center text-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                            <ImageIcon size={24} />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-200">این پروژه در حال حاضر تصویر کاور اختصاصی ندارد و از گرادیان رنگی استفاده می‌کند.</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              می‌توانید یک تصویر جذاب از بازی یا نرم‌افزار آپلود کنید یا آدرس آن را وارد نمایید.
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => coverFileInputRef.current?.click()}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Upload size={14} />
                              <span>آپلود تصویر کاور</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingCoverUrl(true)}
                              className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <LinkIcon size={14} />
                              <span>افزودن با آدرس اینترنتی (URL)</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Inline URL edit form for Cover */}
                      {isEditingCoverUrl && (
                        <div className="p-3 rounded-xl bg-black/60 border border-white/15 space-y-2">
                          <label className="text-[11px] font-mono text-slate-300 block">
                            آدرس مستقیم اینترنتی برای تصویر کاور اصلی پروژه:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="https://... آدرس مستقیم تصویر"
                              value={newCoverUrlInput}
                              onChange={(e) => setNewCoverUrlInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSetCoverUrl(newCoverUrlInput);
                                }
                              }}
                              className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-xs text-white placeholder:text-slate-500 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => handleSetCoverUrl(newCoverUrlInput)}
                              disabled={!newCoverUrlInput.trim()}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
                            >
                              ثبت کاور
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingCoverUrl(false);
                                setNewCoverUrlInput('');
                              }}
                              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs cursor-pointer transition-colors"
                            >
                              انصراف
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. GALLERY IMAGES SECTION */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/15 space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-mono font-semibold text-white flex items-center gap-1.5">
                          <Images size={16} className={theme.accentClass.icon} />
                          <span>گالری تصاویر و اسکرین‌شات‌های بازی ({currentProject.galleryImages?.length || 0} تصویر ثبت شده)</span>
                        </label>
                        <span className="text-[11px] text-slate-400">
                          هنگام باز شدن صفحه پروژه، کاربر می‌تواند این تصاویر را به همراه بزرگ‌نمایی ورق بزند
                        </span>
                      </div>

                      {/* Existing images list / grid */}
                      {currentProject.galleryImages && currentProject.galleryImages.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {currentProject.galleryImages.map((imgUrl, imgIdx) => {
                            const isThisCover = activeCoverImage === imgUrl;
                            return (
                              <div
                                key={imgIdx}
                                className={`relative group rounded-xl overflow-hidden border aspect-video flex items-center justify-center shadow transition-all ${
                                  isThisCover ? 'border-emerald-400 ring-2 ring-emerald-500/40 bg-emerald-950/20' : 'border-white/15 bg-black/50'
                                }`}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Gallery ${imgIdx + 1}`}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100" viewBox="0 0 160 100"><rect fill="%231e293b" width="160" height="100"/><text fill="%2394a3b8" font-size="11" x="50%" y="50%" text-anchor="middle">تصویر بارگذاری نشد</text></svg>';
                                  }}
                                />
                                {/* Top Indicator */}
                                {isThisCover && (
                                  <span className="absolute top-1.5 right-1.5 text-[9px] font-mono font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded shadow z-10">
                                    کاور اصلی
                                  </span>
                                )}
                                
                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 z-20">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-white/90 bg-white/20 px-1.5 py-0.5 rounded">
                                      #{imgIdx + 1}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReplacingGalleryIndex(imgIdx);
                                          replaceFileInputRef.current?.click();
                                        }}
                                        className="p-1 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer transition-colors"
                                        title="تغییر / جایگزینی این تصویر با فایل جدید"
                                      >
                                        <RefreshCw size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveGalleryImage(imgIdx)}
                                        className="p-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-colors"
                                        title="حذف این تصویر از پروژه"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                  {!isThisCover ? (
                                    <button
                                      type="button"
                                      onClick={() => handleSetAsCover(imgUrl)}
                                      className="text-[10px] font-medium text-center text-amber-200 hover:text-white bg-white/15 hover:bg-white/25 py-1 px-1.5 rounded transition-colors cursor-pointer"
                                    >
                                      تنظیم به عنوان بنر اصلی
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-emerald-300 text-center font-mono font-medium">
                                      کاور اصلی فعال
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/15 text-center text-xs text-slate-400">
                          هنوز تصویری در گالری ثبت نشده است. می‌توانید با بارگذاری از کامپیوتر یا وارد کردن آدرس اینترنتی (URL)، اسکرین‌شات‌ها را اضافه کنید.
                        </div>
                      )}

                      {/* Add new image controls: URL input + File Upload button */}
                      <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center gap-2">
                        <div className="flex-1 flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            placeholder="آدرس اینترنتی تصویر (https://...)"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddImageUrl();
                              }
                            }}
                            className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-xs text-white placeholder:text-slate-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddImageUrl}
                            disabled={!newImageUrl.trim()}
                            className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
                          >
                            افزودن با لینک
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0"
                        >
                          <Upload size={14} />
                          <span>آپلود تصویر به گالری</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowServerImagesPickerInGallery((prev) => !prev);
                            if (projectImagesList.length === 0) refreshImagesList();
                          }}
                          className={`w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0 ${
                            showServerImagesPickerInGallery
                              ? 'bg-cyan-500 text-black border border-cyan-400 font-bold shadow-md'
                              : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                          }`}
                        >
                          <Folder size={14} />
                          <span>انتخاب از فایل‌های پوشه تصاویر ({projectImagesList.length})</span>
                        </button>
                      </div>

                      {/* Expandable Server Images Drawer inside Project Gallery */}
                      {showServerImagesPickerInGallery && (
                        <div className="mt-3 p-3.5 rounded-xl bg-black/60 border border-cyan-500/30 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <Folder size={14} className="text-cyan-400" />
                              <span className="text-xs font-semibold text-white">
                                تصاویر موجود در پوشه سیستم (public/projects/images/)
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                                {projectImagesList.length} فایل
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={refreshImagesList}
                              disabled={loadingImagesList}
                              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <RefreshCw size={12} className={loadingImagesList ? 'animate-spin text-cyan-400' : ''} />
                              <span>تازه‌سازی لیست</span>
                            </button>
                          </div>

                          {projectImagesList.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto p-1">
                              {projectImagesList.map((imgFile) => {
                                const isCurrentInGallery = currentProject.galleryImages?.includes(imgFile.url);
                                const isCurrentCover = currentProject.imageBanner === imgFile.url;

                                return (
                                  <div
                                    key={imgFile.filename}
                                    className={`p-2 rounded-xl border transition-all flex flex-col gap-1.5 ${
                                      isCurrentCover
                                        ? 'bg-amber-950/30 border-amber-500/50 ring-1 ring-amber-500/30'
                                        : isCurrentInGallery
                                          ? 'bg-emerald-950/20 border-emerald-500/40'
                                          : 'bg-white/[0.03] border-white/10 hover:border-cyan-500/30'
                                    }`}
                                  >
                                    <div className="aspect-video w-full rounded-lg bg-black/60 overflow-hidden border border-white/5 relative">
                                      <img
                                        src={imgFile.url}
                                        alt={imgFile.filename}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                      <div className="absolute top-1 right-1">
                                        {isCurrentCover ? (
                                          <span className="px-1.5 py-0.5 rounded bg-amber-500 text-amber-950 font-bold text-[9px] flex items-center gap-0.5">
                                            <Star size={9} className="fill-amber-950" />
                                            کاور
                                          </span>
                                        ) : isCurrentInGallery ? (
                                          <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-emerald-950 font-bold text-[9px] flex items-center gap-0.5">
                                            <Check size={9} strokeWidth={3} />
                                            گالری
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>

                                    <p className="text-[10px] font-mono text-slate-300 truncate" title={imgFile.filename}>
                                      {imgFile.filename}
                                    </p>

                                    <div className="pt-1 border-t border-white/10 mt-auto flex flex-col gap-1">
                                      {!isCurrentInGallery ? (
                                        <button
                                          type="button"
                                          onClick={() => handleTransferImageToProjectGallery(imgFile.url, currentProject.id, false)}
                                          className="w-full py-1 px-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                        >
                                          <Plus size={11} />
                                          <span>افزودن به گالری</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveImageFromProjectGallery(imgFile.url, currentProject.id)}
                                          className="w-full py-1 px-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                        >
                                          <Trash2 size={10} />
                                          <span>حذف از گالری</span>
                                        </button>
                                      )}

                                      {!isCurrentCover && (
                                        <button
                                          type="button"
                                          onClick={() => handleTransferImageToProjectGallery(imgFile.url, currentProject.id, true)}
                                          className="w-full py-0.5 px-1 rounded bg-white/10 hover:bg-white/15 text-slate-300 text-[9px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                        >
                                          <Star size={10} className="text-amber-400" />
                                          <span>کاور اصلی</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-xs text-slate-400">
                              تصویری در پوشه سیستم یافت نشد.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Project Save and Status Bar */}
                    <div className="pt-4 mt-2 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/40 p-3.5 rounded-2xl border border-white/10">
                      <div className="text-xs text-slate-300 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span>تغییرات به صورت خودکار ذخیره می‌شوند. برای اطمینان و ثبت در سرور می‌توانید دکمه ذخیره را بزنید.</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleManualSaveAll}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-200 hover:text-white border border-emerald-500/50 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                      >
                        <Save size={15} />
                        <span>ذخیره و تثبیت تغییرات این پروژه</span>
                      </button>
                    </div>

                    {/* Hidden file inputs for direct reliable triggers */}
                    <input
                      type="file"
                      ref={coverFileInputRef}
                      onChange={handleCoverUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleGalleryUpload}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={replaceFileInputRef}
                      onChange={handleReplaceGalleryImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SKILLS EDIT */}
            {adminActiveTab === 'skills' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-300">
                    مدیریت تب‌ها و دسته‌بندی‌های مهارت، درصد تسلط و تگ‌ها:
                  </p>
                  <button
                    onClick={() => setIsAddingCategory(!isAddingCategory)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/40 transition-all cursor-pointer shrink-0"
                  >
                    <Plus size={14} />
                    <span>افزودن دسته‌بندی / تب جدید</span>
                  </button>
                </div>

                {isAddingCategory && (
                  <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/20 space-y-3">
                    <h5 className="text-xs font-semibold text-white">ایجاد تب یا دسته‌بندی مهارت جدید</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="نام دسته (مثلاً: Multiplayer & Networking)"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="توضیح مختصر دسته"
                        value={newCatDesc}
                        onChange={(e) => setNewCatDesc(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-xs text-white"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsAddingCategory(false)}
                        className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white text-xs"
                      >
                        انصراف
                      </button>
                      <button
                        onClick={handleCreateNewCategory}
                        className="px-4 py-1.5 rounded-xl bg-emerald-500 text-white font-medium text-xs"
                      >
                        ثبت دسته جدید
                      </button>
                    </div>
                  </div>
                )}

                {skillsData.map((cat, catIdx) => (
                  <div key={cat.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/15 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers size={16} className={theme.accentClass.icon} />
                        <h4 className="text-sm font-semibold text-white">{cat.name}</h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          ({cat.skills.length} مهارت)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            addSkillItem(cat.id, { name: 'مهارت جدید', level: 80, tag: getSkillTagFromLevel(80) });
                            showNotification('مهارت جدید با سطح کیفی خودکار اضافه شد.');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>مهارت جدید</span>
                        </button>

                        {confirmDeleteId === cat.id ? (
                          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-rose-950/80 border border-rose-500/40">
                            <span className="text-[11px] text-rose-200 font-medium px-1">حذف دسته؟</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSkillCategory(cat.id, cat.name)}
                              className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors shadow"
                            >
                              بله
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 text-xs cursor-pointer transition-colors"
                            >
                              انصراف
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(cat.id)}
                            className="p-1.5 rounded-lg bg-rose-500/15 text-rose-300 hover:text-rose-100 hover:bg-rose-500/25 transition-colors border border-rose-500/20 cursor-pointer"
                            title="حذف کامل این دسته‌بندی"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Skills List with Auto-Calculated Qualitative Level Badges */}
                    <div className="space-y-2.5">
                      {cat.skills.length > 0 && (
                        <div className="grid grid-cols-12 gap-2 text-[10px] font-mono text-slate-400 px-1 pb-1 border-b border-white/10">
                          <span className="col-span-5">عنوان مهارت</span>
                          <span className="col-span-4">درصد تسلط (Slider)</span>
                          <span className="col-span-2 text-center" title="به صورت خودکار بر اساس درصد تنظیم می‌شود">
                            سطح کیفی (خودکار)
                          </span>
                          <span className="col-span-1 text-end">حذف</span>
                        </div>
                      )}

                      {cat.skills.map((skill, sIdx) => {
                        const levelInfo = getSkillLevelInfo(skill.level);
                        return (
                          <div key={sIdx} className="grid grid-cols-12 gap-2 items-center text-xs">
                            <input
                              type="text"
                              value={skill.name}
                              onChange={(e) =>
                                handleSaveSkillItem(catIdx, sIdx, { ...skill, name: e.target.value })
                              }
                              placeholder="عنوان مهارت..."
                              className="col-span-5 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/15 text-white placeholder:text-slate-500"
                            />
                            <div className="col-span-4 flex items-center gap-2">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={skill.level}
                                onChange={(e) => {
                                  const newLevel = Number(e.target.value);
                                  const newTag = getSkillTagFromLevel(newLevel);
                                  handleSaveSkillItem(catIdx, sIdx, { ...skill, level: newLevel, tag: newTag });
                                }}
                                className="w-full accent-rose-500 cursor-pointer"
                              />
                              <span className="w-8 font-mono text-white text-[11px] text-right font-medium">
                                {skill.level}%
                              </span>
                            </div>

                            {/* Qualitative Description: Automatically determined from percentage */}
                            <div
                              className={`col-span-2 px-2 py-1.5 rounded-lg border text-center text-[11px] font-mono font-semibold flex items-center justify-center transition-all ${levelInfo.badgeBg}`}
                              title={`سطح کیفی خودکار: ${levelInfo.tag} (${levelInfo.persianLabel}) - بر اساس ${skill.level}% تسلط`}
                            >
                              <span className="truncate">{levelInfo.tag}</span>
                            </div>

                            <div className="col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  deleteSkillItem(cat.id, sIdx);
                                  showNotification('مهارت حذف شد.');
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-white/5 rounded transition-colors cursor-pointer"
                                title="حذف این مهارت"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: EXPERIENCE / TIMELINE EDIT */}
            {adminActiveTab === 'experience' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-300">
                    مدیریت سوابق کاری، امکان حذف کامل و افزودن سابقه جدید به تایم‌لاین:
                  </p>
                  <button
                    onClick={() => setIsAddingExperience(!isAddingExperience)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/40 transition-all cursor-pointer shrink-0"
                  >
                    <Plus size={14} />
                    <span>افزودن سابقه جدید</span>
                  </button>
                </div>

                {/* Inline New Experience Form */}
                {isAddingExperience && (
                  <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/20 space-y-3">
                    <h5 className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Plus size={14} className={theme.accentClass.icon} />
                      <span>ثبت سابقه کاری یا دستاورد جدید</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-mono text-slate-300 block mb-1">سمت / نقش</label>
                        <input
                          type="text"
                          placeholder="مثلاً: Senior Unity Programmer"
                          value={newExpForm.role}
                          onChange={(e) => setNewExpForm({ ...newExpForm, role: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono text-slate-300 block mb-1">سازمان / استودیو</label>
                        <input
                          type="text"
                          placeholder="مثلاً: Pixel Forge Studios"
                          value={newExpForm.organization}
                          onChange={(e) => setNewExpForm({ ...newExpForm, organization: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono text-slate-300 block mb-1">دوره فعالیت</label>
                        <input
                          type="text"
                          placeholder="مثلاً: 2023 — Present"
                          value={newExpForm.period}
                          onChange={(e) => setNewExpForm({ ...newExpForm, period: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">توضیحات سابقه</label>
                      <textarea
                        rows={2}
                        placeholder="شرح وظایف کلیدی و دستاوردهای فنی..."
                        value={newExpForm.description}
                        onChange={(e) => setNewExpForm({ ...newExpForm, description: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 text-xs text-white resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setIsAddingExperience(false)}
                        className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white text-xs cursor-pointer"
                      >
                        انصراف
                      </button>
                      <button
                        onClick={handleCreateNewExperience}
                        className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs cursor-pointer shadow-md"
                      >
                        ثبت و افزودن به سوابق
                      </button>
                    </div>
                  </div>
                )}

                {/* Experience Cards with Complete Delete & Edit */}
                {experiencesData.map((exp) => (
                  <div key={exp.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/15 space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <Briefcase size={15} className={theme.accentClass.icon} />
                        <span className="text-xs font-semibold text-white">{exp.role || 'سمت کاری'}</span>
                        <span className="text-[11px] text-slate-400">| {exp.organization || 'سازمان'}</span>
                      </div>

                      {/* Complete Delete Button */}
                      <div className="flex items-center gap-2">
                        {confirmDeleteId === exp.id ? (
                          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-rose-950/80 border border-rose-500/40">
                            <span className="text-[11px] text-rose-200 font-medium px-1">حذف سابقه؟</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteExperience(exp.id)}
                              className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors shadow"
                            >
                              بله، حذف کن
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 text-xs cursor-pointer transition-colors"
                            >
                              انصراف
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(exp.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-100 transition-colors border border-rose-500/25 flex items-center gap-1.5 text-xs cursor-pointer font-medium"
                            title="حذف کامل این سابقه"
                          >
                            <Trash2 size={13} />
                            <span>حذف کامل</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-mono text-slate-300 block mb-1">سمت / نقش</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => updateExperience({ ...exp, role: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono text-slate-300 block mb-1">سازمان / استودیو</label>
                        <input
                          type="text"
                          value={exp.organization}
                          onChange={(e) => updateExperience({ ...exp, organization: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono text-slate-300 block mb-1">دوره فعالیت</label>
                        <input
                          type="text"
                          value={exp.period}
                          onChange={(e) => updateExperience({ ...exp, period: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">توضیحات</label>
                      <textarea
                        rows={2}
                        value={exp.description}
                        onChange={(e) => updateExperience({ ...exp, description: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: CONTACT & SOCIAL LINKS EDIT */}
            {adminActiveTab === 'contact' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/15 space-y-3.5">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Mail size={16} className={theme.accentClass.icon} />
                    <span>تنظیمات متون بخش ارتباط (Contact Section Headers)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-mono font-medium text-slate-300 block mb-1">
                        عنوان کارت تماس (Heading)
                      </label>
                      <input
                        type="text"
                        value={contactData.heading}
                        onChange={(e) => updateContactData({ heading: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono font-medium text-slate-300 block mb-1">
                        عنوان فرم پیام (Form Title)
                      </label>
                      <input
                        type="text"
                        value={contactData.formHeading}
                        onChange={(e) => updateContactData({ formHeading: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono font-medium text-slate-300 block mb-1">
                      توضیحات تکمیلی کارت تماس (Subheading)
                    </label>
                    <textarea
                      rows={2}
                      value={contactData.subheading}
                      onChange={(e) => updateContactData({ subheading: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-xs text-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-mono font-medium text-slate-300 block mb-1">
                        ایمیل اصلی تماس (Primary Email)
                      </label>
                      <input
                        type="email"
                        value={contactData.email}
                        onChange={(e) => updateContactData({ email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono font-medium text-slate-300 block mb-1">
                        موقعیت مکانی (Location)
                      </label>
                      <input
                        type="text"
                        value={contactData.location}
                        onChange={(e) => updateContactData({ location: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono font-medium text-slate-300 block mb-1">
                        زمان پاسخگویی (Response Time)
                      </label>
                      <input
                        type="text"
                        value={contactData.responseTime}
                        onChange={(e) => updateContactData({ responseTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Links Manager */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/15 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <LinkIcon size={16} className={theme.accentClass.icon} />
                        <span>مدیریت لینک‌ها و شبکه‌های اجتماعی (Social Links)</span>
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        امکان تغییر آدرس، نام و افزودن یا حذف لینک‌های گیت‌هاب، لینکدین، ایچ‌آی‌او، دیسکورد و غیره
                      </p>
                    </div>

                    <button
                      onClick={handleAddNewSocialLink}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/40 transition-all cursor-pointer shrink-0"
                    >
                      <Plus size={14} />
                      <span>افزودن لینک جدید</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {contactData.socials && contactData.socials.length > 0 ? (
                      contactData.socials.map((link) => (
                        <div key={link.id} className="p-3 rounded-xl bg-black/40 border border-white/15 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                          <div className="sm:col-span-3">
                            <label className="text-[10px] font-mono text-slate-400 block mb-0.5">نام نمایشی</label>
                            <input
                              type="text"
                              value={link.name}
                              onChange={(e) => updateSocialLink(link.id, { name: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                            />
                          </div>

                          <div className="sm:col-span-5">
                            <label className="text-[10px] font-mono text-slate-400 block mb-0.5">آدرس کامل (URL)</label>
                            <input
                              type="text"
                              value={link.url}
                              onChange={(e) => updateSocialLink(link.id, { url: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="text-[10px] font-mono text-slate-400 block mb-0.5">نوع آیکون</label>
                            <select
                              value={link.icon}
                              onChange={(e) => updateSocialLink(link.id, { icon: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs text-white"
                            >
                              <option value="Github">گیت‌هاب (GitHub)</option>
                              <option value="Linkedin">لینکدین (LinkedIn)</option>
                              <option value="Gamepad2">ایچ‌آی‌او (Itch.io)</option>
                              <option value="Twitter">توییتر / X</option>
                              <option value="Mail">ایمیل (Mail)</option>
                              <option value="MessageSquare">دیسکورد / تلگرام</option>
                              <option value="Globe">وب‌سایت / دیگر</option>
                            </select>
                          </div>

                          <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                            {confirmDeleteId === link.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSocialLink(link.id)}
                                  className="px-2 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer transition-colors shadow"
                                  title="تأیید حذف"
                                >
                                  حذف
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-1.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 text-[11px] cursor-pointer transition-colors"
                                  title="انصراف"
                                >
                                  لغو
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(link.id)}
                                className="p-1.5 rounded-lg bg-rose-500/15 text-rose-300 hover:text-rose-100 hover:bg-rose-500/25 transition-colors border border-rose-500/20 cursor-pointer"
                                title="حذف این لینک"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs text-slate-400">
                        هیچ لینکی اضافه نشده است. روی دکمه «افزودن لینک جدید» کلیک کنید.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: BACKUP & RESTORE */}
            {adminActiveTab === 'backup' && (
              <div className="space-y-5">
                {/* SECTION 1: PERMANENT STORAGE & BUILD PORTABILITY */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent border border-emerald-500/25 space-y-4">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <HardDrive size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>سیستم ذخیره‌سازی دائمی، پوشه تصاویر و خروجی نهایی (Build Assets)</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              مستقل و آماده خروجی
                            </span>
                          </h4>
                          <p className="text-xs text-slate-300 mt-0.5">
                            عکس‌ها در پوشه <code className="font-mono text-emerald-300 bg-black/40 px-1.5 py-0.5 rounded text-[11px]">public/projects/images/</code> ذخیره می‌شوند و داده‌ها در سورس پروژه ثبت می‌گردند.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleBakeToProjectFiles}
                        disabled={isBaking}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/50 cursor-pointer"
                        title="ثبت تغییرات و انتقال تمام عکس‌های آپلود شده به پوشه public/projects/images/"
                      >
                        {isBaking ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}
                        <span>{isBaking ? 'در حال تثبیت در فایل‌ها...' : 'تثبیت و ثبت دائمی در سورس‌کد'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadFullProject}
                        disabled={isExportingFullProject}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-950/50 cursor-pointer"
                        title="دانلود کل سورس پروژه آماده به همراه تمام تصاویر تنظیم‌شده، تنظیمات و پکیج‌ها (ZIP)"
                      >
                        {isExportingFullProject ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                        <span>{isExportingFullProject ? (fullProjectProgressMsg || 'در حال آماده‌سازی سورس...') : 'دانلود سورس کامل پروژه (ZIP آماده بیلد)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadAssetsZip}
                        disabled={isExportingZip}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/15 transition-all cursor-pointer"
                        title="دانلود تمام عکس‌های پروژه همراه با داده‌های json و ts در قالب یک فایل ZIP مستقل"
                      >
                        {isExportingZip ? <Loader2 size={15} className="animate-spin text-cyan-400" /> : <Package size={15} className="text-cyan-400" />}
                        <span>{isExportingZip ? (zipProgressMsg || 'در حال دریافت...') : 'دانلود پکیج تصاویر و داده‌ها'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadTsSource}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
                        title="دانلود فایل سورس portfolioData.ts برای انتقال دستی به پوشه src/data/"
                      >
                        <FileCode size={14} className="text-cyan-400" />
                        <span>دانلود سورس TS</span>
                      </button>
                    </div>
                  </div>

                  {/* Direct Browser Download Link Bar (Guarantees zero-delay native streaming directly to disk) */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900/60 border border-blue-500/30 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-inner">
                    <div className="flex items-center gap-2 text-slate-200">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      <span className="leading-snug">
                        دانلود مستقیم با مرورگر (بدون مصرف رم جاوااسکریپت و بدون معطلی):
                      </span>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 shrink-0">
                      <a
                        href="/api/export-full-project"
                        download={`erfan-jalali-portfolio-full-project-${new Date().toISOString().slice(0, 10)}.zip`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-md shadow-blue-950/50 cursor-pointer"
                        title="دانلود مستقیم سورس کامل پروژه با تمام کدهای تایپ‌اسکریپت و تصاویر آماده اجرا و بیلد"
                      >
                        <Download size={13} />
                        <span>لینک مستقیم سورس کامل (~21MB)</span>
                      </a>
                      <a
                        href="/api/export-zip"
                        download={`erfan-jalali-portfolio-assets-${new Date().toISOString().slice(0, 10)}.zip`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-medium flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
                        title="دانلود مستقیم بسته تصاویر کیفیت اصلی و داده‌ها"
                      >
                        <Package size={13} className="text-cyan-400" />
                        <span>لینک مستقیم تصاویر و داده‌ها</span>
                      </a>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300/90 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/10">
                    با اجرای دستور <code className="text-emerald-300 font-mono">npm run build</code>، تمامی تصاویر پوشه اختصاصی، تنظیمات و مشخصات پروژه‌ها به شکل کامپایل‌شده داخل پوشه <code className="text-emerald-300 font-mono">dist</code> قرار می‌گیرند و خروجی نهایی بدون وابستگی به حافظه موقت مرورگر، بر روی هر هاست، سرور یا هاستینگ گیت‌هاب (GitHub Pages) به صورت کاملاً مستقل و بی‌نقص کار خواهد کرد.
                  </p>

                  {bakeResult && (
                    <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                      bakeResult.success
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className={bakeResult.success ? 'text-emerald-400' : 'text-rose-400'} />
                        <span>{bakeResult.message}</span>
                      </div>
                      {bakeResult.filesUpdated && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-300/80">
                          {bakeResult.filesUpdated.join(' • ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* FOLDER INSPECTOR & GALLERY TRANSFER MANAGER */}
                  <div className="mt-3 p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Folder size={15} className="text-cyan-400" />
                        <span className="text-xs font-semibold text-white font-mono">
                          public/projects/images/
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {projectImagesList.length} فایل ذخیره‌شده
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={refreshImagesList}
                        disabled={loadingImagesList}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw size={12} className={loadingImagesList ? 'animate-spin text-cyan-400' : ''} />
                        <span>تازه‌سازی لیست پوشه</span>
                      </button>
                    </div>

                    {/* TARGET PROJECT SELECTOR & FILTER TOOLBAR */}
                    {(() => {
                      const folderTargetProj = projectsData.find((p) => p.id === folderTargetProjectId) || currentProject || projectsData[0];
                      const targetProjGallery = Array.isArray(folderTargetProj?.galleryImages) ? folderTargetProj.galleryImages : [];
                      const targetProjCover = folderTargetProj?.imageBanner || '';

                      const notInProjGalleryFiles = projectImagesList.filter((f) => !targetProjGallery.includes(f.url));
                      const inProjGalleryFiles = projectImagesList.filter((f) => targetProjGallery.includes(f.url));

                      const filteredFolderList = projectImagesList.filter((f) => {
                        if (folderImageFilter === 'not_in_gallery') return !targetProjGallery.includes(f.url);
                        if (folderImageFilter === 'in_gallery') return targetProjGallery.includes(f.url);
                        return true;
                      });

                      return (
                        <div className="space-y-3">
                          {/* Transfer destination & batch action bar */}
                          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/25 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="text-xs text-cyan-300 font-semibold whitespace-nowrap flex items-center gap-1.5">
                                <Gamepad2 size={14} className="text-cyan-400" />
                                <span>پروژه انتخابی برای انتقال تصاویر:</span>
                              </span>
                              <select
                                value={folderTargetProjectId}
                                onChange={(e) => setFolderTargetProjectId(e.target.value)}
                                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/40 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                              >
                                {projectsData.map((proj) => (
                                  <option key={proj.id} value={proj.id} className="bg-slate-900 text-white">
                                    {proj.title} ({proj.galleryImages?.length || 0} تصویر در گالری)
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
                              {/* Filter tabs */}
                              <div className="flex items-center p-0.5 rounded-lg bg-black/60 border border-white/10 text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => setFolderImageFilter('all')}
                                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                                    folderImageFilter === 'all'
                                      ? 'bg-white/20 text-white font-semibold'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  همه ({projectImagesList.length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFolderImageFilter('not_in_gallery')}
                                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                                    folderImageFilter === 'not_in_gallery'
                                      ? 'bg-amber-500/20 text-amber-300 font-semibold'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  خارج از گالری ({notInProjGalleryFiles.length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFolderImageFilter('in_gallery')}
                                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                                    folderImageFilter === 'in_gallery'
                                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  در گالری ({inProjGalleryFiles.length})
                                </button>
                              </div>

                              {/* Batch transfer button */}
                              {notInProjGalleryFiles.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleTransferAllImagesToProject(folderTargetProj.id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                                  title="انتقال تمام تصاویری که هنوز در گالری این پروژه نیستند"
                                >
                                  <Plus size={13} />
                                  <span>افزودن همه ({notInProjGalleryFiles.length}) به گالری</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Grid of Files */}
                          {filteredFolderList.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                              {filteredFolderList.map((imgFile) => {
                                const isInGallery = targetProjGallery.includes(imgFile.url);
                                const isCover = targetProjCover === imgFile.url;

                                return (
                                  <div
                                    key={imgFile.filename}
                                    className={`p-2.5 rounded-xl border transition-all flex flex-col gap-2 group ${
                                      isCover
                                        ? 'bg-amber-950/25 border-amber-500/50 ring-1 ring-amber-500/30'
                                        : isInGallery
                                          ? 'bg-emerald-950/20 border-emerald-500/40'
                                          : 'bg-white/[0.03] border-white/10 hover:border-cyan-500/30'
                                    }`}
                                  >
                                    <div className="aspect-video w-full rounded-lg bg-black/60 overflow-hidden border border-white/5 relative">
                                      <img
                                        src={imgFile.url}
                                        alt={imgFile.filename}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = 'none';
                                        }}
                                      />

                                      {/* Status Badge on thumbnail */}
                                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                                        {isCover ? (
                                          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-amber-950 font-bold text-[10px] flex items-center gap-1 shadow-md">
                                            <Star size={10} className="fill-amber-950" />
                                            کاور اصلی
                                          </span>
                                        ) : isInGallery ? (
                                          <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-emerald-950 font-bold text-[10px] flex items-center gap-1 shadow-md">
                                            <Check size={10} strokeWidth={3} />
                                            در گالری
                                          </span>
                                        ) : (
                                          <span className="px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-slate-300 text-[10px] border border-white/10">
                                            خارج از گالری
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="min-w-0">
                                      <p className="text-[11px] font-mono text-slate-200 truncate font-medium" title={imgFile.filename}>
                                        {imgFile.filename}
                                      </p>
                                      <p className="text-[10px] text-slate-500 font-mono">
                                        {(imgFile.size / 1024).toFixed(1)} KB
                                      </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-1.5 border-t border-white/10 flex flex-col gap-1.5 mt-auto">
                                      {!isInGallery ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleTransferImageToProjectGallery(imgFile.url, folderTargetProj.id, false)}
                                            className="w-full py-1.5 px-2 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-500/40 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                                          >
                                            <Plus size={13} />
                                            <span>افزودن به گالری پروژه</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleTransferImageToProjectGallery(imgFile.url, folderTargetProj.id, true)}
                                            className="w-full py-1 px-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                          >
                                            <Star size={11} className="text-amber-400" />
                                            <span>تنظیم به عنوان کاور اصلی</span>
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          {!isCover ? (
                                            <button
                                              type="button"
                                              onClick={() => handleTransferImageToProjectGallery(imgFile.url, folderTargetProj.id, true)}
                                              className="w-full py-1.5 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                            >
                                              <Star size={12} className="text-amber-400" />
                                              <span>تبدیل به کاور اصلی</span>
                                            </button>
                                          ) : (
                                            <div className="py-1 px-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] text-center font-mono font-semibold">
                                              کاور و بنر اصلی پروژه
                                            </div>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveImageFromProjectGallery(imgFile.url, folderTargetProj.id)}
                                            className="w-full py-1 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                          >
                                            <Trash2 size={11} />
                                            <span>حذف از گالری پروژه</span>
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-xs text-slate-400 bg-white/[0.01] rounded-xl border border-dashed border-white/10">
                              تصویری با این فیلتر یافت نشد.
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* SECTION 2: JSON EXPORT & BACKUP */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/15 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Download size={16} />
                      <span>خروجی گرفتن و پشتیبان داده‌ها (Export & Backup JSON)</span>
                    </h4>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownloadBackupFile}
                        className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 border border-blue-500/30 transition-all cursor-pointer"
                      >
                        <FileDown size={14} />
                        <span>دانلود فایل JSON</span>
                      </button>

                      <button
                        onClick={handleExport}
                        className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer"
                      >
                        {copiedJSON ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{copiedJSON ? 'کپی شد!' : 'کپی به کلیپ‌بورد'}</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300">
                    می‌توانید تمام تغییرات، پروژه‌ها، مهارت‌ها، سوابق و تنظیمات تماس را در قالب یک فایل JSON خروجی بگیرید یا دانلود کنید تا همیشه یک نسخه پشتیبان آفلاین داشته باشید.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/15 space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Upload size={16} />
                    <span>بارگذاری و بازیابی از فایل JSON (Import)</span>
                  </h4>
                  <p className="text-xs text-slate-300">
                    اگر قبلاً فایل JSON پشتیبان دریافت کرده‌اید، محتوای آن را در کادر زیر قرار دهید تا فوراً بارگذاری شود:
                  </p>
                  <textarea
                    rows={4}
                    placeholder="کد JSON را در اینجا قرار دهید..."
                    value={jsonImportText}
                    onChange={(e) => setJsonImportText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-xs font-mono text-white resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleImport}
                      className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-2 border border-white/25 transition-all cursor-pointer"
                    >
                      <Upload size={14} />
                      <span>اعمال و ذخیره‌سازی داده‌ها</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3">
                  <h4 className="text-sm font-semibold text-rose-200 flex items-center gap-2">
                    <RotateCcw size={16} />
                    <span>بازنشانی به تنظیمات کارخانه (Factory Reset)</span>
                  </h4>
                  <p className="text-xs text-rose-300/80">
                    با زدن این دکمه، تمام داده‌های ویرایش‌شده پاک شده و محتوای اولیه سایت بازنشانی می‌شود.
                  </p>
                  {confirmFactoryReset ? (
                    <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-rose-200 font-medium">
                        آیا کاملاً مطمئن هستید؟ تمامی تغییرات پاک شده و متون اولیه بازمی‌گردند.
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleFactoryReset}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors shadow"
                        >
                          بله، بازنشانی قطعی
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmFactoryReset(false)}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs cursor-pointer transition-colors"
                        >
                          انصراف
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmFactoryReset(true)}
                      className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold border border-rose-500/30 transition-all cursor-pointer"
                    >
                      بازنشانی به حالت اولیه
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
