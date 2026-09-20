import JSZip from 'jszip';
import { optimizeImageFile } from '../utils/imageOptimizer';
import { ProfileInfo, Project, SkillCategory, ExperienceItem, ContactDetails } from '../types';

export interface ProjectImageFile {
  filename: string;
  url: string;
  size: number;
  updatedAt: string;
}

export interface PortfolioFullData {
  profile: ProfileInfo;
  projects: Project[];
  skills: SkillCategory[];
  experiences: ExperienceItem[];
  contact: ContactDetails;
}

export interface SyncResult {
  success: boolean;
  message: string;
  filesUpdated?: string[];
  sanitizedProfile?: ProfileInfo;
  sanitizedProjects?: Project[];
}

/**
 * Reads a File as Data URL with 100% binary fidelity.
 */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('خطا در خواندن فایل تصویر'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image file to the dedicated /public/projects/images/ directory
 * via the backend server, preserving 100% original quality, resolution, and file size.
 */
export async function uploadProjectImageToFolder(
  file: File,
  projectId?: string,
  onProgress?: (msg: string) => void
): Promise<string> {
  onProgress?.('در حال بارگذاری فایل تصویر با کیفیت و وضوح اصلی...');

  let imageDataUrl: string;
  // If file is under 30MB, preserve 100% original binary data without downscaling
  if (file.size <= 30 * 1024 * 1024) {
    imageDataUrl = await readFileAsDataURL(file);
  } else {
    onProgress?.('تصویر بسیار حجیم است، در حال تنظیم بهینه...');
    imageDataUrl = await optimizeImageFile(file, 2560, 1440, 0.92);
  }

  onProgress?.('در حال ذخیره در پوشه اختصاصی پروژه (/public/projects/images/)...');
  try {
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageDataUrl,
        filename: file.name,
        projectId: projectId || 'project',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return data.url;
      }
    } else {
      const err = await res.json().catch(() => ({}));
      console.warn('[StorageService] Upload returned error:', err);
    }
  } catch (err) {
    console.warn('[StorageService] Server upload endpoint not reachable, using direct data URL fallback:', err);
  }

  // Fallback: return the data URL so work is never blocked
  return imageDataUrl;
}

/**
 * Synchronizes and bakes all portfolio settings, texts, and projects permanently
 * into /public/data/portfolioData.json and /src/data/portfolioData.ts.
 * Automatically extracts any base64 images into physical files in /public/projects/images/.
 */
export async function syncPortfolioDataToServer(
  data: PortfolioFullData
): Promise<SyncResult> {
  try {
    const res = await fetch('/api/save-portfolio-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const result = await res.json();
      return {
        success: true,
        message: result.message || 'داده‌ها و تصاویر با موفقیت در فایل‌های پروژه ذخیره شدند.',
        filesUpdated: result.filesUpdated,
        sanitizedProfile: result.sanitizedProfile,
        sanitizedProjects: result.sanitizedProjects,
      };
    } else {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        message: err.details || err.error || 'خطا در برقراری ارتباط با سرور ذخیره‌سازی.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: 'سرور در دسترس نیست، اما تغییرات در حافظه مرورگر ذخیره گردید.',
    };
  }
}

/**
 * Lists all image files physically stored in /public/projects/images/
 */
export async function fetchProjectImagesList(): Promise<ProjectImageFile[]> {
  try {
    const res = await fetch('/api/project-images');
    if (res.ok) {
      const data = await res.json();
      return data.images || [];
    }
  } catch (err) {
    console.warn('[StorageService] Could not fetch project images list:', err);
  }
  return [];
}

/**
 * Safely triggers a direct native file download from an HTTP endpoint or URL.
 * Works natively with streams and Content-Disposition: attachment without eating RAM.
 */
