import { Telescope, Atom, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-12 pt-8">
      <div className="text-center space-y-6">
        <Telescope className="w-16 h-16 text-primary mx-auto" />
        <h1 className="text-4xl md:text-5xl font-black font-mono tracking-tighter">
          About XQUTION
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          The precise, immersive reference tool for serious students and space enthusiasts.
        </p>
      </div>

      <div className="space-y-8 text-foreground/80 leading-relaxed">
        <p className="text-lg">
          XQution was built to solve a simple problem: the beauty of physics and astronomy shouldn't be trapped in clunky PDFs, ad-filled websites, or scattered notebooks. We wanted to create an environment that feels like a mission control terminal—where every constant, formula, and calculator you need is organized, pristine, and instantly accessible.
        </p>
        
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
              <h3 className="font-mono text-xl font-bold">Immersive Design</h3>
              <p className="text-sm">A distraction-free, dark-themed cosmic interface designed for late-night study sessions and complex problem solving.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
