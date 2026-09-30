import { useAuth } from "@workspace/replit-auth-web";
import { useListFavorites, useGetUserStats, useGetAchievements, getGetAchievementsQueryKey, type Achievement } from "@workspace/api-client-react";
import { useAppSettings } from "@/contexts/app-settings";
import { useLocalFormulaViews } from "@/hooks/use-local-views";
import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User, Mail, LogOut, LogIn, Telescope, Star, BookOpen, FlaskConical,
  Sun, Moon, Volume2, ArrowRight, RotateCcw, MessageSquare, AlertCircle, Lightbulb, CheckCircle,
  Reply, ChevronDown, ChevronUp, Clock, Send, Crown, Trophy, Flame, MousePointerClick,
  Library, Sparkles, Users, UserRound,
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
  const { data: achievementData, isLoading: achievementsLoading } = useGetAchievements({
    query: { enabled: isAuthenticated, queryKey: getGetAchievementsQueryKey() },
  });
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
          <h1 className="text-2xl font-bold text-foreground mb-2">Sign in to XQuation</h1>
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
              {user?.role === "owner" && (
                <Link href="/owner-dashboard">
                  <Badge className="mt-1 text-xs bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors ml-1">
                    <Crown className="w-3 h-3 mr-1" /> Dashboard
                  </Badge>
                </Link>
              )}
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

      <AchievementsSection achievements={achievementData?.achievements ?? []} isLoading={achievementsLoading} />

      {/* Preferences */}
      <PreferencesCards
        theme={theme} setTheme={setTheme}
        voiceURI={voiceURI} setVoiceURI={setVoiceURI}
        volume={volume} setVolume={setVolume}
        availableVoices={availableVoices}
        lastVisited={lastVisited}
        onResume={() => lastVisited && navigate(lastVisited.path)}
      />

      {/* Owner Inbox — only the owner sees this */}
      {user?.role === "owner" && <OwnerFeedbackInbox />}

      {/* Replies from owner — visible to regular users */}
      {user?.role !== "owner" && <UserRepliesSection />}

      {/* Feedback */}
      <FeedbackCard />

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

function achievementIcon(icon: string) {
  const Icon = icon === "flame"
    ? Flame
    : icon === "mouse-pointer-click"
      ? MousePointerClick
      : icon === "volume-2"
        ? Volume2
        : icon === "library"
          ? Library
          : icon === "sparkles"
            ? Sparkles
            : icon === "crown"
              ? Crown
              : icon === "users"
                ? Users
                : icon === "user-round"
                  ? UserRound
              : Trophy;
  return Icon;
}

