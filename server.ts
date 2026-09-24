import express from 'express';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing for JSON and Data URLs
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Ensure dedicated directories exist
  const publicDir = path.join(process.cwd(), 'public');
  const projectImagesDir = path.join(publicDir, 'projects', 'images');
  const publicDataDir = path.join(publicDir, 'data');
  const srcDataDir = path.join(process.cwd(), 'src', 'data');

  [projectImagesDir, publicDataDir, srcDataDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Helper to persist data synchronously to BOTH /public/data/portfolioData.json AND /src/data/portfolioData.ts
  function persistPortfolioDataFiles(payload: any) {
    if (!payload || !payload.projects) return;

    // 1. JSON in public and dist
    const jsonFilePath = path.join(publicDataDir, 'portfolioData.json');
    const jsonString = JSON.stringify(payload, null, 2);
    fs.writeFileSync(jsonFilePath, jsonString, 'utf-8');

    const distDataDir = path.join(process.cwd(), 'dist', 'data');
    try {
      if (!fs.existsSync(distDataDir)) {
        fs.mkdirSync(distDataDir, { recursive: true });
      }
      fs.writeFileSync(path.join(distDataDir, 'portfolioData.json'), jsonString, 'utf-8');
    } catch {
      // ignore
    }

    // 2. TypeScript file in src/data
    if (payload.profile && payload.skills && payload.experiences && payload.contact) {
      const tsCode = `// THIS FILE IS AUTOMATICALLY SYNCHRONIZED WITH YOUR PORTFOLIO SETTINGS & ASSETS
// Any changes saved in the Admin Studio are permanently baked into this file and /public/projects/images/

import { Project, SkillCategory, ExperienceItem, ProfileInfo, ContactDetails } from '../types';

export const PROFILE_DATA: ProfileInfo = ${JSON.stringify(payload.profile, null, 2)};

export const DEFAULT_CONTACT_DETAILS: ContactDetails = ${JSON.stringify(payload.contact, null, 2)};

export const SKILL_CATEGORIES: SkillCategory[] = ${JSON.stringify(payload.skills, null, 2)};

export const PROJECTS_DATA: Project[] = ${JSON.stringify(payload.projects, null, 2)};

export const EXPERIENCES_DATA: ExperienceItem[] = ${JSON.stringify(payload.experiences, null, 2)};
`;
      const tsFilePath = path.join(srcDataDir, 'portfolioData.ts');
      fs.writeFileSync(tsFilePath, tsCode, 'utf-8');
    }

    console.log(`[Data Persistence] Synced portfolioData.json and portfolioData.ts successfully`);
  }

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      dedicatedImagesDir: '/public/projects/images',
      time: new Date().toISOString(),
    });
  });

  // List all project images in the dedicated folder
  app.get('/api/project-images', (req, res) => {
    try {
      if (!fs.existsSync(projectImagesDir)) {
        return res.json({ images: [] });
      }
      const files = fs.readdirSync(projectImagesDir);
      const images = files
        .filter((file) => !file.startsWith('.') && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file))
        .map((file) => {
          const filePath = path.join(projectImagesDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            url: `/projects/images/${file}`,
            size: stats.size,
            updatedAt: stats.mtime.toISOString(),
          };
        });
      res.json({ images });
    } catch (err: any) {
      console.error('Error reading project images directory:', err);
      res.status(500).json({ error: 'Failed to list project images', details: err?.message });
    }
  });

  // Upload an image physically to /public/projects/images/
  app.post('/api/upload-image', (req, res) => {
    try {
      const { image, filename: preferredFilename, projectId, folder = 'projects' } = req.body;

      if (!image || typeof image !== 'string') {
        return res.status(400).json({ error: 'No image data provided' });
      }

      // If it's already an absolute or relative public path, return it directly
      if (image.startsWith('/projects/images/')) {
        return res.json({
          success: true,
          url: image,
          filename: path.basename(image),
          isExisting: true,
        });
      }

      // If it's a data URL: parse and save physically
      if (image.startsWith('data:')) {
        const commaIdx = image.indexOf(',');
        if (commaIdx === -1) {
          return res.status(400).json({ error: 'Invalid data URL: missing comma delimiter' });
        }

        const metaPart = image.slice(0, commaIdx).toLowerCase();
        const base64Data = image.slice(commaIdx + 1).replace(/\s+/g, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Determine file extension
        let ext = 'jpg';
        if (metaPart.includes('png')) ext = 'png';
        else if (metaPart.includes('webp')) ext = 'webp';
        else if (metaPart.includes('gif')) ext = 'gif';
        else if (metaPart.includes('svg')) ext = 'svg';
        else if (metaPart.includes('jpeg') || metaPart.includes('jpg')) ext = 'jpg';
        else if (metaPart.includes('avif')) ext = 'avif';

        // Generate safe unique filename preserving original project context
        const safeProjectId = (projectId || 'project')
          .toString()
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '-');
        const timestamp = Date.now();

        let cleanNamePart = '';
        if (preferredFilename && typeof preferredFilename === 'string') {
          const parsed = path.parse(preferredFilename);
          const sanitized = parsed.name
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 32);
          if (sanitized.length >= 2) {
            cleanNamePart = `-${sanitized}`;
          }
        }

        const finalFilename = `${safeProjectId}-${timestamp}${cleanNamePart}.${ext}`;

        const targetFilePath = path.join(projectImagesDir, finalFilename);
        fs.writeFileSync(targetFilePath, buffer);

        // Also mirror to dist if exists
        const distImgDir = path.join(process.cwd(), 'dist', 'projects', 'images');
        try {
          if (!fs.existsSync(distImgDir)) {
            fs.mkdirSync(distImgDir, { recursive: true });
          }
          fs.writeFileSync(path.join(distImgDir, finalFilename), buffer);
        } catch {
          // ignore
        }

        console.log(`[Upload API] Saved project image to ${targetFilePath} (${buffer.length} bytes)`);

        const savedUrl = `/projects/images/${finalFilename}`;

        // Immediately auto-sync this image into BOTH public/data/portfolioData.json AND src/data/portfolioData.ts
        // so that the project permanently retains this image in git, build, export, and preview!
        if (projectId) {
          try {
            const jsonPath = path.join(publicDataDir, 'portfolioData.json');
            if (fs.existsSync(jsonPath)) {
              const fileContent = fs.readFileSync(jsonPath, 'utf-8');
              const data = JSON.parse(fileContent);
              if (Array.isArray(data.projects)) {
                const targetProject = data.projects.find((p: any) => p.id === projectId);
                if (targetProject) {
                  const isCoverTarget =
                    req.body.asCover === true ||
                    req.body.folder === 'cover' ||
                    !targetProject.imageBanner ||
                    targetProject.imageBanner.includes('gradient(');

                  if (isCoverTarget) {
                    targetProject.imageBanner = savedUrl;
                  }

                  if (!Array.isArray(targetProject.galleryImages)) {
                    targetProject.galleryImages = [];
                  }

                  if (!targetProject.galleryImages.includes(savedUrl)) {
                    if (isCoverTarget) {
                      targetProject.galleryImages.unshift(savedUrl);
                    } else {
                      targetProject.galleryImages.push(savedUrl);
                    }
                  }

                  data.savedAt = new Date().toISOString();
                  persistPortfolioDataFiles(data);
                  console.log(`[Upload API] Auto-synced image into project '${projectId}' in portfolioData.json and portfolioData.ts`);
                }
              }
            }
          } catch (syncErr) {
            console.warn('[Upload API] Non-fatal error auto-syncing image to portfolioData files:', syncErr);
          }
        }

        return res.json({
          success: true,
          url: savedUrl,
          filename: finalFilename,
          size: buffer.length,
          savedLocally: true,
        });
      }

      // If image is a remote URL (http/https), we can optionally download it or keep it as is
      return res.json({
        success: true,
        url: image,
        isRemote: true,
      });
    } catch (err: any) {
      console.error('[Upload API] Error saving image:', err);
      res.status(500).json({ error: 'Internal server error while saving image', details: err?.message });
    }
  });

  // Helper to persist base64 image into physical file in /public/projects/images/
  function persistBase64Image(dataUri: string, prefix: string, filenameSuffix: string): string {
    if (!dataUri || typeof dataUri !== 'string') return dataUri;
    if (!dataUri.startsWith('data:image/')) return dataUri;

    try {
      const commaIdx = dataUri.indexOf(',');
      if (commaIdx === -1) return dataUri;

      const metaPart = dataUri.slice(0, commaIdx).toLowerCase();
      const base64Data = dataUri.slice(commaIdx + 1).replace(/\s+/g, '');
      const buffer = Buffer.from(base64Data, 'base64');

      let ext = 'jpg';
      if (metaPart.includes('png')) ext = 'png';
      else if (metaPart.includes('webp')) ext = 'webp';
      else if (metaPart.includes('gif')) ext = 'gif';
      else if (metaPart.includes('svg')) ext = 'svg';
      else if (metaPart.includes('jpeg') || metaPart.includes('jpg')) ext = 'jpg';
      else if (metaPart.includes('avif')) ext = 'avif';

      const safePrefix = (prefix || 'item')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-');
      const filename = `${safePrefix}-${filenameSuffix}.${ext}`;
      const filePath = path.join(projectImagesDir, filename);
      fs.writeFileSync(filePath, buffer);

      // Also mirror to dist if exists
      const distImgDir = path.join(process.cwd(), 'dist', 'projects', 'images');
      try {
        if (!fs.existsSync(distImgDir)) {
          fs.mkdirSync(distImgDir, { recursive: true });
        }
        fs.writeFileSync(path.join(distImgDir, filename), buffer);
      } catch {
        // ignore
      }

      console.log(`[Persist Base64] Wrote image to ${filePath} (${buffer.length} bytes)`);
      return `/projects/images/${filename}`;
    } catch (err) {
      console.error('[Persist Base64] Failed to extract image:', err);
      return dataUri;
    }
  }

  // Save portfolio data permanently to BOTH /public/data/portfolioData.json AND /src/data/portfolioData.ts
  // Automatically converts any base64 images into physical files in /public/projects/images/
  app.post('/api/save-portfolio-data', (req, res) => {
    try {
      const { profile, projects, skills, experiences, contact } = req.body;

      if (!profile) {
        return res.status(400).json({ error: 'Missing profile dataset' });
      }

      // Guard against accidentally passing empty projects array if state wasn't populated yet
      let activeProjects = Array.isArray(projects) ? projects : [];
      if (activeProjects.length === 0) {
        const jsonFilePath = path.join(publicDataDir, 'portfolioData.json');
        if (fs.existsSync(jsonFilePath)) {
          try {
            const existingData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
            if (Array.isArray(existingData.projects) && existingData.projects.length > 0) {
              activeProjects = existingData.projects;
            }
          } catch {}
        }
      }

      // Auto-extract and physically store any base64 avatar image
      const sanitizedProfile = { ...profile };
      if (sanitizedProfile.avatarUrl && sanitizedProfile.avatarUrl.startsWith('data:image/')) {
        sanitizedProfile.avatarUrl = persistBase64Image(sanitizedProfile.avatarUrl, 'profile', 'avatar');
      }

      // Auto-extract and physically store any base64 project images
      const sanitizedProjects = activeProjects.map((proj: any, pIdx: number) => {
        const pId = proj.id || `project-${pIdx + 1}`;
        const updated = { ...proj };

        if (updated.imageBanner && updated.imageBanner.startsWith('data:image/')) {
          updated.imageBanner = persistBase64Image(updated.imageBanner, pId, 'cover');
        }

        if (Array.isArray(updated.galleryImages)) {
          updated.galleryImages = updated.galleryImages.map((img: string, gIdx: number) => {
            if (img && typeof img === 'string' && img.startsWith('data:image/')) {
              return persistBase64Image(img, pId, `gallery-${gIdx + 1}`);
            }
            return img;
          });
        }

        return updated;
      });

      const payload = {
        profile: sanitizedProfile,
        projects: sanitizedProjects,
        skills,
        experiences,
        contact,
        savedAt: new Date().toISOString(),
      };

      // Write to BOTH JSON and TS files
      persistPortfolioDataFiles(payload);

      console.log(`[Data API] Successfully synchronized portfolioData.json and portfolioData.ts at ${payload.savedAt}`);

      return res.json({
        success: true,
        message: 'تمامی تصاویر و تنظیمات با موفقیت در پوشه public/projects/images/ و سورس‌کد پروژه ثبت شدند.',
        savedAt: payload.savedAt,
        sanitizedProfile,
        sanitizedProjects,
        filesUpdated: [
          '/public/projects/images/',
          '/public/data/portfolioData.json',
          '/src/data/portfolioData.ts',
        ],
      });
    } catch (err: any) {
      console.error('[Data API] Error saving portfolio data:', err);
      res.status(500).json({ error: 'Failed to save portfolio data', details: err?.message });
    }
  });

  // Get baked portfolio data
  app.get('/api/portfolio-data', (req, res) => {
    try {
      const jsonFilePath = path.join(publicDataDir, 'portfolioData.json');
      if (fs.existsSync(jsonFilePath)) {
        const content = fs.readFileSync(jsonFilePath, 'utf-8');
        return res.json(JSON.parse(content));
      }
      return res.status(404).json({ error: 'No custom portfolio data found yet' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to read custom portfolio data', details: err?.message });
    }
  });

  // Direct high-performance server-side ZIP export of all uploaded images (including 3MB+ images), data, and configs
  app.get('/api/export-zip', async (req, res) => {
    try {
      const zip = new JSZip();

      // 1. Add README
      const readme = `# بسته کامل دارایی‌ها و تصاویر پورتفولیو عرفان جلالی
(Erfan Jalali Portfolio - Complete Assets & Data Bundle)

این فایل شامل تمامی تصاویر پروژه‌ها با کیفیت و حجم کامل، داده‌های پروژه و سورس کد تایپ‌اسکریپت پورتفولیو است.

## محتویات:
- public/projects/images/ : تمامی تصاویر پروژه‌ها (شامل عکس‌های با کیفیت بالا و حجیم)
- public/data/portfolioData.json : ساختار کامل داده‌های پورتفولیو
- src/data/portfolioData.ts : سورس کد داده‌ها برای استقرار یا توسعه

## راهنمای استفاده سریع:
1. عکس‌ها را در پوشه public/projects/images/ پروژه خود قرار دهید.
2. فایل portfolioData.ts را در مسیر src/data/portfolioData.ts جایگزین کنید.
3. با اجرای npm run build خروجی نهایی کامل ساخته می‌شود.
`;
      zip.file('README_PORTFOLIO_ASSETS.md', readme, { compression: 'DEFLATE', compressionOptions: { level: 4 } });

      // 2. Add public/data/portfolioData.json
      const jsonPath = path.join(publicDataDir, 'portfolioData.json');
      if (fs.existsSync(jsonPath)) {
        zip.file('public/data/portfolioData.json', fs.readFileSync(jsonPath, 'utf-8'), {
          compression: 'DEFLATE',
          compressionOptions: { level: 4 },
        });
      }

      // 3. Add src/data/portfolioData.ts
      const tsPath = path.join(srcDataDir, 'portfolioData.ts');
      if (fs.existsSync(tsPath)) {
        zip.file('src/data/portfolioData.ts', fs.readFileSync(tsPath, 'utf-8'), {
          compression: 'DEFLATE',
          compressionOptions: { level: 4 },
        });
      }

      // 4. Add all images directly from disk (using STORE for instant packaging without wasting CPU on re-compressing PNGs)
      if (fs.existsSync(projectImagesDir)) {
        const files = fs.readdirSync(projectImagesDir);
        for (const f of files) {
          if (f.startsWith('.')) continue;
          const fullPath = path.join(projectImagesDir, f);
          if (fs.statSync(fullPath).isFile()) {
            const fileBuffer = fs.readFileSync(fullPath);
            zip.file(`public/projects/images/${f}`, fileBuffer, { compression: 'STORE' });
          }
        }
      }

      const today = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="erfan-jalali-portfolio-assets-${today}.zip"`);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const stream = zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true });
      stream.pipe(res);
    } catch (err: any) {
      console.error('[Export ZIP API] Error generating zip archive:', err);
      res.status(500).json({ error: 'Failed to generate ZIP archive', details: err?.message });
    }
  });

  // API endpoint returning all project source code text files (excluding node_modules and images)
  // Used by client-side robust packager to bundle the full project offline in browser without proxy limits
  app.get('/api/project-source-files', (req, res) => {
    try {
      const excludeDirs = new Set(['node_modules', '.git', 'dist', '.aistudio', '.cache', 'tmp', '.system_generated']);
      const filesMap: Record<string, string> = {};

      const traverse = (currentDir: string, relativeDir = '') => {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          if (excludeDirs.has(entry.name)) continue;
          if (entry.name.startsWith('.') && entry.name !== '.env.example' && entry.name !== '.github') continue;

          const fullPath = path.join(currentDir, entry.name);
          const relPath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;

          if (entry.isDirectory()) {
            if (relPath === 'public/projects/images') continue;
            traverse(fullPath, relPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            const textExts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md', '.example', '.yml', '.yaml', '.svg'];
            if (textExts.includes(ext) || entry.name === 'bun.lock') {
              filesMap[relPath] = fs.readFileSync(fullPath, 'utf-8');
            }
          }
        }
      };

      traverse(process.cwd());
      return res.json({ success: true, files: filesMap });
    } catch (err: any) {
      console.error('[Project Source Files API] Error:', err);
      res.status(500).json({ error: 'Failed to retrieve source files', details: err?.message });
    }
  });

  // Helper function to format byte sizes into readable string
  function formatByteSize(bytes: number, decimals = 1): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Live calculator for total project export size and asset breakdown
  function computeProjectExportStats() {
    const excludeDirs = new Set(['node_modules', '.git', 'dist', '.aistudio', '.cache', 'tmp', '.system_generated']);
    let totalBytes = 0;
    let imageBytes = 0;
    let codeBytes = 0;
    let fileCount = 0;
    let imageCount = 0;

    const traverse = (currentDir: string) => {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          if (excludeDirs.has(entry.name)) continue;
          if (entry.name.startsWith('.') && entry.name !== '.env.example' && entry.name !== '.github') continue;

          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            traverse(fullPath);
          } else if (entry.isFile()) {
            fileCount++;
            const stat = fs.statSync(fullPath);
            const size = stat.size;
            totalBytes += size;
            if (fullPath.includes(path.join('public', 'projects', 'images'))) {
              imageCount++;
              imageBytes += size;
            } else {
              codeBytes += size;
            }
          }
        }
      } catch (e) {
        // ignore unreadable
      }
    };

    traverse(process.cwd());

    return {
      totalBytes,
      formattedTotal: formatByteSize(totalBytes),
      imageBytes,
      formattedImages: formatByteSize(imageBytes),
      imageCount,
      codeBytes,
      formattedCode: formatByteSize(codeBytes),
      fileCount,
      timestamp: new Date().toISOString(),
    };
  }

  // Real-time API endpoint returning live bundle size and asset counts
  app.get('/api/export-stats', (req, res) => {
    try {
      const stats = computeProjectExportStats();
      return res.json(stats);
    } catch (err: any) {
      console.error('[Export Stats API] Error computing export stats:', err);
      res.status(500).json({ error: 'Failed to compute export stats', details: err?.message });
    }
  });

  // Direct high-performance server-side ZIP export of the COMPLETE ready-to-run project source code
  // Supports both GET (stream direct) and POST (bakes latest changes into files before zipping)
  app.all('/api/export-full-project', async (req, res) => {
    try {
      // If POST with latest state payload was passed, bake everything directly into source files first!
      if (req.method === 'POST' && req.body && req.body.profile) {
        try {
          const { profile, projects, skills, experiences, contact } = req.body;
          const sanitizedProfile = { ...profile };
          if (sanitizedProfile.avatarUrl && sanitizedProfile.avatarUrl.startsWith('data:image/')) {
            sanitizedProfile.avatarUrl = persistBase64Image(sanitizedProfile.avatarUrl, 'profile', 'avatar');
          }
          let activeProjects = Array.isArray(projects) ? projects : [];
          const sanitizedProjects = activeProjects.map((proj: any, pIdx: number) => {
            const pId = proj.id || `project-${pIdx + 1}`;
            const updated = { ...proj };
            if (updated.imageBanner && updated.imageBanner.startsWith('data:image/')) {
              updated.imageBanner = persistBase64Image(updated.imageBanner, pId, 'cover');
            }
            if (Array.isArray(updated.galleryImages)) {
              updated.galleryImages = updated.galleryImages.map((img: string, gIdx: number) => {
                if (img && typeof img === 'string' && img.startsWith('data:image/')) {
                  return persistBase64Image(img, pId, `gallery-${gIdx + 1}`);
                }
                return img;
              });
            }
            return updated;
          });

          persistPortfolioDataFiles({
            profile: sanitizedProfile,
            projects: sanitizedProjects,
            skills,
            experiences,
            contact,
            savedAt: new Date().toISOString(),
          });
          console.log('[Export Full Project] Automatically baked latest changes prior to creating ZIP');
        } catch (bakeErr) {
          console.warn('[Export Full Project] Pre-sync warning:', bakeErr);
        }
      }

      const zip = new JSZip();
      const excludeDirs = new Set(['node_modules', '.git', 'dist', '.aistudio', '.cache', 'tmp', '.system_generated']);

      // 1. Add Guide for Running the Project Offline
      const offlineReadme = `# پورتفولیو و رزومه شخصی عرفان جلالی (Erfan Jalali Portfolio)
## بسته کامل سورس‌کد پروژه آماده اجرا و استقرار (Ready-to-Build Source Code)

این فایل شامل سورس‌کد کامل پروژه با آخرین تنظیمات، متن‌ها، اطلاعات تماس و تمام تصاویر پروژه‌ها با کیفیت بالا در پوشه \`public/projects/images/\` است.

---

### پیش‌نیازها:
- نصب بودن **Node.js** (نسخه 18 یا بالاتر)
- مدیریت بسته‌ها: **npm** یا **pnpm** یا **yarn**

---

### مراحل اجرای پروژه به صورت محلی (Local Development):
1. فایل زیپ را در یک پوشه دلخواه استخراج (Extract) کنید.
2. ترمینال (Terminal / Command Prompt) را درون آن پوشه باز کنید.
3. دستور زیر را برای نصب وابستگی‌ها اجرا نمایید:
   \`\`\`bash
   npm install
   \`\`\`
4. برای اجرای زنده پروژه با محیط توسعه:
   \`\`\`bash
   npm run dev
   \`\`\`
   سپس آدرس نمایش‌داده‌شده (معمولاً \`http://localhost:3000\`) را در مرورگر باز کنید.

---

### ساخت خروجی نهایی مستقل برای انتشار (Production Build):
برای ساخت فایل‌های استاتیک جهت آپلود روی گیت‌هاب پیجز (GitHub Pages)، سرور، هاست سی‌پنل (cPanel) یا هر هاستینگ دیگر:
\`\`\`bash
npm run build
\`\`\`
پوشه \`dist\` ایجاد می‌شود که حاوی کل سایت به صورت مستقل و بدون نیاز به سرور یا پایگاه‌داده است و تمام تصاویر مستقیماً از داخل آن لود می‌شوند.

موفق باشید!
`;
      zip.file('README_OFFLINE_GUIDE.md', offlineReadme, { compression: 'DEFLATE', compressionOptions: { level: 4 } });

      // 2. Recursive function to add project files
      const addDirectoryToZip = (currentDir: string, zipFolder: JSZip) => {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          if (excludeDirs.has(entry.name)) continue;
          if (entry.name.startsWith('.') && entry.name !== '.env.example' && entry.name !== '.github') continue;

          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            addDirectoryToZip(fullPath, zipFolder.folder(entry.name)!);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            const isCompressed = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.zip', '.woff', '.woff2'].includes(ext);
            const fileData = fs.readFileSync(fullPath);
            zipFolder.file(entry.name, fileData, {
              compression: isCompressed ? 'STORE' : 'DEFLATE',
              compressionOptions: isCompressed ? undefined : { level: 4 },
            });
          }
        }
      };

      addDirectoryToZip(process.cwd(), zip);

      const today = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="erfan-jalali-portfolio-full-project-${today}.zip"`);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const stream = zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true });
      stream.pipe(res);
    } catch (err: any) {
      console.error('[Export Full Project API] Error generating full project zip:', err);
      res.status(500).json({ error: 'Failed to generate full project ZIP archive', details: err?.message });
    }
  });

  // ==========================================
  // STATIC ASSETS & DIRECT FILE SERVING
  // ==========================================
  // Direct static handler for uploaded project images with proper MIME type headers
  app.use('/projects/images', (req, res, next) => {
    const rawPath = decodeURIComponent(req.path.split('?')[0]);
    const filename = path.basename(rawPath);
    if (!filename || filename === '.' || filename === '/') return next();

    // 1. Check exact match in public/projects/images
    const publicFilePath = path.join(projectImagesDir, filename);
    if (fs.existsSync(publicFilePath) && !fs.statSync(publicFilePath).isDirectory()) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(publicFilePath);
    }

    // 2. Check exact match in dist/projects/images
    const distFilePath = path.join(process.cwd(), 'dist', 'projects', 'images', filename);
    if (fs.existsSync(distFilePath) && !fs.statSync(distFilePath).isDirectory()) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(distFilePath);
    }

    // 3. Alternate extension check (e.g. .jpg requested but .svg exists or vice-versa)
    const baseNameWithoutExt = path.parse(filename).name;
    const alternateExts = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];
    for (const altExt of alternateExts) {
      const altPub = path.join(projectImagesDir, `${baseNameWithoutExt}${altExt}`);
      if (fs.existsSync(altPub) && !fs.statSync(altPub).isDirectory()) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.sendFile(altPub);
      }
      const altDist = path.join(process.cwd(), 'dist', 'projects', 'images', `${baseNameWithoutExt}${altExt}`);
      if (fs.existsSync(altDist) && !fs.statSync(altDist).isDirectory()) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.sendFile(altDist);
      }
    }

    // 4. If image not found, return 404 text/plain instead of letting Vite serve index.html
    return res.status(404).type('txt').send('Image not found');
  });

  app.use('/data', (req, res, next) => {
    const filename = path.basename(req.path);
    if (!filename) return next();

    const publicFilePath = path.join(publicDataDir, filename);
    if (fs.existsSync(publicFilePath) && !fs.statSync(publicFilePath).isDirectory()) {
      res.setHeader('Content-Type', 'application/json');
      return res.sendFile(publicFilePath);
    }

    const distFilePath = path.join(process.cwd(), 'dist', 'data', filename);
    if (fs.existsSync(distFilePath) && !fs.statSync(distFilePath).isDirectory()) {
      res.setHeader('Content-Type', 'application/json');
      return res.sendFile(distFilePath);
    }

    next();
  });

  app.use(express.static(publicDir));

  // ==========================================
  // VITE MIDDLEWARE / SPA FALLBACK
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: [
            '**/public/projects/images/**',
            '**/public/data/**',
            '**/dist/**',
            '**/src/data/portfolioData.ts',
            '**/*.json',
          ],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
