import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BlockMath } from "@/components/ui/math";

export default function Calculators() {
  const [kinematicsState, setKinematicsState] = useState({ vi: "", t: "", a: "", res: null as number | null });
  const [emc2State, setEmc2State] = useState({ m: "", res: null as number | null });

  const calculateKinematics = () => {
    const vi = parseFloat(kinematicsState.vi);
    const t = parseFloat(kinematicsState.t);
    const a = parseFloat(kinematicsState.a);
    if (!isNaN(vi) && !isNaN(t) && !isNaN(a)) {
      setKinematicsState(prev => ({ ...prev, res: vi * t + 0.5 * a * t * t }));
    }
  };

  const calculateEmc2 = () => {
    const m = parseFloat(emc2State.m);
    if (!isNaN(m)) {
      setEmc2State(prev => ({ ...prev, res: m * 299792458 * 299792458 }));
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-mono mb-2">Interactive Calculators</h1>
        <p className="text-muted-foreground">Compute values instantly using standard formulas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Kinematics */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Kinematic Displacement</CardTitle>
            <CardDescription>Calculate displacement given initial velocity, time, and acceleration.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="bg-background/80 rounded p-4 border border-border/50 flex items-center justify-center">
              <BlockMath math="d = v_i t + \frac{1}{2} a t^2" />
            </div>
            <div className="grid grid-cols-3 gap-4">
               <div>
                 <Label>Initial Velocity (m/s)</Label>
                 <Input className="font-mono mt-1" value={kinematicsState.vi} onChange={e => setKinematicsState(p => ({...p, vi: e.target.value}))} />
               </div>
               <div>
                 <Label>Time (s)</Label>
                 <Input className="font-mono mt-1" value={kinematicsState.t} onChange={e => setKinematicsState(p => ({...p, t: e.target.value}))} />
               </div>
               <div>
                 <Label>Acceleration (m/s²)</Label>
                 <Input className="font-mono mt-1" value={kinematicsState.a} onChange={e => setKinematicsState(p => ({...p, a: e.target.value}))} />
               </div>
            </div>
            <Button className="w-full" onClick={calculateKinematics}>Calculate</Button>
            {kinematicsState.res !== null && (
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-md text-center">
                <div className="text-sm text-muted-foreground mb-1">Result (Displacement)</div>
                <div className="text-2xl font-mono text-primary">{kinematicsState.res.toPrecision(5)} m</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mass-Energy Equivalence */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Mass-Energy Equivalence</CardTitle>
            <CardDescription>Calculate rest energy from mass.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="bg-background/80 rounded p-4 border border-border/50 flex items-center justify-center">
              <BlockMath math="E = m c^2" />
            </div>
            <div>
              <Label>Mass (kg)</Label>
              <Input className="font-mono mt-1" value={emc2State.m} onChange={e => setEmc2State(p => ({...p, m: e.target.value}))} />
            </div>
            <Button className="w-full" onClick={calculateEmc2}>Calculate</Button>
            {emc2State.res !== null && (
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-md text-center">
                <div className="text-sm text-muted-foreground mb-1">Result (Energy)</div>
                <div className="text-2xl font-mono text-primary">{emc2State.res.toExponential(4)} J</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
