import { useAuth } from "@workspace/replit-auth-web";
import { useListFavorites, useGetUserStats } from "@workspace/api-client-react";
import { useAppSettings } from "@/contexts/app-settings";
import { useLocalFormulaViews } from "@/hooks/use-local-views";
import { useLocation, Link } from "wouter";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User, Mail, LogOut, LogIn, Telescope, Star, BookOpen, FlaskConical,
  Sun, Moon, Volume2, ArrowRight, RotateCcw,
} from "lucide-react";

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

function getDisplayName(firstName?: string | null, lastName?: string | null): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Anonymous";
}

function shortVoiceName(voice: SpeechSynthesisVoice, idx: number): string {
  const name = voice.name;
  if (name.length <= 22) return name;
  return `Voice ${idx + 1}`;
}

export default function Account() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  const { data: favorites } = useListFavorites();
  const { data: stats } = useGetUserStats({ query: { enabled: isAuthenticated, queryKey: ["/api/user/stats"] } });
  const {
    theme, setTheme,
    voiceURI, setVoiceURI,
    volume, setVolume,
    lastVisited, availableVoices,
  } = useAppSettings();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Telescope className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Sign in to Xquation</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Create an account to save your favorite formulas, track your progress, and get personalized recommendations.
          </p>
        </div>
        <Button
          onClick={login}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-8"
          size="lg"
        >
          <LogIn className="w-4 h-4" />
          Log In
        </Button>

        <div className="grid grid-cols-3 gap-4 w-full mt-2">
          {[
            { icon: FlaskConical, label: "32 Formulas", href: "/formulas" },
            { icon: Star, label: "Save Favorites", href: "/favorites" },
            { icon: BookOpen, label: "Practice Problems", href: "/problems" },
          ].map(({ icon: Icon, label, href }) => (
            <Link key={label} href={href} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors">
              <Icon className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Account</h1>

      {/* Profile */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-muted-foreground font-medium">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/30">
              <AvatarImage src={user?.profileImageUrl ?? undefined} alt={getDisplayName(user?.firstName, user?.lastName)} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-foreground truncate">
                {getDisplayName(user?.firstName, user?.lastName)}
              </p>
              <Badge variant="outline" className="mt-1 text-xs border-primary/30 text-primary">
                {(user?.role ?? "user") === "owner" ? "Owner" : "Student"}
              </Badge>
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-3">
            {user?.email && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-foreground">{user.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-foreground">{getDisplayName(user?.firstName, user?.lastName)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-muted-foreground font-medium">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Star, label: "Saved Favorites", value: favorites != null ? String(favorites.length) : "—" },
              { icon: FlaskConical, label: "Formulas Viewed", value: stats != null ? String(stats.formulasViewed) : "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="p-4 rounded-lg bg-background border border-border flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <p className="text-xl font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <PreferencesCards
        theme={theme} setTheme={setTheme}
        voiceURI={voiceURI} setVoiceURI={setVoiceURI}
        volume={volume} setVolume={setVolume}
        availableVoices={availableVoices}
        lastVisited={lastVisited}
        onResume={() => lastVisited && navigate(lastVisited.path)}
      />

      {/* Session */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-muted-foreground font-medium">Session</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={logout}
            className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface PreferencesCardsProps {
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
  voiceURI: string;
  setVoiceURI: (uri: string) => void;
  volume: number;
  setVolume: (v: number) => void;
  availableVoices: SpeechSynthesisVoice[];
  lastVisited: { path: string; label: string } | null;
  onResume: () => void;
}

function PreferencesCards({
  theme, setTheme,
  voiceURI, setVoiceURI,
  volume, setVolume,
  availableVoices,
  lastVisited,
  onResume,
}: PreferencesCardsProps) {
  return (
    <>
      {/* Appearance */}
      <Card className="bg-card border-border w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-muted-foreground font-medium">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                {theme === "dark" ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {theme === "dark" ? "Dark Mode" : "Light Mode"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {theme === "dark" ? "Easy on the eyes at night" : "Best for bright environments"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                theme === "dark" ? "bg-primary" : "bg-muted"
              }`}
              role="switch"
              aria-checked={theme === "dark"}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  theme === "dark" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Read Aloud */}
      <Card className="bg-card border-border w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-muted-foreground font-medium">Read Aloud</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Voice picker */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Voice</p>
            {availableVoices.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No voices available — your browser may not support speech synthesis.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-1.5">
                {availableVoices.map((v, i) => {
                  const selected = voiceURI === v.voiceURI || (!voiceURI && i === 0);
                  return (
                    <button
                      key={v.voiceURI}
                      onClick={() => {
                        setVoiceURI(v.voiceURI);
                        const sample = new SpeechSynthesisUtterance("Hello, welcome to xquation");
                        sample.voice = v;
                        sample.volume = volume;
                        sample.rate = 0.92;
                        window.speechSynthesis.cancel();
                        window.speechSynthesis.speak(sample);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                        selected
                          ? "border-primary/60 bg-primary/10 text-foreground"
                          : "border-border bg-background hover:border-primary/30 hover:bg-primary/5 text-muted-foreground"
                      }`}
                    >
                      <Volume2 className={`w-4 h-4 shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-medium truncate">{shortVoiceName(v, i)}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground shrink-0">{v.lang}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Volume slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Volume</p>
              <span className="text-xs text-muted-foreground">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pick up where you left off */}
      {lastVisited && (
        <Card className="bg-card border-border w-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-muted-foreground font-medium">Pick Up Where You Left Off</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{lastVisited.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{lastVisited.path}</p>
                </div>
              </div>
              <Button
                onClick={onResume}
                size="sm"
                className="shrink-0 gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
                variant="outline"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
