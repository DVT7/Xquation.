import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export type Theme = "dark" | "light";

interface LastVisited {
  path: string;
  label: string;
}

interface AppSettings {
  theme: Theme;
  voiceURI: string;
  volume: number;
  lastVisited: LastVisited | null;
}

interface AppSettingsContextType extends AppSettings {
  setTheme: (t: Theme) => void;
  setVoiceURI: (uri: string) => void;
  setVolume: (v: number) => void;
  setLastVisited: (lv: LastVisited | null) => void;
  availableVoices: SpeechSynthesisVoice[];
}

const STORAGE_KEY = "xqution-settings";

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults(), ...JSON.parse(raw) };
  } catch {}
  return defaults();
}

function defaults(): AppSettings {
  return { theme: "dark", voiceURI: "", volume: 1, lastVisited: null };
}

function save(s: AppSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

const Ctx = createContext<AppSettingsContextType | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    if (settings.theme === "dark") {
      el.classList.add("dark");
    } else {
      el.classList.remove("dark");
    }
  }, [settings.theme]);

  useEffect(() => {
    const pick = () => {
      const all = window.speechSynthesis?.getVoices() ?? [];
      const en = all.filter(v => v.lang.startsWith("en"));
      const unique: SpeechSynthesisVoice[] = [];
      const seen = new Set<string>();
      for (const v of en) {
        const key = `${v.lang}-${v.name.toLowerCase().includes("female") ? "f" : v.name.toLowerCase().includes("male") ? "m" : v.name.slice(0, 6)}`;
        if (!seen.has(key)) { seen.add(key); unique.push(v); }
        if (unique.length >= 5) break;
      }
      if (unique.length === 0 && all.length > 0) {
        for (const v of all.slice(0, 5)) unique.push(v);
      }
      if (unique.length > 0) setAvailableVoices(unique);
    };
    pick();
    window.speechSynthesis?.addEventListener("voiceschanged", pick);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", pick);
  }, []);

  const ctx: AppSettingsContextType = {
    ...settings,
    setTheme: t => update({ theme: t }),
    setVoiceURI: uri => update({ voiceURI: uri }),
    setVolume: v => update({ volume: v }),
    setLastVisited: lv => update({ lastVisited: lv }),
    availableVoices,
  };

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export function useAppSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppSettings must be inside AppSettingsProvider");
  return ctx;
}
