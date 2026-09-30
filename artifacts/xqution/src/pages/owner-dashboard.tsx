import { useState, useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useLocation } from "wouter";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetOwnerAnalytics,
  useListOwnerUsers,
  useListAnnouncements,
  useListOwnerFeedback,
  useChangeUserRole,
  useBanUser,
  useUnbanUser,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useReplyToFeedback,
  useListOwnerAchievements,
  useUpdateOwnerAchievement,
  useGrantOwnerAchievement,
  getListOwnerAchievementsQueryKey,
  type OwnerEnrichedUser,
  type OwnerAnnouncement,
  type OwnerFeedback,
  type OwnerAchievement,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { FormulaBuilder } from "@/components/formula/formula-builder";
import {
  Crown, Users, Eye, Heart, Search, MessageSquare, Shield,
  Megaphone, Activity, Ban, CheckCircle, BarChart3, Send,
  Trash2, Reply, SquarePen, Trophy, Power, PowerOff,
} from "lucide-react";

export default function OwnerDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("analytics");
  const [searchTerm, setSearchTerm] = useState("");
  const [announceForm, setAnnounceForm] = useState({ title: "", message: "" });
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [grantUserId, setGrantUserId] = useState("");

  // Queries
  const { data: analyticsData, isLoading: analyticsLoading } = useGetOwnerAnalytics();
  const { data: usersData, isLoading: usersLoading } = useListOwnerUsers();
  const { data: announcementsData, isLoading: announcementsLoading } = useListAnnouncements();
  const { data: feedbackData, isLoading: feedbackLoading } = useListOwnerFeedback();
  const { data: achievementData, isLoading: achievementsLoading } = useListOwnerAchievements();

  // Mutations
  const changeRole = useChangeUserRole({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/owner/users"] });
      },
    },
  });
  const ban = useBanUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/owner/users"] });
      },
    },
  });
  const unban = useUnbanUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/owner/users"] });
      },
    },
  });
  const createAnnouncement = useCreateAnnouncement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/owner/announcements"] });
      },
    },
  });
  const deleteAnnouncement = useDeleteAnnouncement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/owner/announcements"] });
      },
    },
  });
  const replyFeedback = useReplyToFeedback({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/owner/feedback"] });
      },
    },
  });
  const updateAchievement = useUpdateOwnerAchievement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOwnerAchievementsQueryKey() });
      },
    },
  });
  const grantAchievement = useGrantOwnerAchievement({
    mutation: {
      onSuccess: (result, variables) => {
        queryClient.invalidateQueries({ queryKey: getListOwnerAchievementsQueryKey() });
        const granted = result.achievements.find((achievement) => achievement.key === variables.key);
        toast({
          title: "Achievement granted",
          description: granted?.name ?? variables.key,
          icon: <Trophy className="h-5 w-5 text-primary" />,
          className: "border-primary/40 bg-primary/10",
        });
      },
    },
  });

  // Redirect non-owners
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "owner")) {
      navigate("/account");
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (!grantUserId && user?.id) setGrantUserId(user.id);
  }, [grantUserId, user?.id]);

  if (isLoading || (!isAuthenticated || user?.role !== "owner")) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  const analytics = analyticsData;
  const users = usersData?.users ?? [];
  const announcements = announcementsData?.announcements ?? [];
  const feedback = feedbackData?.feedback ?? [];

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q)
    );
  });

  const statCards = analytics
    ? [
        { label: "Total Users", value: analytics.totalUsers, icon: Users, color: "text-primary" },
        { label: "New Today", value: analytics.newUsersToday, icon: Activity, color: "text-green-400" },
        { label: "Total Views", value: analytics.totalViews, icon: Eye, color: "text-blue-400" },
        { label: "Total Favorites", value: analytics.totalFavorites, icon: Heart, color: "text-pink-400" },
        { label: "Total Searches", value: analytics.totalSearches, icon: Search, color: "text-yellow-400" },
        { label: "Online Now", value: analytics.onlineUsers, icon: Activity, color: "text-cyan-400" },
      ]
    : [];

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Crown className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Owner Dashboard</h1>
          <p className="text-sm text-muted-foreground">Analytics, users, and platform management</p>
        </div>
        <Badge className="ml-auto bg-primary/10 text-primary border-primary/20">
          <Shield className="w-3 h-3 mr-1" />
          Owner Access
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-border/50">
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="w-3.5 h-3.5" /> Users
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-1.5">
            <Megaphone className="w-3.5 h-3.5" /> Announcements
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Feedback
          </TabsTrigger>
          <TabsTrigger value="formula-builder" className="gap-1.5">
            <SquarePen className="w-3.5 h-3.5" /> Formula Builder
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-1.5">
            <Trophy className="w-3.5 h-3.5" /> Achievements
          </TabsTrigger>
        </TabsList>

        {/* FORMULA BUILDER */}
        <TabsContent value="formula-builder" className="space-y-4 mt-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-sm font-semibold text-primary">Create a formula page yourself</p>
            <p className="text-xs text-muted-foreground mt-1">
              Paste the equation, describe its symbols, and optionally add a working calculator. Your saved page is immediately available in the formula library.
            </p>
          </div>
          <FormulaBuilder />
        </TabsContent>

        {/* ACHIEVEMENTS */}
        <TabsContent value="achievements" className="space-y-4 mt-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-sm font-semibold text-primary">Control account achievements</p>
            <p className="text-xs text-muted-foreground mt-1">
              Enable or disable achievements globally, or grant any achievement directly to any account.
            </p>
          </div>
          {achievementsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-8 h-8 text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(achievementData?.achievements ?? []).map((achievement) => (
                <AchievementAdminCard
                  key={achievement.key}
                  achievement={achievement}
                  isSaving={updateAchievement.isPending}
                  users={users}
                  grantUserId={grantUserId}
                  isGranting={grantAchievement.isPending}
                  onGrantUserIdChange={setGrantUserId}
                  onToggle={() => updateAchievement.mutate({
                    key: achievement.key,
                    data: { enabled: !achievement.enabled },
                  })}
                  onGrant={() => {
                    if (!grantUserId) return;
                    grantAchievement.mutate({
                      key: achievement.key,
                      data: { userId: grantUserId },
                    });
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="space-y-6 mt-4">
          {analyticsLoading && (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-8 h-8 text-primary" />
            </div>
          )}
          {!analyticsLoading && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {statCards.map((s) => (
                  <Card key={s.label} className="bg-card/60 border-border/40 backdrop-blur-sm">
                    <CardContent className="p-4 space-y-2">
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                      <p className="text-2xl font-bold text-foreground">{s.value.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TopListCard title="Top Viewed Formulas" icon={Eye} iconColor="text-primary"
                  items={analytics?.topViewed?.map(v => ({ label: v.formulaName ?? `Formula #${v.formulaId}`, value: `${v.views} views`, color: "border-primary/20 text-primary" })) ?? []} />
                <TopListCard title="Top Favorited" icon={Heart} iconColor="text-pink-400"
                  items={analytics?.topFavorited?.map(v => ({ label: v.itemName ?? `Item #${v.itemId}`, value: `${v.favorites} favs`, color: "border-pink-400/20 text-pink-400" })) ?? []} />
                <TopListCard title="Top Searches" icon={Search} iconColor="text-yellow-400"
                  items={analytics?.topSearches?.map(v => ({ label: v.query, value: `${v.count}`, color: "border-yellow-400/20 text-yellow-400" })) ?? []} />
              </div>

              <Card className="bg-card/60 border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                    <MessageSquare className="w-4 h-4 text-primary" /> Feedback Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex gap-6">
                  {["total", "open", "replied"].map((k) => (
                    <div key={k} className="text-center">
                      <p className={`text-2xl font-bold ${k === "total" ? "text-foreground" : k === "open" ? "text-yellow-400" : "text-green-400"}`}>
                        {(analytics?.feedback as Record<string, number>)?.[k] ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{k}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* USERS */}
        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-card border-border/50"
              />
            </div>
            <Badge variant="outline" className="border-border/50 text-muted-foreground">
              {filteredUsers.length} users
            </Badge>
          </div>

          {usersLoading && (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-8 h-8 text-primary" />
            </div>
          )}
          {!usersLoading && (
            <div className="rounded-xl border border-border/40 overflow-hidden bg-card/40">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-card/60">
                      {["User", "Role", "Joined", "Favs", "Views", "Status", "Actions"].map((h) => (
                        <th key={h} className="text-left p-3 font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <UserRow
                        key={u.id}
                        u={u}
                        isMe={u.id === user?.id}
                        onPromote={() => changeRole.mutate({ id: u.id, data: { role: "owner" } })}
                        onDemote={() => changeRole.mutate({ id: u.id, data: { role: "user" } })}
                        onBan={(reason, duration) =>
                          ban.mutate({ id: u.id, data: { reason, durationMinutes: duration } })
                        }
                        onUnban={() => unban.mutate({ id: u.id })}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ANNOUNCEMENTS */}
        <TabsContent value="announcements" className="space-y-4 mt-4">
          <Card className="bg-card/60 border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground">Create Announcement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Title"
                value={announceForm.title}
                onChange={(e) => setAnnounceForm((p) => ({ ...p, title: e.target.value }))}
                className="bg-background border-border/50"
              />
              <textarea
                placeholder="Message..."
                value={announceForm.message}
                onChange={(e) => setAnnounceForm((p) => ({ ...p, message: e.target.value }))}
                className="w-full rounded-md border border-border/50 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-y"
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (!announceForm.title.trim() || !announceForm.message.trim()) return;
                    createAnnouncement.mutate({
                      data: { title: announceForm.title, message: announceForm.message },
                    });
                    setAnnounceForm({ title: "", message: "" });
                  }}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  size="sm"
                >
                  <Send className="w-4 h-4" /> Publish
                </Button>
              </div>
            </CardContent>
          </Card>

          {announcementsLoading && (
            <div className="flex items-center justify-center py-8">
              <Spinner className="w-8 h-8 text-primary" />
            </div>
          )}
          {!announcementsLoading && (
            <div className="space-y-3">
              {announcements.map((a) => (
                <AnnouncementRow
                  key={a.id}
                  a={a}
                  onDelete={(id) => deleteAnnouncement.mutate({ id })}
                />
              ))}
              {!announcements.length && (
                <p className="text-sm text-muted-foreground text-center py-8">No announcements yet</p>
              )}
            </div>
          )}
        </TabsContent>

        {/* FEEDBACK */}
        <TabsContent value="feedback" className="space-y-4 mt-4">
          {feedbackLoading && (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-8 h-8 text-primary" />
            </div>
          )}
          {!feedbackLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {feedback.map((fb) => (
                <FeedbackCard
                  key={fb.id}
                  fb={fb}
                  replyText={replyText[fb.id] ?? ""}
                  onReplyChange={(text) => setReplyText((prev) => ({ ...prev, [fb.id]: text }))}
                  onSendReply={() => {
                    const reply = replyText[fb.id];
                    if (!reply?.trim()) return;
                    replyFeedback.mutate({ id: fb.id, data: { reply } });
                    setReplyText((prev) => ({ ...prev, [fb.id]: "" }));
                  }}
                />
              ))}
              {!feedback.length && (
                <p className="text-sm text-muted-foreground text-center py-8 col-span-full">No feedback yet</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AchievementAdminCard({
  achievement,
  isSaving,
  users,
  grantUserId,
  isGranting,
  onGrantUserIdChange,
  onToggle,
  onGrant,
}: {
  achievement: OwnerAchievement;
  isSaving: boolean;
  users: OwnerEnrichedUser[];
  grantUserId: string;
  isGranting: boolean;
  onGrantUserIdChange: (userId: string) => void;
  onToggle: () => void;
  onGrant: () => void;
}) {
  return (
    <Card className={`bg-card/60 border-border/40 ${achievement.enabled ? "" : "opacity-70"}`}>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          achievement.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        }`}>
          <Trophy className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">{achievement.name}</p>
              {achievement.description && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{achievement.description}</p>
              )}
            </div>
            <Badge variant="outline" className={achievement.enabled ? "border-green-400/30 text-green-400" : "border-border/50 text-muted-foreground"}>
              {achievement.enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-3 mt-3">
            <span className="text-xs text-muted-foreground">
              {achievement.unlockedCount ?? 0} recorded unlocks
            </span>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <select
                value={grantUserId}
                onChange={(event) => onGrantUserIdChange(event.target.value)}
                className="h-7 max-w-[170px] rounded-md border border-border/50 bg-background px-2 text-[11px] text-foreground"
                aria-label={`Account to grant ${achievement.name}`}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email ?? user.firstName ?? user.id}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5"
                onClick={onGrant}
                disabled={isGranting || !grantUserId}
              >
                <Trophy className="w-3.5 h-3.5" /> Grant
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5"
                onClick={onToggle}
                disabled={isSaving}
              >
                {achievement.enabled ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                {achievement.enabled ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TopListCard({
  title,
  icon: Icon,
  iconColor,
  items,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  items: { label: string; value: string; color: string }[];
}) {
  return (
    <Card className="bg-card/60 border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground">
          <Icon className={`w-4 h-4 ${iconColor}`} /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((v, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground truncate max-w-[160px]">{v.label}</span>
            <Badge variant="outline" className={`text-xs ${v.color}`}>{v.value}</Badge>
          </div>
        ))}
        {!items.length && <p className="text-sm text-muted-foreground">No data yet</p>}
      </CardContent>
    </Card>
  );
}

function UserRow({
  u,
  isMe,
  onPromote,
  onDemote,
  onBan,
  onUnban,
}: {
  u: OwnerEnrichedUser;
  isMe: boolean;
  onPromote: () => void;
  onDemote: () => void;
  onBan: (reason: string, duration: number) => void;
  onUnban: () => void;
}) {
  return (
    <tr className="border-b border-border/30 hover:bg-primary/5 transition-colors">
      <td className="p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {(u.firstName?.[0] ?? "") + (u.lastName?.[0] ?? "") || "?"}
          </div>
          <div>
            <p className="font-medium text-foreground">{[u.firstName, u.lastName].filter(Boolean).join(" ") || "Anonymous"}</p>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      </td>
      <td className="p-3">
        <Badge
          variant="outline"
          className={u.role === "owner" ? "border-primary/30 text-primary" : "border-border/40 text-muted-foreground"}
        >
          {u.role}
        </Badge>
      </td>
      <td className="p-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
      <td className="p-3 text-foreground">{u.favoritesCount}</td>
      <td className="p-3 text-foreground">{u.formulasViewed}</td>
      <td className="p-3">
        {u.isBanned ? (
          <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">
            <Ban className="w-3 h-3 mr-1" /> Banned
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground">
            Active
          </Badge>
        )}
      </td>
      <td className="p-3">
        <div className="flex items-center gap-1.5">
          {u.role !== "owner" && !u.isBanned && !isMe && (
            <Button size="sm" variant="outline" className="h-7 text-xs border-primary/20 hover:bg-primary/10" onClick={onPromote}>
              <Crown className="w-3 h-3 mr-1" /> Promote
            </Button>
          )}
          {u.role === "owner" && !isMe && (
            <Button size="sm" variant="outline" className="h-7 text-xs border-border/40 hover:bg-muted" onClick={onDemote}>
              Demote
            </Button>
          )}
          {!u.isBanned && !isMe && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-red-500/20 text-red-400 hover:bg-red-500/10"
              onClick={() => {
                const reason = prompt("Ban reason:");
                if (!reason) return;
                const dur = prompt("Duration in minutes (leave empty for permanent):");
                const mins = dur ? parseInt(dur) : 0;
                onBan(reason, mins);
              }}
            >
              <Ban className="w-3 h-3 mr-1" /> Ban
            </Button>
          )}
          {u.isBanned && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-green-500/20 text-green-400 hover:bg-green-500/10"
              onClick={onUnban}
            >
              <CheckCircle className="w-3 h-3 mr-1" /> Unban
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function AnnouncementRow({
  a,
  onDelete,
}: {
  a: OwnerAnnouncement;
  onDelete: (id: number) => void;
}) {
  return (
    <Card className="bg-card/40 border-border/30">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Megaphone className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-foreground text-sm">{a.title}</p>
            <Badge
              variant="outline"
              className={`text-[10px] h-5 ${
                a.priority === "urgent"
                  ? "border-red-400/30 text-red-400"
                  : a.priority === "high"
                  ? "border-orange-400/30 text-orange-400"
                  : "border-border/40 text-muted-foreground"
              }`}
            >
              {a.priority}
            </Badge>
            {a.isPinned && (
              <Badge className="text-[10px] h-5 bg-primary/10 text-primary border-primary/20">Pinned</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{a.message}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(a.createdAt).toLocaleString()} · {a.type} · {a.scope}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          onClick={() => onDelete(a.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function FeedbackCard({
  fb,
  replyText,
  onReplyChange,
  onSendReply,
}: {
  fb: OwnerFeedback;
  replyText: string;
  onReplyChange: (text: string) => void;
  onSendReply: () => void;
}) {
  return (
    <Card className="bg-card/40 border-border/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[10px] h-5 ${
                fb.type === "complaint" ? "border-red-400/30 text-red-400" : "border-green-400/30 text-green-400"
              }`}
            >
              {fb.type}
            </Badge>
            <p className="text-xs text-muted-foreground">{fb.userName || "Anonymous"}</p>
          </div>
          <p className="text-xs text-muted-foreground">{new Date(fb.createdAt).toLocaleDateString()}</p>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{fb.message}</p>
        {fb.ownerReply && (
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
            <p className="text-xs text-primary font-medium mb-1 flex items-center gap-1">
              <Reply className="w-3 h-3" /> Owner Reply
            </p>
            <p className="text-sm text-foreground">{fb.ownerReply}</p>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => onReplyChange(e.target.value)}
            className="flex-1 bg-background border-border/50 text-sm"
          />
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={onSendReply}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
