<div align="center">
<img width="1200" height="475" alt="Erfan Jalali Portfolio Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Erfan Jalali — Game Developer & Unity Programmer

**Crafting immersive interactive worlds, high-performance gameplay systems, and real-time graphics shaders.**

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-brightgreen?style=for-the-badge&logo=github)](https://erfanjalali2007.github.io/)
[![Unity](https://img.shields.io/badge/Unity-2022%20%7C%206%20LTS-black?style=for-the-badge&logo=unity)](https://unity.com/)
[![C#](https://img.shields.io/badge/C%23-.NET%208-239120?style=for-the-badge&logo=c-sharp)](https://docs.microsoft.com/en-us/dotnet/csharp/)
[![HLSL](https://img.shields.io/badge/HLSL-Shaders-red?style=for-the-badge&logo=opengl)](https://github.com/erfanJalali2007)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare)](https://workers.cloudflare.com/)

[**Explore Live Website**](https://erfanjalali2007.github.io/) • [**Itch.io**](https://erfanjalali.itch.io) • [**LinkedIn**](https://linkedin.com/in/erfanjalali) • [**Contact**](mailto:erfanjalaliwork@gmail.com)

</div>

---

## 💎 About the Portfolio & Design System

This website is the official portfolio of **Erfan Jalali**, specializing in Unity game development, C# gameplay architecture, zero-allocation engine systems, and HLSL compute/screen-space shaders.

Built from the ground up using the signature **Liquid Glass** aesthetic:
- **Interactive Liquid Caustics**: GPU-accelerated fluid canvas simulating light refraction, chromatic dispersion, and fluid physics reacting dynamically to pointer movement and click ripples.
- **Dynamic Specular Glass**: Layered glass cards with optical highlights, configurable blur levels (16px, 28px, 44px), variable opacity, and subtle audio resonance feedback.
- **5 Curated Themes**: Dark Red Glass (Ruby), Prismatic Fluid, Crystal Water, Smoked Obsidian, and Liquid Honey.
- **Full Sound Effects & Zen Mode**: Generative Web Audio API glass chimes and interactive caustic canvas mode.

---

## 🎮 Featured Game Projects

| Project | Engine / Stack | Description | Status |
| :--- | :--- | :--- | :--- |
| **[Forsaken Hospital Prototype](https://github.com/erfanJalali2007/Forsaken-Hospital-Prototype)** | Unity (URP) & C# | Modular survival horror framework with procedural weapon sway, physical inspection, flashlight flicker, and analog door manipulation. | In Development |
| **[Aetheria: Chrono Veil](https://github.com/erfanjalali/chrono-veil-core)** | Unity 2022.3 LTS & HLSL | 3D action-adventure featuring localized time-dilation bubbles, state-machine melee combos, and custom refraction shaders. | Completed |
| **[Liquid Caustics & Glass Shaders](https://github.com/erfanjalali/unity-liquid-caustics-suite)** | Unity 6 URP & Compute | Modular HLSL shader library solving physical Beer-Lambert light absorption, RGB chromatic dispersion, and procedural Gerstner waves. | Completed |
| **[Nexus DOTS Swarm Architecture](https://github.com/erfanjalali/nexus-dots-swarm)** | Unity DOTS & Burst | High-throughput crowd simulation processing 15,000+ autonomous AI entities at 60 FPS using multi-threaded spatial hashing. | Completed |
| **[Vanguard: Grid Tactics](https://github.com/erfanjalali/vanguard-tactics-engine)** | Unity 2022.3 & C# | Turn-based squad tactics RPG with procedural hexagonal battlefields, volumetric line-of-sight, and scriptable card abilities. | In Development |

---

## 🏗️ Architecture Overview

The project is structured into a modern decoupled architecture:

```
├── src/                               # Frontend Single-Page Application
│   ├── components/                    # Liquid Glass UI components
│   │   ├── GlassCard.tsx              # Hero profile & dynamic specular card
│   │   ├── GlassDock.tsx              # Floating macOS-style control dock
│   │   ├── LiquidCanvas.tsx           # Interactive WebGL/Canvas caustics physics
│   │   ├── ProjectsSection.tsx        # Filterable game project showcase
│   │   ├── SkillsSection.tsx          # Interactive radar & proficiency matrix
│   │   ├── ExperienceSection.tsx      # Timeline of commercial & indie shipped titles
│   │   ├── ContactSection.tsx         # Direct contact form with webhook dispatch
│   │   └── SettingsSection.tsx        # Liquid Glass visual & audio customizer
│   ├── data/                          # Structured portfolio data & theme definitions
│   ├── services/api.ts                # Client API bridge with seamless offline fallback
│   ├── utils/audio.ts                 # Web Audio synthesizer for glass acoustic feedback
│   ├── index.css                      # Tailwind CSS v4 & custom specular border styles
│   └── App.tsx                        # Main state orchestrator & section routing
│
├── worker/                            # Cloudflare Worker Serverless Backend
│   ├── src/index.ts                   # Edge REST API proxy & secure contact processor
│   ├── wrangler.jsonc                 # Cloudflare Worker configuration & environment vars
│   └── package.json                   # Worker dependencies & Wrangler runtime
│
└── .github/workflows/deploy.yml       # Automated GitHub Pages CI/CD pipeline
```

### Key Technical Highlights:
- **Resilient Offline Architecture**: If the Cloudflare Worker backend is offline or unconfigured, the frontend automatically falls back to rich local structured data without throwing runtime errors or breaking the UI.
- **Zero Exposed Secrets**: All sensitive tokens (`GITHUB_TOKEN`, `CONTACT_WEBHOOK_URL`) reside exclusively in serverless worker environment variables.

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher

### 1. Clone the repository
```bash
git clone https://github.com/erfanJalali2007/erfanjalali2007.github.io.git
cd erfanjalali2007.github.io
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the Frontend Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. (Optional) Run the Cloudflare Worker Locally
```bash
npm run worker:dev
```
The local Worker API will start on [http://127.0.0.1:8787](http://127.0.0.1:8787).

---

## 📦 Building for Production

To build the static application bundle:
```bash
npm run build
```
Output assets are bundled to `./dist` and automatically deployed to GitHub Pages on every push to `main`.

---

## 📬 Contact & Connect

- **Portfolio**: [erfanjalali2007.github.io](https://erfanjalali2007.github.io/)
- **Email**: [erfanjalaliwork@gmail.com](mailto:erfanjalaliwork@gmail.com)
- **GitHub**: [@erfanJalali2007](https://github.com/erfanJalali2007)
- **Itch.io**: [erfanjalali.itch.io](https://erfanjalali.itch.io)
- **LinkedIn**: [linkedin.com/in/erfanjalali](https://linkedin.com/in/erfanjalali)

---

<div align="center">
  <sub>Designed & Developed with the <strong>Liquid Glass</strong> design system. © 2026 Erfan Jalali.</sub>
</div>
