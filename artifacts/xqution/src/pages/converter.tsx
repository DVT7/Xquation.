import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  length:      "Length",
  mass:        "Mass",
  time:        "Time",
  temperature: "Temperature",
  speed:       "Speed / Velocity",
  force:       "Force",
  energy:      "Energy",
  power:       "Power",
  pressure:    "Pressure",
  area:        "Area",
  volume:      "Volume",
  frequency:   "Frequency",
  angle:       "Angle",
};

type UnitMap = Record<string, number>;

const UNITS: Record<string, UnitMap> = {
  length: {
    m: 1, km: 1e3, cm: 1e-2, mm: 1e-3,
    "μm": 1e-6, nm: 1e-9,
    mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254,
    AU: 1.496e11, ly: 9.461e15, pc: 3.086e16,
  },
  mass: {
    kg: 1, g: 1e-3, mg: 1e-6, t: 1e3,
    lb: 0.453592, oz: 0.0283495,
    u: 1.66054e-27,
  },
  time: {
    s: 1, ms: 1e-3, "μs": 1e-6, ns: 1e-9,
    min: 60, h: 3600, day: 86400, wk: 604800, yr: 31557600,
  },
  speed: {
    "m/s": 1, "km/h": 1 / 3.6, mph: 0.44704,
    "ft/s": 0.3048, knot: 0.514444, c: 2.998e8,
  },
  force: {
    N: 1, kN: 1e3, MN: 1e6, lbf: 4.44822, dyn: 1e-5,
  },
  energy: {
    J: 1, kJ: 1e3, MJ: 1e6,
    cal: 4.184, kcal: 4184, eV: 1.60218e-19, kWh: 3.6e6, BTU: 1055.06,
  },
  power: {
    W: 1, kW: 1e3, MW: 1e6, GW: 1e9, hp: 745.7,
  },
  pressure: {
    Pa: 1, kPa: 1e3, MPa: 1e6,
    atm: 101325, bar: 1e5, mmHg: 133.322, psi: 6894.76,
  },
  area: {
    "m²": 1, "km²": 1e6, "cm²": 1e-4, "mm²": 1e-6,
    "ft²": 0.0929030, "in²": 6.4516e-4, acre: 4046.86, ha: 1e4,
  },
  volume: {
    "m³": 1, L: 1e-3, mL: 1e-6, "cm³": 1e-6,
    "ft³": 0.0283168, gal: 3.78541e-3, "fl oz": 2.95735e-5,
  },
  frequency: {
    Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9, THz: 1e12,
  },
  angle: {
    deg: 1, rad: 180 / Math.PI, grad: 0.9,
    arcmin: 1 / 60, arcsec: 1 / 3600,
  },
};

function toKelvin(value: number, unit: string): number {
  switch (unit) {
    case "°C": return value + 273.15;
    case "°F": return (value + 459.67) * 5 / 9;
    case "K":  return value;
    case "°R": return value * 5 / 9;
    default:   return value;
  }
}

function fromKelvin(kelvin: number, unit: string): number {
  switch (unit) {
    case "°C": return kelvin - 273.15;
    case "°F": return kelvin * 9 / 5 - 459.67;
    case "K":  return kelvin;
    case "°R": return kelvin * 9 / 5;
    default:   return kelvin;
  }
}

function convertTemp(value: number, from: string, to: string): number {
  return fromKelvin(toKelvin(value, from), to);
}

function fmt(n: number): string {
  if (!isFinite(n)) return "";
  const abs = Math.abs(n);
  if (abs === 0) return "0";
  if (abs >= 1e-3 && abs < 1e7) {
    const s = parseFloat(n.toPrecision(6)).toString();
    return s;
  }
  return n.toExponential(4);
}

export default function Converter() {
  const [category, setCategory] = useState("length");
  const isTemp = category === "temperature";
  const tempUnits = ["°C", "°F", "K", "°R"];

  const unitKeys = isTemp ? tempUnits : Object.keys(UNITS[category] ?? {});

  const [val1, setVal1] = useState("1");
  const [val2, setVal2] = useState("");
  const [unit1, setUnit1] = useState(unitKeys[0]);
  const [unit2, setUnit2] = useState(unitKeys[1]);

  function convert(value: string, from: string, to: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return "";
    if (isTemp) return fmt(convertTemp(num, from, to));
    const map = UNITS[category];
    const inBase = num * map[from];
    return fmt(inBase / map[to]);
  }

  function changeCategory(cat: string) {
    setCategory(cat);
    const keys = cat === "temperature"
      ? tempUnits
      : Object.keys(UNITS[cat] ?? {});
    const u1 = keys[0];
    const u2 = keys[1];
    setUnit1(u1);
    setUnit2(u2);
    setVal1("1");
    setVal2(
      cat === "temperature"
        ? fmt(convertTemp(1, u1, u2))
        : fmt(UNITS[cat][u1] / UNITS[cat][u2])
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-mono mb-2">Unit Converter</h1>
        <p className="text-muted-foreground">Standard conversions for scientific calculations.</p>
      </div>

      <Card className="border-border/50 bg-card max-w-2xl mx-auto">
        <CardHeader className="border-b border-border/50 pb-4">
          <Select value={category} onValueChange={changeCategory}>
            <SelectTrigger className="font-mono text-base h-11">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 space-y-2 w-full">
              <Input
                className="font-mono text-xl h-14"
                value={val1}
                onChange={(e) => {
                  setVal1(e.target.value);
                  setVal2(convert(e.target.value, unit1, unit2));
                }}
              />
              <Select value={unit1} onValueChange={(u) => {
                setUnit1(u);
                setVal2(convert(val1, u, unit2));
              }}>
                <SelectTrigger className="font-mono"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {unitKeys.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center pt-2">
              <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="flex-1 space-y-2 w-full">
              <Input
                className="font-mono text-xl h-14"
                value={val2}
                onChange={(e) => {
                  setVal2(e.target.value);
                  setVal1(convert(e.target.value, unit2, unit1));
                }}
              />
              <Select value={unit2} onValueChange={(u) => {
                setUnit2(u);
                setVal2(convert(val1, unit1, u));
              }}>
                <SelectTrigger className="font-mono"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {unitKeys.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isTemp && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Temperature uses offset conversion — not a simple multiplication.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => changeCategory(key)}
            className={`px-3 py-2 rounded-lg text-sm font-mono text-left transition-colors border ${
              category === key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/50 bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
