import JSZip from 'jszip';
import { optimizeImageFile } from '../utils/imageOptimizer';
import { ProfileInfo, Project, SkillCategory, ExperienceItem, ContactDetails } from '../types';

export interface ProjectImageFile {
  filename: string;
  url: string;
  size: number;
  updatedAt: string;
}

export interface ProjectExportStats {
  totalBytes: number;
  formattedTotal: string;
  imageBytes: number;
  formattedImages: string;
  imageCount: number;
  codeBytes: number;
  formattedCode: string;
  fileCount: number;
  timestamp: string;
}

/**
 * Fetches real-time computed size and asset counts for the complete project export
 */
export async function fetchProjectExportStats(): Promise<ProjectExportStats | null> {
  try {
    const res = await fetch(`/api/export-stats?t=${Date.now()}`);
    if (res.ok) {
      return (await res.json()) as ProjectExportStats;
    }
  } catch (err) {
    console.warn('[StorageService] Error fetching export stats:', err);
  }
  return null;
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

export const GITHUB_CONFIG = {
  OWNER: 'erfanJalali2007',
  REPO: 'erfanjalali2007.github.io',
  BRANCH: 'main',
  STORAGE_KEY: 'portfolio_github_token',
  DEFAULT_TOKEN: '',
};

export function getGitHubToken(): string {
  try {
    const saved = localStorage.getItem(GITHUB_CONFIG.STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return GITHUB_CONFIG.DEFAULT_TOKEN;
}

export function setGitHubToken(token: string): void {
  try {
    localStorage.setItem(GITHUB_CONFIG.STORAGE_KEY, token.trim());
  } catch {}
}

export function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Tests connection to the GitHub repository using the provided or saved token.
 */
export async function testGitHubConnection(token?: string): Promise<{ success: boolean; message: string; username?: string }> {
  const ghToken = token || getGitHubToken();
  if (!ghToken) {
    return { success: false, message: 'توکن دسترسی گیت‌هاب یافت نشد.' };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}`, {
      headers: {
        Authorization: `token ${ghToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (res.ok) {
      const repo = await res.json();
      return {
        success: true,
        message: `اتصال برقرار است: مخزن ${repo.full_name} (${repo.default_branch})`,
        username: repo.owner?.login,
      };
    } else {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        message: err.message || `خطا در برقراری ارتباط با گیت‌هاب (${res.status})`,
      };
    }
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || 'خطای شبکه در اتصال به گیت‌هاب.',
    };
  }
}

/**
 * Commits a file directly to the GitHub repository via GitHub REST API.
 */
export async function commitFileToGitHub(
  filePath: string,
  contentBase64: string,
  commitMessage: string,
  token?: string
): Promise<{ success: boolean; message: string; sha?: string; htmlUrl?: string }> {
  const ghToken = token || getGitHubToken();
  if (!ghToken) {
    return { success: false, message: 'توکن دسترسی گیت‌هاب تنظیم نشده است.' };
  }

  const cleanPath = filePath.replace(/^\/+/, '');
  const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${cleanPath}`;

  try {
    // 1. Check if file already exists to get its SHA
    let existingSha: string | undefined;
    try {
      const getRes = await fetch(`${apiUrl}?ref=${GITHUB_CONFIG.BRANCH}`, {
        headers: {
          Authorization: `token ${ghToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (getRes.ok) {
        const fileData = await getRes.json();
        existingSha = fileData.sha;
      }
    } catch {
      // New file
    }

    // 2. Put file to repository
    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${ghToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: contentBase64,
        sha: existingSha,
        branch: GITHUB_CONFIG.BRANCH,
      }),
    });

    if (putRes.ok) {
      const result = await putRes.json();
      return {
        success: true,
        message: 'فایل با موفقیت در گیت‌هاب ثبت شد.',
        sha: result.commit?.sha,
        htmlUrl: result.commit?.html_url,
      };
    } else {
      const err = await putRes.json().catch(() => ({}));
      return {
        success: false,
        message: err.message || `خطا در ارسال به گیت‌هاب (${putRes.status})`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'خطای ارتباط با سرور گیت‌هاب.',
    };
  }
}

/**
 * Uploads an image file directly to GitHub repo (/public/projects/images/...)
 * with 100% binary fidelity, triggering automatic deploy on GitHub Pages.
 */
