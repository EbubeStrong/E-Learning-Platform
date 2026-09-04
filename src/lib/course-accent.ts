const COURSE_ACCENT_BY_CATEGORY: Record<string, string> = {
  "Web Development": "from-[#0d1d4a] via-[#0d2f6a] to-[#1d6ef5]",
  "UI/UX Design": "from-[#9a7efb] via-[#b69afc] to-[#d9c8ff]",
  "Machine Learning": "from-[#0d0d0f] via-[#18181b] to-[#f7df1e]",
  "Data Analytics": "from-[#0e5a3a] via-[#12805a] to-[#37c39a]",
  Programming: "from-[#0d0d0f] via-[#18181b] to-[#0d0d0f]",
  Design: "from-[#9a7efb] via-[#b69afc] to-[#d9c8ff]",
  "Data Science": "from-[#0d1d4a] via-[#0d2f6a] to-[#1d6ef5]",
};

const DEFAULT_ACCENT = "from-[#0d1d4a] via-[#0d2f6a] to-[#1d6ef5]";

export function getCourseAccent(category: string): string {
  return COURSE_ACCENT_BY_CATEGORY[category] ?? DEFAULT_ACCENT;
}
