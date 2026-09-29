import { useLocation } from "wouter";
import { Link } from "wouter";
import { 
  Calculator, 
  BookOpen, 
  FlaskConical, 
  ArrowRightLeft, 
  BookA, 
  Star, 
  Menu,
  Heart,
  UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@workspace/replit-auth-web";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV_ITEMS = [
  { href: "/formulas", label: "Formulas", icon: FlaskConical },
  { href: "/constants", label: "Constants", icon: BookOpen },
  { href: "/calculators", label: "Calculators", icon: Calculator },
  { href: "/converter", label: "Unit Converter", icon: ArrowRightLeft },
  { href: "/donate", label: "Donate", icon: Heart },
  { href: "/glossary", label: "Glossary", icon: BookA },
  { href: "/favorites", label: "Favorites", icon: Star },
];

function BrandMark() {
  return (
    <span className="flex items-center gap-2">
      <span className="font-mono text-xl font-bold tracking-tight text-foreground">
        <span className="text-2xl text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.9)]">X</span>
        QUTION
      </span>
      <span className="font-mono text-[10px] font-semibold tracking-wider text-primary/70">V0.5</span>
    </span>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  function getInitials(firstName?: string | null, lastName?: string | null) {
    return ((firstName?.[0] ?? "") + (lastName?.[0] ?? "")).toUpperCase() || "?";
  }

  const NavLinks = ({ className }: { className?: string }) => (
    <nav className={cn("space-y-1 mt-6", className)}>
      {NAV_ITEMS.map((item) => {
        const isActive = location.startsWith(item.href);
        return (
            <div key={item.href} className={item.href === "/donate" ? "group" : undefined}>
            <Link href={item.href} className="block">
              <div className={cn(
                "flex items-center px-4 py-3 rounded-md transition-colors font-medium text-sm",
                isActive 
                  ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </div>
            </Link>
            {item.href === "/donate" && (
              <div className="max-h-0 overflow-hidden rounded-md border border-red-500/50 bg-red-500/15 px-3 text-center text-xs font-bold uppercase tracking-wider text-red-400 opacity-0 transition-all duration-200 group-hover:mt-1 group-hover:max-h-10 group-hover:px-3 group-hover:py-2 group-hover:opacity-100">
                Not in order
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  const AccountButton = () => {
    const isActive = location.startsWith("/account");
    return (
      <Link href="/account" className="block">
        <div className={cn(
          "flex items-center px-4 py-3 rounded-md transition-colors font-medium text-sm gap-3",
          isActive
            ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}>
          {isAuthenticated && user ? (
            <Avatar className="w-5 h-5 shrink-0">
              <AvatarImage src={user.profileImageUrl ?? undefined} />
              <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <UserCircle className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
          )}
          <span>Account</span>
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Topbar & Sheet */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b bg-background/80 backdrop-blur-md flex items-center justify-between px-4 z-50">
        <Link href="/" className="flex items-center gap-2">
          <BrandMark />
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-foreground border border-border">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-background/95 backdrop-blur border-border p-0 pt-16">
            <div className="px-4 flex flex-col h-full pb-6">
              <NavLinks />
              <div className="mt-auto pt-4 border-t border-border">
                <AccountButton />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 h-screen fixed top-0 left-0 flex-col border-r border-border bg-card/50 backdrop-blur z-40">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BrandMark />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <NavLinks />
        </div>
        <div className="px-4 pb-4 border-t border-border pt-4">
          <AccountButton />
        </div>
      </div>
    </>
  );
}