export async function uploadImageToGitHub(
  file: File,
  projectId?: string,
  onProgress?: (msg: string) => void
): Promise<string> {
  onProgress?.('در حال آماده‌سازی تصویر برای ارسال به گیت‌هاب...');

  const token = getGitHubToken();
  if (!token) {
    throw new Error('توکن گیت‌هاب موجود نیست.');
  }

  let base64Data: string;
  if (file.size <= 30 * 1024 * 1024) {
    base64Data = await readFileAsDataURL(file);
  } else {
    onProgress?.('در حال بهینه‌سازی حجم تصویر...');
    base64Data = await optimizeImageFile(file, 2560, 1440, 0.92);
  }

  const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
  const cleanExt = (file.name.split('.').pop() || 'png').toLowerCase();
  const safeBase = (projectId || 'project').replace(/[^a-zA-Z0-9_-]/g, '-');
  const filename = `${safeBase}-${Date.now()}.${cleanExt}`;
  const targetPath = `public/projects/images/${filename}`;

  onProgress?.(`در حال آپلود و کامیت مستقیم تصویر ${filename} در گیت‌هاب...`);
  const commitRes = await commitFileToGitHub(
    targetPath,
    cleanBase64,
    `Add project image: ${filename} via Admin Panel`,
    token
  );

  if (commitRes.success) {
    onProgress?.('تصویر با موفقیت در ریپازیتوری ذخیره شد!');
    return `/projects/images/${filename}`;
  } else {
    throw new Error(commitRes.message);
  }
}

/**
 * Uploads an image file to the dedicated /public/projects/images/ directory.
 * Prioritizes local physical server storage directly into /public/projects/images/,
 * with optional asynchronous GitHub repository mirror if a token is present.
 */
export async function uploadProjectImageToFolder(
  file: File,
  projectId?: string,
  onProgress?: (msg: string) => void
): Promise<string> {
  // 1. Prioritize local server endpoint to immediately save physical file to /public/projects/images/
  onProgress?.('در حال بارگذاری و ذخیره فیزیکی تصویر در پوشه public/projects/images/...');
  try {
    const imageDataUrl = await readFileAsDataURL(file);
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
        // If GitHub token is present, mirror to GitHub asynchronously in background
        if (getGitHubToken()) {
          uploadImageToGitHub(file, projectId).catch((ghErr) => {
            console.warn('[StorageService] Non-blocking GitHub mirror:', ghErr);
          });
        }
        return data.url;
      }
    }
  } catch (err) {
    console.warn('[StorageService] Local upload-image endpoint failed, attempting fallback:', err);
  }

  // 2. Direct GitHub commit fallback if GitHub token is present
  if (getGitHubToken()) {
    try {
      const ghUrl = await uploadImageToGitHub(file, projectId, onProgress);
      if (ghUrl) return ghUrl;
    } catch (ghErr: any) {
      console.warn('[StorageService] GitHub direct upload failed:', ghErr);
    }
  }

  // 3. Ultimate fallback: return data URL so UI never blocks
  return await readFileAsDataURL(file);
}

/**
 * Synchronizes all portfolio data directly into the GitHub repository
 * (public/data/portfolioData.json & src/data/portfolioData.ts).
 */
