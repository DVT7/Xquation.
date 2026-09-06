import { Telescope, Atom, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-12 pt-8">
      <div className="text-center space-y-6">
        <Telescope className="w-16 h-16 text-primary mx-auto" />
        <h1 className="text-4xl md:text-5xl font-black font-mono tracking-tighter">
          About XQUATION
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          The precise, immersive reference tool for serious students and space enthusiasts.
        </p>
      </div>
      <div className="space-y-8 text-foreground/80 leading-relaxed">
        <p className="text-lg">Xquation was built to solve one of the more prominent problems in physics: mainly remembering and knowing formulas. Sometimes you may know what a formula is. You might know how to use it but many times you don't know when to use it. That is a big problem in physics. It's the main reason why people who study so hard might still not do well. In Xquation we're trying to solve that problem, one update at a time.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <Card className="bg-card border-border/50">
            <CardContent className="p-6 space-y-4">
              <Atom className="w-8 h-8 text-secondary" />
              <h3 className="font-mono text-xl font-bold">Scientific Precision</h3>
              <p className="text-sm">LaTeX-rendered mathematical typography ensures formulas are beautiful and readable. We provide exact SI units, derivations, and examples.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border/50">
            <CardContent className="p-6 space-y-4">
              <Sparkles className="w-8 h-8 text-accent" />
              <h3 className="font-mono text-xl font-bold">DO THE LIMBO
</h3>
              <p className="text-sm">lssls slss ss ll lsss lll</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
