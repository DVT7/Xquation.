import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const units = {
  length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, yd: 1609.344, ft: 0.3048, in: 0.0254 },
  mass: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495 },
  time: { s: 1, min: 60, h: 3600, day: 86400, yr: 31536000 }
};

export default function Converter() {
  const [category, setCategory] = useState<keyof typeof units>("length");
  const [val1, setVal1] = useState("1");
  const [unit1, setUnit1] = useState(Object.keys(units.length)[0]);
  const [val2, setVal2] = useState("");
  const [unit2, setUnit2] = useState(Object.keys(units.length)[1]);

  const handleConvert = (val: string, fromUnit: string, toUnit: string, setTarget: (v: string) => void) => {
    const num = parseFloat(val);
    if (isNaN(num)) {
      setTarget("");
      return;
    }
    const base = num * units[category][fromUnit as keyof typeof units[typeof category]];
    const target = base / units[category][toUnit as keyof typeof units[typeof category]];
    setTarget(target.toPrecision(5).replace(/\.?0+$/, ""));
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-mono mb-2">Unit Converter</h1>
        <p className="text-muted-foreground">Standard conversions for scientific calculations.</p>
      </div>

      <Card className="border-border/50 bg-card max-w-2xl mx-auto">
        <CardHeader className="border-b border-border/50 pb-4">
          <Select value={category} onValueChange={(val: any) => {
            setCategory(val);
            setUnit1(Object.keys(units[val as keyof typeof units])[0]);
            setUnit2(Object.keys(units[val as keyof typeof units])[1]);
            setVal1("1");
            setVal2("");
          }}>
            <SelectTrigger className="font-mono text-lg h-12">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="length">Length</SelectItem>
              <SelectItem value="mass">Mass</SelectItem>
              <SelectItem value="time">Time</SelectItem>
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
                  handleConvert(e.target.value, unit1, unit2, setVal2);
                }} 
              />
              <Select value={unit1} onValueChange={(u) => {
                setUnit1(u);
                handleConvert(val1, u, unit2, setVal2);
              }}>
                <SelectTrigger className="font-mono"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(units[category]).map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-muted-foreground font-mono font-bold text-2xl">=</div>

            <div className="flex-1 space-y-2 w-full">
              <Input 
                className="font-mono text-xl h-14" 
                value={val2} 
                onChange={(e) => {
                  setVal2(e.target.value);
                  handleConvert(e.target.value, unit2, unit1, setVal1);
                }} 
              />
              <Select value={unit2} onValueChange={(u) => {
                setUnit2(u);
                handleConvert(val1, unit1, u, setVal2);
              }}>
                <SelectTrigger className="font-mono"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(units[category]).map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
