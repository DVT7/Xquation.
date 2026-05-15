import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BlockMath } from "@/components/ui/math";

const C = 299792458;
const G = 6.674e-11;

function Result({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="p-4 bg-primary/10 border border-primary/30 rounded-md text-center">
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-mono text-primary">{value} <span className="text-base text-muted-foreground">{unit}</span></div>
    </div>
  );
}

function CalcField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input className="font-mono mt-1" value={value} onChange={e => onChange(e.target.value)} placeholder="0" />
    </div>
  );
}

function FormulaBox({ math }: { math: string }) {
  return (
    <div className="bg-background/80 rounded p-4 border border-border/50 flex items-center justify-center min-h-[80px]">
      <BlockMath math={math} />
    </div>
  );
}

export default function Calculators() {
  const [kin, setKin] = useState({ vi: "", t: "", a: "", res: null as number | null });
  const [ke, setKe] = useState({ m: "", v: "", res: null as number | null });
  const [emc2, setEmc2] = useState({ m: "", res: null as number | null });
  const [esc, setEsc] = useState({ M: "", r: "", res: null as number | null });
  const [orb, setOrb] = useState({ r: "", M: "", res: null as number | null });
  const [sch, setSch] = useState({ M: "", res: null as number | null });
  const [ohm, setOhm] = useState({ mode: "V", V: "", I: "", R: "", res: null as number | null, resLabel: "" });

  const calcKin = () => {
    const vi = +kin.vi, t = +kin.t, a = +kin.a;
    if (!isNaN(vi) && !isNaN(t) && !isNaN(a)) setKin(p => ({ ...p, res: vi * t + 0.5 * a * t * t }));
  };

  const calcKe = () => {
    const m = +ke.m, v = +ke.v;
    if (!isNaN(m) && !isNaN(v)) setKe(p => ({ ...p, res: 0.5 * m * v * v }));
  };

  const calcEmc2 = () => {
    const m = +emc2.m;
    if (!isNaN(m)) setEmc2(p => ({ ...p, res: m * C * C }));
  };

  const calcEsc = () => {
    const M = +esc.M, r = +esc.r;
    if (!isNaN(M) && !isNaN(r) && r > 0) setEsc(p => ({ ...p, res: Math.sqrt(2 * G * M / r) }));
  };

  const calcOrb = () => {
    const r = +orb.r, M = +orb.M;
    if (!isNaN(r) && !isNaN(M) && M > 0) setOrb(p => ({ ...p, res: 2 * Math.PI * Math.sqrt(r ** 3 / (G * M)) }));
  };

  const calcSch = () => {
    const M = +sch.M;
    if (!isNaN(M)) setSch(p => ({ ...p, res: 2 * G * M / (C * C) }));
  };

  const calcOhm = () => {
    const V = +ohm.V, I = +ohm.I, R = +ohm.R;
    if (ohm.mode === "V" && !isNaN(I) && !isNaN(R)) setOhm(p => ({ ...p, res: I * R, resLabel: "Voltage (V)" }));
    else if (ohm.mode === "I" && !isNaN(V) && !isNaN(R) && R > 0) setOhm(p => ({ ...p, res: V / R, resLabel: "Current (A)" }));
    else if (ohm.mode === "R" && !isNaN(V) && !isNaN(I) && I > 0) setOhm(p => ({ ...p, res: V / I, resLabel: "Resistance (Ω)" }));
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-mono mb-2">Interactive Calculators</h1>
        <p className="text-muted-foreground">Compute values instantly using standard physics formulas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Kinematics */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Kinematic Displacement</CardTitle>
            <CardDescription>Displacement from initial velocity, time, and acceleration.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <FormulaBox math="d = v_i t + \tfrac{1}{2} a t^2" />
            <div className="grid grid-cols-3 gap-3">
              <CalcField label="Initial Velocity (m/s)" value={kin.vi} onChange={v => setKin(p => ({ ...p, vi: v }))} />
              <CalcField label="Time (s)" value={kin.t} onChange={v => setKin(p => ({ ...p, t: v }))} />
              <CalcField label="Acceleration (m/s²)" value={kin.a} onChange={v => setKin(p => ({ ...p, a: v }))} />
            </div>
            <Button className="w-full" onClick={calcKin}>Calculate</Button>
            {kin.res !== null && <Result label="Displacement" value={kin.res.toPrecision(5)} unit="m" />}
          </CardContent>
        </Card>

        {/* Kinetic Energy */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Kinetic Energy</CardTitle>
            <CardDescription>Energy of a moving object.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <FormulaBox math="KE = \tfrac{1}{2} m v^2" />
            <div className="grid grid-cols-2 gap-3">
              <CalcField label="Mass (kg)" value={ke.m} onChange={v => setKe(p => ({ ...p, m: v }))} />
              <CalcField label="Velocity (m/s)" value={ke.v} onChange={v => setKe(p => ({ ...p, v: v }))} />
            </div>
            <Button className="w-full" onClick={calcKe}>Calculate</Button>
            {ke.res !== null && <Result label="Kinetic Energy" value={ke.res.toExponential(4)} unit="J" />}
          </CardContent>
        </Card>

        {/* Mass-Energy */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Mass–Energy Equivalence</CardTitle>
            <CardDescription>Rest energy from mass.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <FormulaBox math="E = mc^2" />
            <CalcField label="Mass (kg)" value={emc2.m} onChange={v => setEmc2(p => ({ ...p, m: v }))} />
            <Button className="w-full" onClick={calcEmc2}>Calculate</Button>
            {emc2.res !== null && <Result label="Rest Energy" value={emc2.res.toExponential(4)} unit="J" />}
          </CardContent>
        </Card>

        {/* Escape Velocity */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Escape Velocity</CardTitle>
            <CardDescription>Minimum speed to escape a gravitational body.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <FormulaBox math="v_e = \sqrt{\dfrac{2GM}{r}}" />
            <div className="grid grid-cols-2 gap-3">
              <CalcField label="Mass of Body (kg)" value={esc.M} onChange={v => setEsc(p => ({ ...p, M: v }))} />
              <CalcField label="Radius (m)" value={esc.r} onChange={v => setEsc(p => ({ ...p, r: v }))} />
            </div>
            <Button className="w-full" onClick={calcEsc}>Calculate</Button>
            {esc.res !== null && <Result label="Escape Velocity" value={esc.res.toPrecision(5)} unit="m/s" />}
          </CardContent>
        </Card>

        {/* Orbital Period */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Orbital Period</CardTitle>
            <CardDescription>Time for one complete orbit (circular).</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <FormulaBox math="T = 2\pi \sqrt{\dfrac{r^3}{GM}}" />
            <div className="grid grid-cols-2 gap-3">
              <CalcField label="Orbital Radius (m)" value={orb.r} onChange={v => setOrb(p => ({ ...p, r: v }))} />
              <CalcField label="Central Mass (kg)" value={orb.M} onChange={v => setOrb(p => ({ ...p, M: v }))} />
            </div>
            <Button className="w-full" onClick={calcOrb}>Calculate</Button>
            {orb.res !== null && <Result label="Orbital Period" value={orb.res.toPrecision(5)} unit="s" />}
          </CardContent>
        </Card>

        {/* Schwarzschild Radius */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Schwarzschild Radius</CardTitle>
            <CardDescription>Event horizon radius of a black hole.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <FormulaBox math="r_s = \dfrac{2GM}{c^2}" />
            <CalcField label="Mass (kg)" value={sch.M} onChange={v => setSch(p => ({ ...p, M: v }))} />
            <Button className="w-full" onClick={calcSch}>Calculate</Button>
            {sch.res !== null && <Result label="Schwarzschild Radius" value={sch.res.toExponential(4)} unit="m" />}
          </CardContent>
        </Card>

        {/* Ohm's Law */}
        <Card className="border-border/50 bg-card lg:col-span-2">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Ohm's Law</CardTitle>
            <CardDescription>Relationship between voltage, current, and resistance. Select what to solve for.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <FormulaBox math="V = IR" />
            <div className="flex gap-2">
              {["V", "I", "R"].map(m => (
                <button
                  key={m}
                  onClick={() => setOhm(p => ({ ...p, mode: m, res: null }))}
                  className={`flex-1 py-2 rounded-md text-sm font-mono border transition-colors ${ohm.mode === m ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                >
                  Solve for {m === "V" ? "Voltage" : m === "I" ? "Current" : "Resistance"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ohm.mode !== "V" && <CalcField label="Voltage (V)" value={ohm.V} onChange={v => setOhm(p => ({ ...p, V: v }))} />}
              {ohm.mode !== "I" && <CalcField label="Current (A)" value={ohm.I} onChange={v => setOhm(p => ({ ...p, I: v }))} />}
              {ohm.mode !== "R" && <CalcField label="Resistance (Ω)" value={ohm.R} onChange={v => setOhm(p => ({ ...p, R: v }))} />}
            </div>
            <Button className="w-full" onClick={calcOhm}>Calculate</Button>
            {ohm.res !== null && <Result label={ohm.resLabel} value={ohm.res.toPrecision(5)} unit={ohm.mode === "V" ? "V" : ohm.mode === "I" ? "A" : "Ω"} />}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