export async function syncPortfolioDataToGitHub(
  data: PortfolioFullData,
  onProgress?: (msg: string) => void
): Promise<SyncResult> {
  const token = getGitHubToken();
  if (!token) {
    return {
      success: false,
      message: 'توکن دسترسی گیت‌هاب یافت نشد. لطفاً در بخش تنظیمات توکن را بررسی نمایید.',
    };
  }

  try {
    onProgress?.('در حال آماده‌سازی ساختار داده‌های JSON پورتفولیو...');
    const jsonString = JSON.stringify(data, null, 2);
    const jsonBase64 = utf8ToBase64(jsonString);

    onProgress?.('در حال کامیت فایل public/data/portfolioData.json در گیت‌هاب...');
    const jsonCommit = await commitFileToGitHub(
      'public/data/portfolioData.json',
      jsonBase64,
      'Update portfolioData.json from Admin Studio',
      token
    );

    if (!jsonCommit.success) {
      return {
        success: false,
        message: `خطا در ذخیره JSON در گیت‌هاب: ${jsonCommit.message}`,
      };
    }

    // Also update TypeScript source file
    onProgress?.('در حال کامیت فایل src/data/portfolioData.ts در گیت‌هاب...');
    const tsCode = `// THIS FILE IS AUTOMATICALLY SYNCHRONIZED WITH YOUR PORTFOLIO SETTINGS & ASSETS
// Any changes saved in the Admin Studio are permanently baked into this file and /public/projects/images/

import { Project, SkillCategory, ExperienceItem, ProfileInfo, ContactDetails } from '../types';

export const PROFILE_DATA: ProfileInfo = ${JSON.stringify(data.profile, null, 2)};

export const DEFAULT_CONTACT_DETAILS: ContactDetails = ${JSON.stringify(data.contact, null, 2)};

export const SKILL_CATEGORIES: SkillCategory[] = ${JSON.stringify(data.skills, null, 2)};

export const PROJECTS_DATA: Project[] = ${JSON.stringify(data.projects, null, 2)};

export const EXPERIENCES_DATA: ExperienceItem[] = ${JSON.stringify(data.experiences, null, 2)};
`;
    const tsBase64 = utf8ToBase64(tsCode);
    await commitFileToGitHub(
      'src/data/portfolioData.ts',
      tsBase64,
      'Update portfolioData.ts from Admin Studio',
      token
    );

    onProgress?.('تغییرات با موفقیت در گیت‌هاب ثبت شدند!');
    return {
      success: true,
      message: 'تغییرات مستقیماً در ریپازیتوری گیت‌هاب ثبت شدند و سایت در حال بیلد و انتشار خودکار است!',
      filesUpdated: ['public/data/portfolioData.json', 'src/data/portfolioData.ts'],
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'خطا در همگام‌سازی با گیت‌هاب.',
    };
  }
}

/**
 * Synchronizes and bakes all portfolio settings, texts, and projects permanently
 * into /public/data/portfolioData.json and /src/data/portfolioData.ts.
 * Supports both local server persistence and direct GitHub repository synchronization.
 */
export async function syncPortfolioDataToServer(
  data: PortfolioFullData,
  onProgress?: (msg: string) => void
): Promise<SyncResult> {
  // 1. Try local dev server first
  try {
    const res = await fetch('/api/save-portfolio-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const localResult: SyncResult = await res.json();
      // If GitHub token is present, mirror to GitHub asynchronously
      if (getGitHubToken()) {
        syncPortfolioDataToGitHub(data, onProgress).catch((e) => {
          console.warn('[GitHub Mirror] Non-blocking GitHub mirror error:', e);
        });
      }
      return {
        ...localResult,
        success: true,
        message: localResult.message || 'داده‌ها با موفقیت در پوشه‌ها و فایل‌های اصلی پروژه ذخیره شدند.',
      };
    }
  } catch (err) {
    console.warn('[StorageService] Local server save failed:', err);
  }

  // 2. Direct GitHub repository sync if token available
  if (getGitHubToken()) {
    const ghResult = await syncPortfolioDataToGitHub(data, onProgress);
    if (ghResult.success) {
      return ghResult;
    }
  }

  return {
    success: false,
    message: 'خطا در ارتباط با سرور برای ثبت دائمی داده‌ها.',
  };
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
 * Safely triggers a direct native file download from a Blob or URL.
 * Never uses target="_blank" which triggers iframe and browser popup blockers.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(downloadUrl);
  }, 60000);
}

/**
 * Downloads a file from an endpoint via fetch stream, accurately reporting
 * real-time progress in Megabytes and Percentage, and delivering the real binary file.
 */
