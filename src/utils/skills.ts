export interface SkillLevelInfo {
  tag: string;
  persianLabel: string;
  colorClass: string;
  badgeBg: string;
}

/**
 * Maps a percentage (0-100) to standard qualitative skill tiers:
 * - 90% - 100%: Expert (متخصص / ارشد)
 * - 80% - 89%:  Advanced (پیشرفته)
 * - 65% - 79%:  Proficient (کارآزموده / مسلط)
 * - 50% - 64%:  Intermediate (متوسط)
 * - 30% - 49%:  Basic (مقدماتی / پایه‌ای)
 * - 0%  - 29%:  Beginner (مبتدی)
 */
export function getSkillLevelInfo(level: number): SkillLevelInfo {
  const normalizedLevel = Math.max(0, Math.min(100, Math.round(level)));

  if (normalizedLevel >= 90) {
    return {
      tag: 'Expert',
      persianLabel: 'متخصص / ارشد',
      colorClass: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-sm',
    };
  }
  if (normalizedLevel >= 80) {
    return {
      tag: 'Advanced',
      persianLabel: 'پیشرفته',
      colorClass: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 shadow-sm',
    };
  }
  if (normalizedLevel >= 65) {
    return {
      tag: 'Proficient',
      persianLabel: 'کارآزموده / مسلط',
      colorClass: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 shadow-sm',
    };
  }
  if (normalizedLevel >= 50) {
    return {
      tag: 'Intermediate',
      persianLabel: 'متوسط',
      colorClass: 'text-amber-400',
      badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300 shadow-sm',
    };
  }
  if (normalizedLevel >= 30) {
    return {
      tag: 'Basic',
      persianLabel: 'پایه‌ای / مقدماتی',
      colorClass: 'text-orange-400',
      badgeBg: 'bg-orange-500/15 border-orange-500/30 text-orange-300 shadow-sm',
    };
  }
  return {
    tag: 'Beginner',
    persianLabel: 'مبتدی',
    colorClass: 'text-rose-400',
    badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-300 shadow-sm',
  };
}

export function getSkillTagFromLevel(level: number): string {
  return getSkillLevelInfo(level).tag;
}
