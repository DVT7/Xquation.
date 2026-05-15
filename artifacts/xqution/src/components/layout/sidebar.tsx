import { useLocation } from "wouter";
import { Link } from "wouter";
import { 
  Calculator, 
  BookOpen, 
  FlaskConical, 
  ArrowRightLeft, 
  BrainCircuit, 
  BookA, 
  Star, 
  Info,
  Menu,
  Telescope
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/formulas", label: "Formulas", icon: FlaskConical },
  { href: "/constants", label: "Constants", icon: BookOpen },
  { href: "/calculators", label: "Calculators", icon: Calculator },
  { href: "/converter", label: "Unit Converter", icon: ArrowRightLeft },
  { href: "/problems", label: "Practice", icon: BrainCircuit },
  { href: "/glossary", label: "Glossary", icon: BookA },
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/about", label: "About", icon: Info },
];

export function Sidebar() {
  const [location] = useLocation();

  const NavLinks = ({ className }: { className?: string }) => (
    <nav className={cn("space-y-1 mt-6", className)}>
      {NAV_ITEMS.map((item) => {
        const isActive = location.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className="block">
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
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Topbar & Sheet */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b bg-background/80 backdrop-blur-md flex items-center justify-between px-4 z-50">
        <Link href="/" className="flex items-center gap-2">
          <Telescope className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold tracking-tight text-foreground font-mono">XQUTION</span>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-foreground border border-border">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-background/95 backdrop-blur border-border p-0 pt-16">
             <div className="px-4">
              <NavLinks />
             </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 h-screen fixed top-0 left-0 flex-col border-r border-border bg-card/50 backdrop-blur z-40">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Telescope className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold tracking-tight text-foreground font-mono">XQUTION</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <NavLinks />
        </div>
      </div>
    </>
  );
}