export function triggerDirectFileDownload(endpointUrl: string, fallbackFilename?: string): boolean {
  try {
    const separator = endpointUrl.includes('?') ? '&' : '?';
    const finalUrl = `${endpointUrl}${separator}t=${Date.now()}`;
    const link = document.createElement('a');
    link.href = finalUrl;
    if (fallbackFilename) {
      link.download = fallbackFilename;
    }
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 3000);
    return true;
  } catch (err) {
    console.warn('[Download] Direct anchor trigger failed, trying window.open:', err);
    try {
      const separator = endpointUrl.includes('?') ? '&' : '?';
      window.open(`${endpointUrl}${separator}t=${Date.now()}`, '_blank');
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Generates and downloads the COMPLETE ready-to-run project source code ZIP:
 * - All components, pages, configs, tsconfig, package.json, server.ts
 * - All high-resolution images in public/projects/images/
 * - Latest baked portfolioData.ts and portfolioData.json
 * - Comprehensive offline README run guide
 */
export async function exportFullProjectPackage(
  data: PortfolioFullData,
  onProgress?: (percent: number, msg: string) => void
): Promise<void> {
  onProgress?.(15, 'در حال همگام‌سازی و تثبیت آخرین تغییرات در سرور...');
  try {
    await syncPortfolioDataToServer(data);
  } catch {
    // Non-blocking
  }

  onProgress?.(50, 'در حال آماده‌سازی و ارسال بسته سورس کامل پروژه...');
  const today = new Date().toISOString().slice(0, 10);
  const filename = `erfan-jalali-portfolio-full-project-${today}.zip`;

  // 1. Direct native download trigger (fastest, streams directly to disk, does not stall in RAM)
  const triggered = triggerDirectFileDownload('/api/export-full-project', filename);
  if (triggered) {
    onProgress?.(100, 'دانلود بسته سورس‌کد کامل آغاز شد. در صورت عدم شروع، از لینک مستقیم استفاده کنید.');
    return;
  }

  // 2. Fetch-based fallback with delayed revokeObjectURL
  try {
    onProgress?.(70, 'در حال استخراج بسته فشرده سورس...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    const resp = await fetch(`/api/export-full-project?t=${Date.now()}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const blob = await resp.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }, 60000);
      onProgress?.(100, `دانلود پکیج کامل سورس‌کد (${((blob.size / 1024 / 1024).toFixed(1))} MB) با موفقیت انجام شد.`);
      return;
    }
  } catch (err: any) {
    console.error('[Export Full Project] Fallback failed:', err);
    throw new Error('خطا در دریافت سورس پروژه. لطفاً از دکمه لینک مستقیم استفاده فرمایید.');
  }
}

/**
 * Generates and downloads a complete standalone ZIP bundle containing:
 * 1. All images inside /projects/images/ (as real binary files)
 * 2. public/data/portfolioData.json
 * 3. src/data/portfolioData.ts
 * 4. Comprehensive README guide for offline deployment.
 */
export async function exportAssetsZipPackage(
  data: PortfolioFullData,
  onProgress?: (percent: number, msg: string) => void
): Promise<void> {
  onProgress?.(15, 'در حال بررسی و ساخت بسته فشرده دارایی‌ها و تصاویر...');

  const today = new Date().toISOString().slice(0, 10);
  const filename = `erfan-jalali-portfolio-assets-${today}.zip`;

  // 1. Direct native download trigger (bypasses RAM buffering and iframe restrictions)
  const triggered = triggerDirectFileDownload('/api/export-zip', filename);
  if (triggered) {
    onProgress?.(100, 'دانلود بسته تصاویر و دارایی‌ها آغاز شد.');
    return;
  }

  // 2. Fallback attempt: Server generation with delayed revokeObjectURL
  try {
    onProgress?.(50, 'در حال استخراج تصاویر با کیفیت اصلی از سرور...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    const serverResp = await fetch(`/api/export-zip?t=${Date.now()}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (serverResp.ok) {
      onProgress?.(80, 'در حال آماده‌سازی فایل...');
      const blob = await serverResp.blob();
      if (blob.size > 1000) {
        onProgress?.(95, 'در حال شروع دانلود فایل...');
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
        }, 60000);
        onProgress?.(100, `دانلود بسته با حجم ${((blob.size / 1024 / 1024).toFixed(2))} مگابایت انجام شد.`);
        return;
      }
    }
  } catch (serverErr) {
    console.warn('[Export ZIP] Server zip endpoint unavailable or failed, falling back to browser bundler:', serverErr);
  }

  // 3. Fallback: Browser client JSZip generation
  onProgress?.(40, 'در حال جمع‌آوری داده‌ها و تصاویر در مرورگر...');
  const zip = new JSZip();

  // 1. Add portfolioData.json
  const jsonString = JSON.stringify(
    {
      ...data,
      exportedAt: new Date().toISOString(),
      generator: 'Erfan Jalali Portfolio Studio',
    },
    null,
    2
  );
  zip.file('public/data/portfolioData.json', jsonString);

  // 2. Add portfolioData.ts
  const tsCode = `// THIS FILE IS AUTOMATICALLY GENERATED FOR OFFLINE DEPLOYMENT
import { Project, SkillCategory, ExperienceItem, ProfileInfo, ContactDetails } from '../types';

export const PROFILE_DATA: ProfileInfo = ${JSON.stringify(data.profile, null, 2)};

export const DEFAULT_CONTACT_DETAILS: ContactDetails = ${JSON.stringify(data.contact, null, 2)};

export const SKILL_CATEGORIES: SkillCategory[] = ${JSON.stringify(data.skills, null, 2)};

export const PROJECTS_DATA: Project[] = ${JSON.stringify(data.projects, null, 2)};

export const EXPERIENCES_DATA: ExperienceItem[] = ${JSON.stringify(data.experiences, null, 2)};
`;
  zip.file('src/data/portfolioData.ts', tsCode);

  // 3. Add Deployment Guide
  const readmeContent = `# بسته کامل دارایی‌ها، تصاویر و داده‌های پورتفولیو عرفان جلالی
(Erfan Jalali Portfolio - Complete Assets & Data Bundle)

این فایل زیپ شامل تمامی تصاویر پروژه‌ها، تنظیمات، بیوگرافی و ساختار کامل پورتفولیو است.

## ساختار فایل‌ها:
- \`public/projects/images/\` : تمامی عکس‌های کاور و گالری پروژه‌ها با کیفیت بهینه.
- \`public/data/portfolioData.json\` : فایل دیتای کامل با فرمت JSON.
- \`src/data/portfolioData.ts\` : فایل سورس کامل تایپ‌اسکریپت برای جایگزینی مستقیم در پروژه.

## نحوه استفاده:
1. پوشه \`public/projects/images/\` را در پروژه خود داخل پوشه \`public/projects/images/\` کپی کنید.
2. فایل \`src/data/portfolioData.ts\` را درون پوشه \`src/data/\` قرار دهید.
3. دستور \`npm run build\` را اجرا کنید تا خروجی نهایی مستقل در پوشه \`dist/\` ساخته شود.
`;
  zip.file('README_PORTFOLIO_ASSETS.md', readmeContent);

  // 4. Collect and add all project images
  onProgress?.(50, 'در حال جمع‌آوری و فشرده‌سازی تصاویر پروژه...');
  const imagesFolder = zip.folder('public/projects/images');

  // Query server for files in public/projects/images/
  const serverFiles = await fetchProjectImagesList();
  const processedFiles = new Set<string>();

  for (const imgInfo of serverFiles) {
    try {
      const response = await fetch(imgInfo.url);
      if (response.ok) {
        const blob = await response.blob();
        imagesFolder?.file(imgInfo.filename, blob);
        processedFiles.add(imgInfo.filename);
      }
    } catch (e) {
      console.warn(`[Export ZIP] Could not fetch server image ${imgInfo.url}:`, e);
    }
  }

  // Also scan projects data for any referenced image paths or base64 data
  for (const proj of data.projects) {
    const referencedUrls: string[] = [];
    if (proj.imageBanner && typeof proj.imageBanner === 'string' && !proj.imageBanner.includes('gradient(')) {
      referencedUrls.push(proj.imageBanner);
    }
    if (Array.isArray(proj.galleryImages)) {
      proj.galleryImages.forEach((img) => {
        if (img && typeof img === 'string' && !img.includes('gradient(')) {
          referencedUrls.push(img);
        }
      });
    }

    for (const imgUrl of referencedUrls) {
      if (imgUrl.startsWith('data:image/')) {
        const match = imgUrl.match(/^data:image\/([A-Za-z0-9-+]+);base64,(.+)$/);
        if (match) {
          let ext = match[1].toLowerCase();
          if (ext.includes('jpeg') || ext.includes('jpg')) ext = 'jpg';
          const filename = `${proj.id || 'project'}-img-${processedFiles.size + 1}.${ext}`;
          if (!processedFiles.has(filename)) {
            imagesFolder?.file(filename, match[2], { base64: true });
            processedFiles.add(filename);
          }
        }
      } else if (imgUrl.startsWith('/projects/images/')) {
        const filename = imgUrl.replace('/projects/images/', '').split('?')[0];
        if (filename && !processedFiles.has(filename)) {
          try {
            const resp = await fetch(imgUrl);
            if (resp.ok) {
              const blob = await resp.blob();
              imagesFolder?.file(filename, blob);
              processedFiles.add(filename);
            }
          } catch (e) {
            console.warn(`[Export ZIP] Could not fetch ${imgUrl}:`, e);
          }
        }
      }
    }
  }

  onProgress?.(80, 'در حال ساخت فایل ZIP نهایی...');
  const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    onProgress?.(80 + Math.round(metadata.percent * 0.18), `در حال بسته‌بندی: ${Math.round(metadata.percent)}%`);
  });

  onProgress?.(98, 'در حال تحویل فایل...');
  const downloadUrl = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }, 60000);

  onProgress?.(100, 'دانلود فایل با موفقیت انجام شد.');
}
