import { Heart, Coffee, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DONATE_URL = ""; // TODO: add your donation link here

export default function Donate() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center gap-8 text-center">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
          <Heart className="w-12 h-12 text-pink-400" fill="currentColor" />
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Support XQuation</h1>
        <p className="text-muted-foreground leading-relaxed">
          XQuation is free for everyone. If it's helped you study, learn, or just satisfy your curiosity — consider buying us a coffee. Every contribution keeps the platform running and growing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 w-full">
        {[
          { label: "Buy Me a Coffee", amount: "£3", icon: Coffee, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30 hover:bg-yellow-400/20" },
          { label: "Support More", amount: "£5", icon: Heart, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/30 hover:bg-pink-500/20" },
          { label: "Super Support", amount: "£10", icon: Heart, color: "text-primary", bg: "bg-primary/10 border-primary/30 hover:bg-primary/20" },
        ].map(({ label, amount, icon: Icon, color, bg }) => (
          <a
            key={label}
            href={DONATE_URL || "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => { if (!DONATE_URL) e.preventDefault(); }}
          >
            <Card className={`border ${bg} transition-colors cursor-pointer`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${color}`} fill="currentColor" />
                  <span className="font-medium text-foreground">{label}</span>
                </div>
                <span className={`font-bold font-mono ${color}`}>{amount}</span>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {DONATE_URL ? (
        <Button
          asChild
          size="lg"
          className="gap-2 bg-pink-500 hover:bg-pink-600 text-white px-8"
        >
          <a href={DONATE_URL} target="_blank" rel="noopener noreferrer">
            <Heart className="w-4 h-4" fill="currentColor" />
            Donate Now
            <ExternalLink className="w-4 h-4 opacity-70" />
          </a>
        </Button>
      ) : (
        <Button size="lg" disabled className="gap-2 px-8 opacity-60">
          <Heart className="w-4 h-4" fill="currentColor" />
          Donate Now
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        No account required · Secure · One-time or recurring
      </p>
    </div>
  );
}
