import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BlockMath } from "@/components/ui/math";

const C = 299792458;
const H0 = 70; // km/s/Mpc — default Hubble constant
const SIGMA = 5.6704e-8;
const G = 6.674e-11;
const L_SUN = 3.828e26;

function Result({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="p-4 bg-primary/10 border border-primary/30 rounded-md text-center">
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-mono text-primary">
        {value} <span className="text-base text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function CalcField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input className="font-mono mt-1" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? "0"} />
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

export default function AstronomyTools() {
  const [redshift, setRedshift] = useState({ lambdaObs: "", lambdaEm: "", z: null as number | null, v: null as number | null });
  const [lum, setLum] = useState({ mode: "flux", flux: "", dist: "", R: "", T: "", res: null as number | null });
  const [hubble, setHubble] = useState({ mode: "dist", v: "", d: "", H: H0.toString(), res: null as number | null, resLabel: "" });
  const [kepler, setKepler] = useState({ a: "", M: "", res: null as number | null });

  const calcRedshift = () => {
    const lo = +redshift.lambdaObs, le = +redshift.lambdaEm;
    if (!isNaN(lo) && !isNaN(le) && le > 0) {
      const z = (lo - le) / le;
      const v = z * C;
      setRedshift(p => ({ ...p, z, v }));
    }
  };

  const calcLum = () => {
    if (lum.mode === "flux") {
      const F = +lum.flux, d = +lum.dist;
      if (!isNaN(F) && !isNaN(d) && d > 0) setLum(p => ({ ...p, res: 4 * Math.PI * d * d * F }));
    } else {
      const R = +lum.R, T = +lum.T;
      if (!isNaN(R) && !isNaN(T)) setLum(p => ({ ...p, res: 4 * Math.PI * R * R * SIGMA * T ** 4 }));
    }
  };

  const calcHubble = () => {
    const H = +hubble.H;
    if (hubble.mode === "dist") {
      const v = +hubble.v;
      if (!isNaN(v) && !isNaN(H) && H > 0)
        setHubble(p => ({ ...p, res: v / H, resLabel: "Distance (Mpc)" }));
    } else {
      const d = +hubble.d;
      if (!isNaN(d) && !isNaN(H))
        setHubble(p => ({ ...p, res: H * d, resLabel: "Recession Velocity (km/s)" }));
    }
  };

  const calcKepler = () => {
    const a = +kepler.a * 1.496e11; // AU to metres
    const M = +kepler.M * 1.989e30; // solar masses to kg
    if (!isNaN(a) && !isNaN(M) && M > 0) {
      const T_s = 2 * Math.PI * Math.sqrt(a ** 3 / (G * M));
      setKepler(p => ({ ...p, res: T_s / (365.25 * 24 * 3600) }));
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-mono mb-2">Astronomy Tools</h1>
        <p className="text-muted-foreground">Specialized calculators for astrophysics and observational astronomy.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Redshift */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Redshift Calculator</CardTitle>
            <CardDescription>Cosmological redshift and recession velocity from spectral lines.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <FormulaBox math="z = \dfrac{\lambda_{\rm obs} - \lambda_{\rm em}}{\lambda_{\rm em}}, \quad v \approx zc" />
            <div className="grid grid-cols-2 gap-3">
              <CalcField label="Observed Wavelength (nm)" value={redshift.lambdaObs} onChange={v => setRedshift(p => ({ ...p, lambdaObs: v }))} />
              <CalcField label="Emitted Wavelength (nm)" value={redshift.lambdaEm} onChange={v => setRedshift(p => ({ ...p, lambdaEm: v }))} />
            </div>
            <Button className="w-full" onClick={calcRedshift}>Calculate</Button>
            {redshift.z !== null && (
              <div className="space-y-2">
                <Result label="Redshift (z)" value={redshift.z!.toPrecision(5)} unit="" />
                <Result label="Recession Velocity" value={(redshift.v! / 1000).toExponential(4)} unit="km/s" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Luminosity */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Stellar Luminosity</CardTitle>
            <CardDescription>Calculate luminosity from flux or Stefan–Boltzmann law.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-2">
              {["flux", "sb"].map(m => (
                <button
                  key={m}
                  onClick={() => setLum(p => ({ ...p, mode: m, res: null }))}
                  className={`flex-1 py-2 rounded-md text-sm font-mono border transition-colors ${lum.mode === m ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                >
                  {m === "flux" ? "From Flux" : "Stefan–Boltzmann"}
                </button>
              ))}
            </div>
            {lum.mode === "flux" ? (
              <>
                <FormulaBox math="L = 4\pi d^2 F" />
                <div className="grid grid-cols-2 gap-3">
                  <CalcField label="Flux (W/m²)" value={lum.flux} onChange={v => setLum(p => ({ ...p, flux: v }))} />
                  <CalcField label="Distance (m)" value={lum.dist} onChange={v => setLum(p => ({ ...p, dist: v }))} />
                </div>
              </>
            ) : (
              <>
                <FormulaBox math="L = 4\pi R^2 \sigma T^4" />
                <div className="grid grid-cols-2 gap-3">
                  <CalcField label="Stellar Radius (m)" value={lum.R} onChange={v => setLum(p => ({ ...p, R: v }))} />
                  <CalcField label="Temperature (K)" value={lum.T} onChange={v => setLum(p => ({ ...p, T: v }))} />
                </div>
              </>
            )}
            <Button className="w-full" onClick={calcLum}>Calculate</Button>
            {lum.res !== null && (
              <div className="space-y-2">
                <Result label="Luminosity" value={lum.res.toExponential(4)} unit="W" />
                <Result label="In Solar Luminosities" value={(lum.res / L_SUN).toExponential(3)} unit="L☉" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hubble's Law */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Hubble's Law</CardTitle>
            <CardDescription>Relate recession velocity and distance using the Hubble constant.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <FormulaBox math="v = H_0 \, d" />
            <div className="flex gap-2">
              {["dist", "vel"].map(m => (
                <button
                  key={m}
                  onClick={() => setHubble(p => ({ ...p, mode: m, res: null }))}
                  className={`flex-1 py-2 rounded-md text-sm font-mono border transition-colors ${hubble.mode === m ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                >
                  {m === "dist" ? "Find Distance" : "Find Velocity"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <CalcField label={`H₀ (km/s/Mpc)`} value={hubble.H} onChange={v => setHubble(p => ({ ...p, H: v }))} placeholder="70" />
              {hubble.mode === "dist"
                ? <CalcField label="Recession Velocity (km/s)" value={hubble.v} onChange={v => setHubble(p => ({ ...p, v }))} />
                : <CalcField label="Distance (Mpc)" value={hubble.d} onChange={v => setHubble(p => ({ ...p, d: v }))} />
              }
            </div>
            <Button className="w-full" onClick={calcHubble}>Calculate</Button>
            {hubble.res !== null && <Result label={hubble.resLabel} value={hubble.res.toPrecision(5)} unit={hubble.mode === "dist" ? "Mpc" : "km/s"} />}
          </CardContent>
        </Card>

        {/* Kepler's Third Law */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Kepler's Third Law</CardTitle>
            <CardDescription>Orbital period from semi-major axis and central mass.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <FormulaBox math="T = 2\pi \sqrt{\dfrac{a^3}{GM}}" />
            <div className="grid grid-cols-2 gap-3">
              <CalcField label="Semi-major Axis (AU)" value={kepler.a} onChange={v => setKepler(p => ({ ...p, a: v }))} placeholder="1" />
              <CalcField label="Central Mass (M☉)" value={kepler.M} onChange={v => setKepler(p => ({ ...p, M: v }))} placeholder="1" />
            </div>
            <Button className="w-full" onClick={calcKepler}>Calculate</Button>
            {kepler.res !== null && <Result label="Orbital Period" value={kepler.res.toPrecision(5)} unit="years" />}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