function AchievementsSection({ achievements, isLoading }: { achievements: Achievement[]; isLoading: boolean }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" /> Achievements
        </CardTitle>
        <p className="text-xs text-muted-foreground">Milestones earned across your XQuation journey.</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner className="w-5 h-5 text-primary" /></div>
        ) : achievements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No achievements are currently enabled.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map((achievement) => {
              const Icon = achievementIcon(achievement.icon);
              const target = achievement.target ?? 1;
              const progress = Math.min(achievement.progress, target);
              const percent = achievement.completed ? 100 : Math.round((progress / Math.max(target, 1)) * 100);
              return (
                <div
                  key={achievement.key}
                  className={`rounded-lg border p-3 transition-colors ${
                    achievement.completed
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/60 bg-background"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      achievement.completed ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground leading-snug">{achievement.name}</p>
                        {achievement.completed && <Badge className="text-[10px] bg-primary/15 text-primary border-primary/20 shrink-0">Earned</Badge>}
                      </div>
                      {achievement.description && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{achievement.description}</p>
                      )}
                      {!achievement.completed && (
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{achievement.progress.toLocaleString()} / {target.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const COMPLAINT_FEATURES = [
  "Formulas", "Constants", "Calculators", "Unit Converter",
  "Read Aloud", "Practice Problems", "Favorites", "Glossary",
  "Donate", "Account", "Other",
];

function FeedbackCard() {
  const [type, setType] = useState<"suggestion" | "complaint" | null>(null);
  const [feature, setFeature] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleTypeChange = (t: "suggestion" | "complaint") => {
    setType(t);
    setFeature(null);
    if (status === "error") setStatus("idle");
  };

  const canSubmit = type === "suggestion"
    ? message.trim().length >= 5
    : type === "complaint"
    ? !!feature && message.trim().length >= 5
    : false;

  const handleSubmit = async () => {
    if (!canSubmit || status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type, feature: type === "complaint" ? feature : undefined, message: message.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      setMessage("");
      setType(null);
      setFeature(null);
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
          <CheckCircle className="w-10 h-10 text-green-500" />
          <p className="font-semibold text-foreground">Thanks for your feedback!</p>
          <p className="text-sm text-muted-foreground">We'll review it and use it to improve XQuation.</p>
          <Button variant="ghost" size="sm" onClick={() => setStatus("idle")} className="mt-1 text-primary">
            Send another
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleTypeChange("suggestion")}
            className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
              type === "suggestion"
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-border bg-background hover:border-primary/30 text-muted-foreground"
            }`}
          >
            <Lightbulb className={`w-4 h-4 shrink-0 ${type === "suggestion" ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-sm font-medium">Suggestion</span>
          </button>
          <button
            onClick={() => handleTypeChange("complaint")}
            className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
              type === "complaint"
                ? "border-destructive/60 bg-destructive/10 text-foreground"
                : "border-border bg-background hover:border-destructive/30 text-muted-foreground"
            }`}
          >
            <AlertCircle className={`w-4 h-4 shrink-0 ${type === "complaint" ? "text-destructive" : "text-muted-foreground"}`} />
            <span className="text-sm font-medium">Complaint</span>
          </button>
        </div>

        {/* Feature picker — complaint only */}
        {type === "complaint" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Where did you encounter the issue?</p>
            <div className="flex flex-wrap gap-1.5">
              {COMPLAINT_FEATURES.map(f => (
                <button
                  key={f}
                  onClick={() => setFeature(f === feature ? null : f)}
                  className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${
                    feature === f
                      ? "border-destructive/60 bg-destructive/10 text-destructive"
                      : "border-border bg-background text-muted-foreground hover:border-destructive/30"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message */}
        <div className="space-y-1.5">
          <textarea
            placeholder={
              type === "suggestion"
                ? "Share your idea or improvement..."
                : type === "complaint"
                ? feature
                  ? `Describe the issue in ${feature}...`
                  : "Pick a feature above, then describe the issue..."
                : "Select a type above, then write your message..."
            }
            value={message}
            onChange={e => { setMessage(e.target.value); if (status === "error") setStatus("idle"); }}
            disabled={!type || (type === "complaint" && !feature)}
            rows={4}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-40 disabled:cursor-not-allowed resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
        </div>

        {status === "error" && (
          <p className="text-xs text-destructive">Something went wrong — please try again.</p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || status === "loading"}
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {status === "loading" ? <Spinner className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
          {status === "loading" ? "Sending..." : "Send Feedback"}
        </Button>
      </CardContent>
    </Card>
  );
}

type FeedbackRow = {
  id: number;
  type: string;
  feature: string | null;
  message: string;
  userId: string | null;
  userName: string | null;
  ownerReply: string | null;
  ownerRepliedAt: string | null;
  createdAt: string;
};

function OwnerFeedbackInbox() {
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState<Record<number, string>>({});
  const [replyStatus, setReplyStatus] = useState<Record<number, "idle" | "loading" | "done" | "error">>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json() as { feedback?: FeedbackRow[] };
      setFeedbacks(data.feedback ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const sendReply = async (id: number) => {
    const text = replyDraft[id]?.trim();
    if (!text) return;
    setReplyStatus(s => ({ ...s, [id]: "loading" }));
    try {
      const res = await fetch(`/api/feedback/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reply: text }),
      });
      if (!res.ok) throw new Error();
      // Remove from inbox immediately — owner only sees unreplied items
      setFeedbacks(prev => prev.filter(f => f.id !== id));
      setExpandedId(null);
    } catch {
      setReplyStatus(s => ({ ...s, [id]: "error" }));
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <Card className="bg-card border-border border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <span className="flex items-center gap-2 text-primary">
            <MessageSquare className="w-4 h-4" /> Feedback Inbox
          </span>
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">Owner</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-6"><Spinner className="w-5 h-5 text-primary" /></div>
        ) : feedbacks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No feedback yet.</p>
        ) : (
          feedbacks.map(fb => {
            const isOpen = expandedId === fb.id;
            const rStatus = replyStatus[fb.id] ?? "idle";
            return (
              <div key={fb.id} className={`rounded-lg border transition-colors ${
                fb.type === "complaint" ? "border-destructive/30 bg-destructive/5" : "border-primary/20 bg-primary/5"
              }`}>
                {/* Header row */}
                <button
                  className="w-full flex items-start gap-3 p-3 text-left"
                  onClick={() => setExpandedId(isOpen ? null : fb.id)}
                >
                  <div className="mt-0.5 shrink-0">
                    {fb.type === "complaint"
                      ? <AlertCircle className="w-4 h-4 text-destructive" />
                      : <Lightbulb className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{fb.userName ?? "Anonymous"}</span>
                      {fb.feature && (
                        <Badge variant="outline" className="text-xs border-destructive/30 text-destructive">{fb.feature}</Badge>
                      )}
                      {fb.ownerReply && (
                        <Badge variant="outline" className="text-xs border-green-500/40 text-green-500">Replied</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{formatDate(fb.createdAt)}
                    </p>
                    {!isOpen && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">{fb.message}</p>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
                </button>

                {/* Expanded body */}
                {isOpen && (
                  <div className="px-3 pb-3 space-y-3 border-t border-border/40 pt-3">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{fb.message}</p>

                    {fb.ownerReply && (
                      <div className="rounded-md bg-background border border-green-500/20 p-3">
                        <p className="text-xs text-green-500 font-medium mb-1 flex items-center gap-1">
                          <Reply className="w-3 h-3" /> Your reply
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{fb.ownerReply}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <textarea
                        placeholder={fb.ownerReply ? "Update reply..." : "Write a reply..."}
                        value={replyDraft[fb.id] ?? ""}
                        onChange={e => setReplyDraft(d => ({ ...d, [fb.id]: e.target.value }))}
                        rows={2}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => sendReply(fb.id)}
                          disabled={!replyDraft[fb.id]?.trim() || rStatus === "loading"}
                          className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                        >
                          {rStatus === "loading" ? <Spinner className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                          {fb.ownerReply ? "Update Reply" : "Send Reply"}
                        </Button>
                        {rStatus === "error" && <span className="text-xs text-destructive">Failed — try again.</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function UserRepliesSection() {
  const [replies, setReplies] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/feedback/mine", { credentials: "include" })
      .then(r => r.json() as Promise<{ replies: FeedbackRow[] }>)
      .then(d => setReplies(d.replies))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const dismiss = async (id: number) => {
    await fetch(`/api/feedback/${id}/dismiss`, { method: "POST", credentials: "include" });
    setReplies(prev => prev.filter(r => r.id !== id));
  };

  if (loading || replies.length === 0) return null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <Card className="bg-card border-border border-green-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2 text-green-500">
          <Reply className="w-4 h-4" /> Replies from XQuation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {replies.map(fb => (
          <div key={fb.id} className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 space-y-3">
            {/* Original message */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                {fb.type === "complaint"
                  ? <><AlertCircle className="w-3 h-3 text-destructive" /> Your complaint{fb.feature ? ` — ${fb.feature}` : ""}</>
                  : <><Lightbulb className="w-3 h-3 text-primary" /> Your suggestion</>
                }
                <span className="ml-auto flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" />{formatDate(fb.createdAt)}
                </span>
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">{fb.message}</p>
            </div>

            <Separator className="bg-green-500/10" />

            {/* Owner reply */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-green-500 flex items-center gap-1">
                <Reply className="w-3 h-3" /> XQuation replied
                {fb.ownerRepliedAt && (
                  <span className="ml-auto text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />{formatDate(fb.ownerRepliedAt)}
                  </span>
                )}
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{fb.ownerReply}</p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismiss(fb.id)}
              className="w-full text-xs text-muted-foreground hover:text-foreground h-7"
            >
              Got it — dismiss
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
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
                        const sample = new SpeechSynthesisUtterance("Hello, welcome to XQuation");
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