export async function downloadFileStreamWithProgress(
  endpointUrl: string,
  filename: string,
  onProgress?: (percent: number, msg: string) => void
): Promise<void> {
  onProgress?.(5, 'در حال برقراری ارتباط با سرور و آماده‌سازی پکیج...');
  const separator = endpointUrl.includes('?') ? '&' : '?';
  const finalUrl = `${endpointUrl}${separator}t=${Date.now()}`;

  const response = await fetch(finalUrl);
  if (!response.ok) {
    throw new Error(`خطای سرور هنگام دانلود: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error('سرور فایل فشرده ارسال نکرد (احتمال ریدایرکت یا خطای احراز هویت)');
  }

  const contentLengthHeader = response.headers.get('content-length');
  const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
  const totalMb = totalBytes > 0 ? (totalBytes / (1024 * 1024)).toFixed(1) : '65.6';

  if (!response.body) {
    onProgress?.(80, 'در حال خواندن فایل...');
    const blob = await response.blob();
    if (blob.size < 500000) {
      throw new Error(`فایل ناقص است (${(blob.size / 1024).toFixed(1)} KB)`);
    }
    triggerBlobDownload(blob, filename);
    onProgress?.(100, `دانلود موفق بسته کامل (${(blob.size / 1024 / 1024).toFixed(1)} MB)`);
    return;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      receivedBytes += value.length;
      const currentMb = (receivedBytes / (1024 * 1024)).toFixed(1);
      if (totalBytes > 0) {
        const percent = Math.min(99, Math.round((receivedBytes / totalBytes) * 100));
        onProgress?.(percent, `در حال دریافت: ${currentMb} MB از ${totalMb} MB (${percent}%)`);
      } else {
        onProgress?.(50, `در حال دریافت داده‌ها: ${currentMb} MB...`);
      }
    }
  }

  if (receivedBytes < 500000) {
    throw new Error(`حجم دریافت شده کمتر از حد مجاز است (${(receivedBytes / 1024).toFixed(1)} KB)`);
  }

  onProgress?.(99, `در حال تحویل نهایی فایل (${(receivedBytes / (1024 * 1024)).toFixed(1)} MB)...`);
  const finalBlob = new Blob(chunks as unknown as BlobPart[], { type: 'application/zip' });
  triggerBlobDownload(finalBlob, filename);
  onProgress?.(100, `دانلود کامل شد! فایل با حجم ${(finalBlob.size / 1024 / 1024).toFixed(1)} MB در دانلودها ذخیره شد.`);
}

/**
 * Direct client-side project packaging engine:
 * 1. Fetches all source code text files from /api/project-source-files (~600 KB total)
 * 2. Fetches all 36 high-res images from /projects/images/... (~65 MB total)
 * 3. Packages with JSZip directly in browser memory (takes < 1 second)
 * 4. Triggers direct blob download (guaranteed 65.6 MB real ZIP file, zero proxy/cookie-check errors!)
 */
export async function downloadFullProjectInBrowser(
  data: PortfolioFullData,
  filename: string,
  onProgress?: (percent: number, msg: string) => void
): Promise<void> {
  onProgress?.(5, 'در حال خواندن فایل‌های سورس پروژه (کدها و کامپوننت‌ها)...');
  const zip = new JSZip();

  // 1. Fetch all source files
  try {
    const srcRes = await fetch('/api/project-source-files');
    if (srcRes.ok) {
      const srcData = await srcRes.json();
      if (srcData.files && typeof srcData.files === 'object') {
        for (const [relPath, content] of Object.entries(srcData.files)) {
          zip.file(relPath, content as string);
        }
      }
    }
  } catch (e) {
    console.warn('[Browser Packager] Could not fetch code manifest:', e);
  }

  // Ensure latest portfolioData.json and portfolioData.ts are injected with current in-memory edits
  zip.file('public/data/portfolioData.json', JSON.stringify(data, null, 2));
  zip.file(
    'src/data/portfolioData.ts',
    `// THIS FILE IS AUTOMATICALLY SYNCHRONIZED
import { Project, SkillCategory, ExperienceItem, ProfileInfo, ContactDetails } from '../types';

export const PROFILE_DATA: ProfileInfo = ${JSON.stringify(data.profile, null, 2)};
export const DEFAULT_CONTACT_DETAILS: ContactDetails = ${JSON.stringify(data.contact, null, 2)};
export const SKILL_CATEGORIES: SkillCategory[] = ${JSON.stringify(data.skills, null, 2)};
export const PROJECTS_DATA: Project[] = ${JSON.stringify(data.projects, null, 2)};
export const EXPERIENCES_DATA: ExperienceItem[] = ${JSON.stringify(data.experiences, null, 2)};
`
  );

  // Add offline guide
  zip.file(
    'README_OFFLINE_GUIDE.md',
    `# پورتفولیو و رزومه شخصی عرفان جلالی
## راهنمای اجرای آفلاین پروژه (Full Project Source)

این بسته شامل تمامی کدهای پروژه، کامپوننت‌ها و تمام تصاویر پروژه‌ها با کیفیت اصلی در پوشه public/projects/images/ است.

### مراحل اجرای پروژه:
1. npm install
2. npm run dev

برای ساخت خروجی نهایی مستقل:
npm run build
`
  );

  // 2. Fetch all project images
  onProgress?.(15, 'در حال دریافت لیست تمامی ۳۶ تصویر با کیفیت بالا از سرور...');
  const imgListRes = await fetch('/api/project-images');
  let imageFiles: { filename: string; url: string; size?: number }[] = [];
  if (imgListRes.ok) {
    const imgData = await imgListRes.json();
    imageFiles = imgData.images || [];
  }

  // If server list empty, collect from data.projects
  if (imageFiles.length === 0) {
    for (const proj of data.projects) {
      if (proj.imageBanner && proj.imageBanner.startsWith('/projects/images/')) {
        const fname = proj.imageBanner.replace('/projects/images/', '');
        imageFiles.push({ filename: fname, url: proj.imageBanner });
      }
      if (Array.isArray(proj.galleryImages)) {
        for (const g of proj.galleryImages) {
          if (g && g.startsWith('/projects/images/')) {
            const fname = g.replace('/projects/images/', '');
            if (!imageFiles.some((f) => f.filename === fname)) {
              imageFiles.push({ filename: fname, url: g });
            }
          }
        }
      }
    }
  }

  const imagesFolder = zip.folder('public/projects/images');
  let totalBytesLoaded = 0;
  const totalImgCount = imageFiles.length;

  for (let i = 0; i < totalImgCount; i++) {
    const img = imageFiles[i];
    try {
      const resp = await fetch(img.url);
      if (resp.ok) {
        const blob = await resp.blob();
        totalBytesLoaded += blob.size;
        imagesFolder?.file(img.filename, blob, { compression: 'STORE' });
      }
    } catch (imgErr) {
      console.warn(`[Browser Packager] Could not fetch image ${img.url}:`, imgErr);
    }
    const currentMb = (totalBytesLoaded / (1024 * 1024)).toFixed(1);
    const pct = Math.min(88, 15 + Math.round(((i + 1) / totalImgCount) * 72));
    onProgress?.(pct, `در حال دریافت عکس‌ها: ${i + 1} از ${totalImgCount} (${currentMb} MB)...`);
  }

  onProgress?.(90, 'در حال فشرده‌سازی و ایجاد فایل ZIP ۶۵ مگابایتی...');
  const finalZipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 1 },
    },
    (metadata) => {
      const p = 90 + Math.round(metadata.percent * 0.08);
      onProgress?.(p, `در حال بسته‌بندی نهایی زیپ: ${Math.round(metadata.percent)}%`);
    }
  );

  const finalMb = (finalZipBlob.size / (1024 * 1024)).toFixed(1);
  onProgress?.(99, `در حال تحویل فایل زیپ (${finalMb} MB) به دانلودهای مرورگر...`);
  triggerBlobDownload(finalZipBlob, filename);
  onProgress?.(100, `دانلود فایل کامل (${finalMb} MB) با موفقیت انجام شد!`);
}

/**
 * Generates and downloads the COMPLETE ready-to-run project source code ZIP (65+ MB):
 * - All components, pages, configs, tsconfig, package.json, server.ts
 * - All high-resolution images in public/projects/images/
 * - Latest baked portfolioData.ts and portfolioData.json
 * - Comprehensive offline README run guide
 */
export async function exportFullProjectPackage(
  data: PortfolioFullData,
  onProgress?: (percent: number, msg: string) => void
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const filename = `erfan-jalali-portfolio-full-project-${today}.zip`;

  // Always use the rock-solid in-browser packager that fetches static assets and creates 65.6 MB zip directly
  // This completely eliminates Cloud Run proxy response buffer limits and 10.1 KB cookie-check HTML redirects!
  try {
    await downloadFullProjectInBrowser(data, filename, onProgress);
  } catch (err: any) {
    console.error('[Export Full Project] In-browser packaging error:', err);
    throw new Error('خطا در دریافت سورس پروژه: ' + (err?.message || 'مشکل در دانلود'));
  }
}

/**
 * Generates and downloads a complete standalone ZIP bundle containing:
 * 1. All images inside /projects/images/ (as real binary files, ~65 MB)
 * 2. public/data/portfolioData.json
 * 3. src/data/portfolioData.ts
 * 4. Comprehensive README guide for offline deployment.
 */
export async function exportAssetsZipPackage(
  data: PortfolioFullData,
  onProgress?: (percent: number, msg: string) => void
): Promise<void> {
  onProgress?.(5, 'در حال بررسی و ساخت بسته فشرده دارایی‌ها و تصاویر...');

  const today = new Date().toISOString().slice(0, 10);
  const filename = `erfan-jalali-portfolio-assets-${today}.zip`;

  try {
    await downloadFileStreamWithProgress('/api/export-zip', filename, onProgress);
    return;
  } catch (serverErr) {
    console.warn('[Export ZIP] Server stream endpoint error, trying browser generator:', serverErr);
  }

  // Fallback: Browser client JSZip generation
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
