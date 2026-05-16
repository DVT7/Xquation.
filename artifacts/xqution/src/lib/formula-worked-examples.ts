export interface GivenItem {
  symbol: string;
  value: string;
  description: string;
}

export interface WorkedExample {
  problem: string;
  given: GivenItem[];
  constants?: GivenItem[];
  substituteLatex: string;
  resultLatex: string;
  finalAnswer: string;
}

export const WORKED_EXAMPLES: Record<number, WorkedExample> = {
  1: {
    problem: "A rocket starts from rest and accelerates at 25 m/s² for 8 seconds. Find the final velocity.",
    given: [
      { symbol: "v₀", value: "0 m/s", description: "starts from rest" },
      { symbol: "a",  value: "25 m/s²", description: "acceleration" },
      { symbol: "t",  value: "8 s", description: "time elapsed" },
    ],
    substituteLatex: "v = 0 + (25)(8)",
    resultLatex: "v = 200 \\text{ m/s}",
    finalAnswer: "200 m/s",
  },
  2: {
    problem: "A car starts from rest and accelerates at 3 m/s² for 10 seconds. How far does it travel?",
    given: [
      { symbol: "v₀", value: "0 m/s", description: "starts from rest" },
      { symbol: "a",  value: "3 m/s²", description: "acceleration" },
      { symbol: "t",  value: "10 s", description: "time elapsed" },
    ],
    substituteLatex: "x = (0)(10) + \\tfrac{1}{2}(3)(10)^2",
    resultLatex: "x = 0 + 150 = 150 \\text{ m}",
    finalAnswer: "150 m",
  },
  3: {
    problem: "A car moving at 20 m/s accelerates at 2 m/s² over a distance of 100 m. What is the final velocity?",
    given: [
      { symbol: "v₀", value: "20 m/s", description: "initial velocity" },
      { symbol: "a",  value: "2 m/s²", description: "acceleration" },
      { symbol: "x",  value: "100 m", description: "displacement" },
    ],
    substituteLatex: "v^2 = (20)^2 + 2(2)(100) = 400 + 400 = 800",
    resultLatex: "v = \\sqrt{800} \\approx 28.3 \\text{ m/s}",
    finalAnswer: "≈ 28.3 m/s",
  },
  4: {
    problem: "A 2500 kg car needs to accelerate at 3.5 m/s². What net force is required?",
    given: [
      { symbol: "m", value: "2500 kg", description: "mass of car" },
      { symbol: "a", value: "3.5 m/s²", description: "required acceleration" },
    ],
    substituteLatex: "F = (2500)(3.5)",
    resultLatex: "F = 8750 \\text{ N}",
    finalAnswer: "8750 N (8.75 kN)",
  },
  5: {
    problem: "Find the weight of a 70 kg person standing on Earth.",
    given: [
      { symbol: "m", value: "70 kg", description: "mass of person" },
    ],
    constants: [
      { symbol: "g", value: "9.81 m/s²", description: "standard gravitational acceleration" },
    ],
    substituteLatex: "W = (70)(9.81)",
    resultLatex: "W = 686.7 \\text{ N}",
    finalAnswer: "686.7 N ≈ 687 N",
  },
  6: {
    problem: "A 1200 kg car travels at 30 m/s. Find its kinetic energy.",
    given: [
      { symbol: "m", value: "1200 kg", description: "mass of car" },
      { symbol: "v", value: "30 m/s", description: "velocity" },
    ],
    substituteLatex: "KE = \\tfrac{1}{2}(1200)(30)^2 = \\tfrac{1}{2}(1200)(900)",
    resultLatex: "KE = 540{,}000 \\text{ J} = 540 \\text{ kJ}",
    finalAnswer: "540 kJ",
  },
  7: {
    problem: "A 5 kg ball is held 10 m above the ground. Find its gravitational potential energy.",
    given: [
      { symbol: "m", value: "5 kg", description: "mass of ball" },
      { symbol: "h", value: "10 m", description: "height above ground" },
    ],
    constants: [
      { symbol: "g", value: "9.81 m/s²", description: "standard gravitational acceleration" },
    ],
    substituteLatex: "PE = (5)(9.81)(10)",
    resultLatex: "PE = 490.5 \\text{ J}",
    finalAnswer: "490.5 J",
  },
  8: {
    problem: "A 50 N force pulls a box 8 m along the floor at 30° to the direction of motion. Find the work done.",
    given: [
      { symbol: "F", value: "50 N", description: "applied force" },
      { symbol: "d", value: "8 m", description: "displacement" },
      { symbol: "θ", value: "30°", description: "angle between force and displacement" },
    ],
    substituteLatex: "W = (50)(8)\\cos(30°) = 400 \\times 0.866",
    resultLatex: "W \\approx 346 \\text{ J}",
    finalAnswer: "≈ 346 J",
  },
  9: {
    problem: "An electric motor does 15,000 J of work in 5 seconds. Find its output power.",
    given: [
      { symbol: "W", value: "15,000 J", description: "work done" },
      { symbol: "t", value: "5 s", description: "time elapsed" },
    ],
    substituteLatex: "P = \\frac{15{,}000}{5}",
    resultLatex: "P = 3{,}000 \\text{ W} = 3 \\text{ kW}",
    finalAnswer: "3 kW",
  },
  10: {
    problem: "Find the momentum of a 0.145 kg baseball thrown at 40 m/s.",
    given: [
      { symbol: "m", value: "0.145 kg", description: "mass of baseball" },
      { symbol: "v", value: "40 m/s", description: "velocity" },
    ],
    substituteLatex: "p = (0.145)(40)",
    resultLatex: "p = 5.8 \\text{ kg·m/s}",
    finalAnswer: "5.8 kg·m/s",
  },
  11: {
    problem: "A 200 N force acts on a stationary object for 0.05 s. Find the impulse delivered.",
    given: [
      { symbol: "F",  value: "200 N", description: "average force" },
      { symbol: "Δt", value: "0.05 s", description: "duration of force" },
    ],
    substituteLatex: "J = (200)(0.05)",
    resultLatex: "J = 10 \\text{ N·s}",
    finalAnswer: "10 N·s",
  },
  12: {
    problem: "Find the gravitational force between the Earth and the Moon.",
    given: [
      { symbol: "m₁", value: "5.972×10²⁴ kg", description: "mass of Earth" },
      { symbol: "m₂", value: "7.342×10²² kg", description: "mass of Moon" },
      { symbol: "r",  value: "3.84×10⁸ m", description: "Earth–Moon distance" },
    ],
    constants: [
      { symbol: "G", value: "6.674×10⁻¹¹ N·m²/kg²", description: "gravitational constant" },
    ],
    substituteLatex: "F = \\frac{(6.674\\times10^{-11})(5.972\\times10^{24})(7.342\\times10^{22})}{(3.84\\times10^{8})^2}",
    resultLatex: "F \\approx 1.98\\times10^{20} \\text{ N}",
    finalAnswer: "≈ 1.98 × 10²⁰ N",
  },
  13: {
    problem: "Calculate the escape velocity from Earth's surface.",
    given: [
      { symbol: "M", value: "5.972×10²⁴ kg", description: "mass of Earth" },
      { symbol: "r", value: "6.371×10⁶ m", description: "radius of Earth" },
    ],
    constants: [
      { symbol: "G", value: "6.674×10⁻¹¹ N·m²/kg²", description: "gravitational constant" },
    ],
    substituteLatex: "v_e = \\sqrt{\\frac{2(6.674\\times10^{-11})(5.972\\times10^{24})}{6.371\\times10^{6}}}",
    resultLatex: "v_e \\approx 11{,}186 \\text{ m/s}",
    finalAnswer: "≈ 11.2 km/s",
  },
  14: {
    problem: "2 moles of gas are held at 300 K in a 10 L container. Find the pressure.",
    given: [
      { symbol: "n", value: "2 mol", description: "amount of gas" },
      { symbol: "T", value: "300 K", description: "temperature" },
      { symbol: "V", value: "0.01 m³", description: "volume (10 L = 0.01 m³)" },
    ],
    constants: [
      { symbol: "R", value: "8.314 J/(mol·K)", description: "molar gas constant" },
    ],
    substituteLatex: "P = \\frac{(2)(8.314)(300)}{0.01}",
    resultLatex: "P = 498{,}840 \\text{ Pa} \\approx 4.99\\times10^{5} \\text{ Pa}",
    finalAnswer: "≈ 499 kPa (≈ 4.92 atm)",
  },
  15: {
    problem: "A gas absorbs 500 J of heat and does 200 J of work on its surroundings. Find the change in internal energy.",
    given: [
      { symbol: "Q", value: "500 J", description: "heat absorbed by the system" },
      { symbol: "W", value: "200 J", description: "work done by the system" },
    ],
    substituteLatex: "\\Delta U = 500 - 200",
    resultLatex: "\\Delta U = 300 \\text{ J}",
    finalAnswer: "300 J",
  },
  16: {
    problem: "A sound wave has a frequency of 440 Hz and a wavelength of 0.780 m. Find the wave speed.",
    given: [
      { symbol: "f", value: "440 Hz", description: "frequency (concert A)" },
      { symbol: "λ", value: "0.780 m", description: "wavelength" },
    ],
    substituteLatex: "v = (440)(0.780)",
    resultLatex: "v = 343.2 \\text{ m/s}",
    finalAnswer: "343 m/s (matches speed of sound in air ✓)",
  },
  17: {
    problem: "A ray of light passes from air into glass at an angle of incidence of 30°. Find the refracted angle. (n_glass = 1.5)",
    given: [
      { symbol: "n₁", value: "1.00", description: "refractive index of air" },
      { symbol: "θ₁", value: "30°", description: "angle of incidence" },
      { symbol: "n₂", value: "1.50", description: "refractive index of glass" },
    ],
    substituteLatex: "\\theta_2 = \\arcsin\\!\\left(\\frac{(1.00)\\sin 30°}{1.50}\\right) = \\arcsin(0.333)",
    resultLatex: "\\theta_2 \\approx 19.5°",
    finalAnswer: "≈ 19.5°",
  },
  18: {
    problem: "An object is placed 30 cm from a converging lens with focal length 10 cm. Where does the image form?",
    given: [
      { symbol: "f",  value: "0.10 m", description: "focal length" },
      { symbol: "d₀", value: "0.30 m", description: "object distance" },
    ],
    substituteLatex: "\\frac{1}{d_i} = \\frac{1}{0.10} - \\frac{1}{0.30} = 10 - 3.33 = 6.67",
    resultLatex: "d_i = \\frac{1}{6.67} \\approx 0.15 \\text{ m}",
    finalAnswer: "15 cm (real image on the other side)",
  },
  19: {
    problem: "A 12 Ω resistor carries a current of 2 A. Find the voltage across it.",
    given: [
      { symbol: "I", value: "2 A", description: "current through resistor" },
      { symbol: "R", value: "12 Ω", description: "resistance" },
    ],
    substituteLatex: "V = (2)(12)",
    resultLatex: "V = 24 \\text{ V}",
    finalAnswer: "24 V",
  },
  20: {
    problem: "A hair dryer draws 12.5 A from a 120 V supply. Find its power consumption.",
    given: [
      { symbol: "I", value: "12.5 A", description: "current drawn" },
      { symbol: "V", value: "120 V", description: "supply voltage" },
    ],
    substituteLatex: "P = (12.5)(120)",
    resultLatex: "P = 1500 \\text{ W}",
    finalAnswer: "1500 W (1.5 kW)",
  },
  21: {
    problem: "Find the electrostatic force between a +2 μC charge and a −3 μC charge separated by 0.50 m.",
    given: [
      { symbol: "q₁", value: "2×10⁻⁶ C", description: "first charge (+2 μC)" },
      { symbol: "q₂", value: "3×10⁻⁶ C", description: "second charge (−3 μC)" },
      { symbol: "r",  value: "0.50 m", description: "separation" },
    ],
    constants: [
      { symbol: "kₑ", value: "8.99×10⁹ N·m²/C²", description: "Coulomb constant" },
    ],
    substituteLatex: "F = \\frac{(8.99\\times10^9)(2\\times10^{-6})(3\\times10^{-6})}{(0.50)^2}",
    resultLatex: "F \\approx 0.216 \\text{ N (attractive)}",
    finalAnswer: "≈ 0.216 N (attractive, opposite charges)",
  },
  22: {
    problem: "A 4×10⁻⁶ N force acts on a 2×10⁻⁶ C positive test charge. Find the electric field strength.",
    given: [
      { symbol: "F", value: "4×10⁻⁶ N", description: "force on test charge" },
      { symbol: "q", value: "2×10⁻⁶ C", description: "test charge" },
    ],
    substituteLatex: "E = \\frac{4\\times10^{-6}}{2\\times10^{-6}}",
    resultLatex: "E = 2 \\text{ N/C}",
    finalAnswer: "2 N/C",
  },
  23: {
    problem: "Find the energy equivalent of a 1 gram paperclip using mass-energy equivalence.",
    given: [
      { symbol: "m", value: "0.001 kg", description: "mass of paperclip" },
    ],
    constants: [
      { symbol: "c", value: "2.998×10⁸ m/s", description: "speed of light" },
    ],
    substituteLatex: "E = (0.001)(2.998\\times10^8)^2",
    resultLatex: "E \\approx 8.99\\times10^{13} \\text{ J}",
    finalAnswer: "≈ 9×10¹³ J (enough to power a city for years)",
  },
  24: {
    problem: "Find the energy of a photon of green light with frequency 6.0×10¹⁴ Hz.",
    given: [
      { symbol: "f", value: "6.0×10¹⁴ Hz", description: "frequency of green light" },
    ],
    constants: [
      { symbol: "h", value: "6.626×10⁻³⁴ J·s", description: "Planck constant" },
    ],
    substituteLatex: "E = (6.626\\times10^{-34})(6.0\\times10^{14})",
    resultLatex: "E \\approx 3.98\\times10^{-19} \\text{ J}",
    finalAnswer: "≈ 3.98 × 10⁻¹⁹ J (≈ 2.49 eV)",
  },
  25: {
    problem: "Find the de Broglie wavelength of an electron moving at 1% of the speed of light.",
    given: [
      { symbol: "m", value: "9.109×10⁻³¹ kg", description: "mass of electron" },
      { symbol: "v", value: "2.998×10⁶ m/s", description: "velocity (1% of c)" },
    ],
    constants: [
      { symbol: "h", value: "6.626×10⁻³⁴ J·s", description: "Planck constant" },
    ],
    substituteLatex: "\\lambda = \\frac{6.626\\times10^{-34}}{(9.109\\times10^{-31})(2.998\\times10^{6})}",
    resultLatex: "\\lambda \\approx 2.42\\times10^{-10} \\text{ m}",
    finalAnswer: "≈ 2.42 Å (comparable to atomic spacing)",
  },
  26: {
    problem: "An electron is confined to a region of 1.0×10⁻¹⁰ m (atomic scale). Find the minimum uncertainty in its momentum.",
    given: [
      { symbol: "Δx", value: "1.0×10⁻¹⁰ m", description: "position uncertainty" },
    ],
    constants: [
      { symbol: "ℏ", value: "1.055×10⁻³⁴ J·s", description: "reduced Planck constant" },
    ],
    substituteLatex: "\\Delta p_{\\min} = \\frac{1.055\\times10^{-34}}{2(1.0\\times10^{-10})}",
    resultLatex: "\\Delta p_{\\min} \\approx 5.28\\times10^{-25} \\text{ kg·m/s}",
    finalAnswer: "≈ 5.28 × 10⁻²⁵ kg·m/s",
  },
  27: {
    problem: "Find the orbital period of Earth around the Sun. (a = 1 AU = 1.496×10¹¹ m, M☉ = 1.989×10³⁰ kg)",
    given: [
      { symbol: "a", value: "1.496×10¹¹ m", description: "semi-major axis (1 AU)" },
      { symbol: "M", value: "1.989×10³⁰ kg", description: "mass of the Sun" },
    ],
    constants: [
      { symbol: "G", value: "6.674×10⁻¹¹ N·m²/kg²", description: "gravitational constant" },
    ],
    substituteLatex: "T = 2\\pi\\sqrt{\\frac{(1.496\\times10^{11})^3}{(6.674\\times10^{-11})(1.989\\times10^{30})}}",
    resultLatex: "T \\approx 3.156\\times10^{7} \\text{ s}",
    finalAnswer: "≈ 3.156 × 10⁷ s = 365.3 days ✓",
  },
  28: {
    problem: "Find the Schwarzschild radius of the Sun.",
    given: [
      { symbol: "M", value: "1.989×10³⁰ kg", description: "mass of the Sun" },
    ],
    constants: [
      { symbol: "G", value: "6.674×10⁻¹¹ N·m²/kg²", description: "gravitational constant" },
      { symbol: "c", value: "2.998×10⁸ m/s", description: "speed of light" },
    ],
    substituteLatex: "r_s = \\frac{2(6.674\\times10^{-11})(1.989\\times10^{30})}{(2.998\\times10^{8})^2}",
    resultLatex: "r_s \\approx 2.95\\times10^{3} \\text{ m}",
    finalAnswer: "≈ 2.95 km",
  },
  29: {
    problem: "The Sun's luminosity is 3.828×10²⁶ W. Find the solar flux at Earth's distance (1 AU = 1.496×10¹¹ m).",
    given: [
      { symbol: "L", value: "3.828×10²⁶ W", description: "solar luminosity" },
      { symbol: "d", value: "1.496×10¹¹ m", description: "Earth–Sun distance (1 AU)" },
    ],
    substituteLatex: "F = \\frac{3.828\\times10^{26}}{4\\pi(1.496\\times10^{11})^2}",
    resultLatex: "F \\approx 1361 \\text{ W/m}^2",
    finalAnswer: "≈ 1361 W/m² (the Solar Constant ✓)",
  },
  30: {
    problem: "Calculate the luminosity of the Sun. (R☉ = 6.957×10⁸ m, T = 5778 K)",
    given: [
      { symbol: "R", value: "6.957×10⁸ m", description: "solar radius" },
      { symbol: "T", value: "5778 K", description: "photospheric temperature" },
    ],
    constants: [
      { symbol: "σ", value: "5.671×10⁻⁸ W/(m²·K⁴)", description: "Stefan–Boltzmann constant" },
    ],
    substituteLatex: "L = 4\\pi(6.957\\times10^8)^2(5.671\\times10^{-8})(5778)^4",
    resultLatex: "L \\approx 3.83\\times10^{26} \\text{ W}",
    finalAnswer: "≈ 3.83 × 10²⁶ W (matches L☉ ✓)",
  },
  31: {
    problem: "Find the orbital speed of the ISS at an altitude of 400 km above Earth.",
    given: [
      { symbol: "M", value: "5.972×10²⁴ kg", description: "mass of Earth" },
      { symbol: "r", value: "6.771×10⁶ m", description: "orbital radius (R_Earth + 400 km)" },
    ],
    constants: [
      { symbol: "G", value: "6.674×10⁻¹¹ N·m²/kg²", description: "gravitational constant" },
    ],
    substituteLatex: "v = \\sqrt{\\frac{(6.674\\times10^{-11})(5.972\\times10^{24})}{6.771\\times10^{6}}}",
    resultLatex: "v \\approx 7{,}668 \\text{ m/s}",
    finalAnswer: "≈ 7.67 km/s",
  },
  32: {
    problem: "A galaxy is observed at a distance of 100 Mpc. Using H₀ = 70 km/s/Mpc, find its recession velocity.",
    given: [
      { symbol: "d",  value: "100 Mpc", description: "distance to galaxy" },
      { symbol: "H₀", value: "70 km/s/Mpc", description: "Hubble constant" },
    ],
    substituteLatex: "v = (70)(100)",
    resultLatex: "v = 7{,}000 \\text{ km/s}",
    finalAnswer: "7,000 km/s (≈ 2.3% of c)",
  },
};
