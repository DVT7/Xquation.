import { useAuth } from "@workspace/replit-auth-web";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Mail, LogOut, LogIn, Telescope, Star, BookOpen, FlaskConical } from "lucide-react";

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

function getDisplayName(firstName?: string | null, lastName?: string | null): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Anonymous";
}

export default function Account() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

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
        <div className="grid grid-cols-3 gap-4 w-full mt-4">
          {[
            { icon: FlaskConical, label: "32 Formulas" },
            { icon: Star, label: "Save Favorites" },
            { icon: BookOpen, label: "Practice Problems" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border border-border">
              <Icon className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Account</h1>

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

      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-muted-foreground font-medium">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Star, label: "Saved Favorites", value: "—" },
              { icon: FlaskConical, label: "Formulas Viewed", value: "—" },
              { icon: BookOpen, label: "Problems Solved", value: "—" },
              { icon: Telescope, label: "Topics Explored", value: "—" },
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
