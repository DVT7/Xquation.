export interface FormulaRelated {
  constantIds: number[];
  topics: string[];
  derivation?: string[];
  derivationFormulaNames?: string[];
}

export const FORMULA_RELATED: Record<number, FormulaRelated> = {
  1: {
    constantIds: [],
    topics: ["Acceleration", "Velocity", "Inertia"],
    derivation: [
      "Start from the definition of acceleration: a = Δv/Δt",
      "Rearrange: Δv = aΔt",
      "Express as change: v - v₀ = at",
      "Solve for final velocity: v = v₀ + at",
    ],
  },
  2: {
    constantIds: [],
    topics: ["Acceleration", "Velocity", "Work-Energy Theorem"],
    derivation: [
      "Start with the definition of displacement for constant acceleration.",
      "Average velocity = (v₀ + v)/2 = (v₀ + v₀ + at)/2 = v₀ + ½at",
      "Displacement x = v_avg × t = (v₀ + ½at) × t",
      "Expand: x = v₀t + ½at²",
    ],
  },
  3: {
    constantIds: [],
    topics: ["Acceleration", "Velocity"],
    derivation: [
      "From v = v₀ + at, square both sides: v² = (v₀ + at)²",
      "Expand: v² = v₀² + 2v₀at + a²t²",
      "Factor: v² = v₀² + 2a(v₀t + ½at²)",
      "Recognise that x = v₀t + ½at², so: v² = v₀² + 2ax",
    ],
  },
  4: {
    constantIds: [],
    topics: ["Force", "Acceleration", "Inertia", "Mass"],
    derivation: [
      "Newton's Second Law states force equals rate of change of momentum.",
      "F = dp/dt = d(mv)/dt",
      "For constant mass: F = m(dv/dt)",
      "Since dv/dt = a: F = ma",
    ],
  },
  5: {
    constantIds: [16],
    topics: ["Force", "Mass", "Acceleration"],
    derivation: [
      "Weight is a special case of Newton's Second Law: F = ma",
      "Near Earth's surface, a = g (gravitational acceleration).",
      "Substituting: W = mg",
    ],
  },
  6: {
    constantIds: [],
    topics: ["Work-Energy Theorem", "Conservation of Energy", "Velocity"],
    derivation: [
      "Work-energy theorem: the work done on an object equals its change in kinetic energy.",
      "W = ∫F·dx = ∫(ma)dx = m∫(dv/dt)dx",
      "Using dx = v·dt: W = m∫v·dv = ½mv²",
      "Therefore: KE = ½mv²",
    ],
  },
  7: {
    constantIds: [16],
    topics: ["Potential Energy", "Conservation of Energy", "Work-Energy Theorem"],
    derivation: [
      "Work done against gravity to lift mass m to height h:",
      "W = F × d = mg × h",
      "This work is stored as gravitational potential energy.",
      "Therefore: PE = mgh",
    ],
  },
  8: {
    constantIds: [],
    topics: ["Force", "Work-Energy Theorem", "Conservation of Energy"],
    derivation: [
      "Work is defined as force times displacement in the direction of motion.",
      "Only the component of force parallel to displacement does work.",
      "Parallel component = F·cos(θ)",
      "Therefore: W = F·d·cos(θ)",
    ],
  },
  9: {
    constantIds: [],
    topics: ["Work-Energy Theorem", "Watt"],
    derivation: [
      "Power is defined as the rate of doing work.",
      "P = dW/dt",
      "For constant power: P = W/t",
    ],
  },
  10: {
    constantIds: [],
    topics: ["Mass", "Velocity", "Impulse", "Conservation of Momentum"],
    derivation: [
      "Momentum is defined as the product of mass and velocity.",
      "p = mv",
      "It is a vector quantity — direction matters.",
    ],
  },
  11: {
    constantIds: [],
    topics: ["Force", "Impulse", "Conservation of Momentum"],
    derivation: [
      "Newton's Second Law: F = dp/dt",
      "Multiply both sides by dt and integrate:",
      "∫F dt = Δp",
      "For constant force: F·Δt = mv - mv₀ = J",
    ],
  },
  12: {
    constantIds: [2],
    topics: ["Force", "Gravitational Lensing", "Orbital Period", "Black Hole"],
    derivation: [
      "Newton derived this empirically, confirmed by Kepler's laws.",
      "Force is proportional to each mass: F ∝ m₁m₂",
      "Force diminishes with the square of distance: F ∝ 1/r²",
      "Combining: F = Gm₁m₂/r², where G is the gravitational constant.",
    ],
  },
  13: {
    constantIds: [2],
    topics: ["Velocity", "Black Hole", "Orbital Period"],
    derivation: [
      "Set kinetic energy equal to gravitational potential energy at the surface:",
      "½mv² = GMm/r",
      "Solve for v: v² = 2GM/r",
      "Take the square root: v_escape = √(2GM/r)",
    ],
    derivationFormulaNames: ["Kinetic Energy", "Newton's Law of Gravitation"],
  },
  14: {
    constantIds: [17],
    topics: ["Plasma", "Thermal Equilibrium", "Kinetic Theory", "Entropy"],
    derivation: [
      "Combine the three empirical gas laws:",
      "Boyle's Law: PV = const (at constant T)",
      "Charles' Law: V/T = const (at constant P)",
      "Avogadro's Law: V ∝ n (at constant P, T)",
      "Combining: PV = nRT, where R is the molar gas constant.",
    ],
  },
  15: {
    constantIds: [],
    topics: ["Conservation of Energy", "Entropy", "Thermal Equilibrium"],
    derivation: [
      "The first law is a statement of conservation of energy for a thermodynamic system.",
      "Energy entering as heat (Q) increases internal energy.",
      "Energy leaving as work done (W) decreases internal energy.",
      "Therefore: ΔU = Q − W",
    ],
  },
  16: {
    constantIds: [],
    topics: ["Wavelength", "Frequency", "Electromagnetic Spectrum"],
    derivation: [
      "A wave travels one wavelength (λ) in one period (T = 1/f).",
      "Speed = distance/time = λ/T",
      "Since T = 1/f: v = λ × f",
      "Therefore: v = fλ",
    ],
  },
  17: {
    constantIds: [],
    topics: ["Interference", "Wavelength", "Electromagnetic Spectrum"],
    derivation: [
      "Snell's law follows from Fermat's Principle of least time.",
      "Light minimises travel time, which leads to bending at interfaces.",
      "At the boundary: sin(θ₁)/v₁ = sin(θ₂)/v₂",
      "Since n = c/v: n₁·sin(θ₁) = n₂·sin(θ₂)",
    ],
  },
  18: {
    constantIds: [],
    topics: ["Interference", "Frequency", "Wavelength"],
    derivation: [
      "Derived from the geometry of similar triangles formed by object, lens, and image.",
      "For a thin lens: 1/f = 1/d_o + 1/d_i",
      "This is the lensmaker's equation for a thin converging or diverging lens.",
    ],
  },
  19: {
    constantIds: [],
    topics: ["Electric Field", "Resistance", "Semiconductor"],
    derivation: [
      "Ohm's Law is empirical: V ∝ I for many conductors.",
      "The constant of proportionality is resistance R.",
      "V = IR",
    ],
  },
  20: {
    constantIds: [],
    topics: ["Electric Field", "Watt", "Resistance"],
    derivation: [
      "Power = rate of energy delivery = dW/dt",
      "Work done moving charge q through voltage V: W = qV",
      "Current I = dq/dt, so P = dW/dt = V·dq/dt = IV",
    ],
  },
  21: {
    constantIds: [15],
    topics: ["Electric Field", "Coulomb", "Force"],
    derivation: [
      "Coulomb's Law is analogous to Newton's Law of Gravitation.",
      "Force is proportional to each charge: F ∝ q₁q₂",
      "Force diminishes with the square of distance: F ∝ 1/r²",
      "Combining: F = kₑq₁q₂/r², where kₑ = 1/(4πε₀)",
    ],
    derivationFormulaNames: ["Newton's Law of Gravitation"],
  },
  22: {
    constantIds: [15, 13],
    topics: ["Electric Field", "Force", "Coulomb"],
    derivation: [
      "Electric field is defined as force per unit positive test charge.",
      "E = F/q",
      "This allows us to describe the field independently of the test charge.",
    ],
  },
  23: {
    constantIds: [1],
    topics: ["Photon", "Nuclear Fission", "Fusion"],
    derivation: [
      "Einstein derived this from special relativity.",
      "The total energy of a relativistic particle: E² = (pc)² + (mc²)²",
      "For a particle at rest, p = 0: E² = (mc²)²",
      "Therefore: E = mc²",
    ],
  },
  24: {
    constantIds: [3],
    topics: ["Photon", "Photoelectric Effect", "Planck's Constant", "Electromagnetic Spectrum"],
    derivation: [
      "Planck introduced quantisation to explain blackbody radiation.",
      "Energy is emitted in discrete packets (quanta) of size hf.",
      "Einstein extended this to photons: E = hf",
    ],
    derivationFormulaNames: ["Photon Energy"],
  },
  25: {
    constantIds: [3, 4],
    topics: ["Quantum Mechanics", "Wave Function", "Uncertainty Principle", "Photon"],
    derivation: [
      "de Broglie proposed wave-particle duality for matter.",
      "For photons: E = hf = hc/λ, and E = pc, so p = h/λ",
      "de Broglie extended this to all particles: λ = h/p = h/(mv)",
    ],
    derivationFormulaNames: ["Photon Energy", "Momentum"],
  },
  26: {
    constantIds: [4],
    topics: ["Uncertainty Principle", "Quantum Mechanics", "Wave Function"],
    derivation: [
      "Heisenberg derived this from the wave nature of particles.",
      "A particle localised in space must have a spread of momenta.",
      "Mathematically, Fourier analysis gives: σ_x·σ_p ≥ ℏ/2",
    ],
  },
  27: {
    constantIds: [2],
    topics: ["Kepler's Laws", "Orbital Period", "Gravitational Lensing"],
    derivation: [
      "Set gravitational force equal to centripetal force for a circular orbit:",
      "GMm/r² = mv²/r  →  v = √(GM/r)",
      "Orbital circumference = 2πr, so T = 2πr/v",
      "Substitute v: T = 2πr/√(GM/r) = 2π√(r³/GM)",
      "Squaring: T² = (4π²/GM)a³",
    ],
    derivationFormulaNames: ["Newton's Law of Gravitation", "Orbital Velocity"],
  },
  28: {
    constantIds: [2, 1],
    topics: ["Black Hole", "Event Horizon", "Schwarzschild Radius", "Spacetime Curvature"],
    derivation: [
      "Karl Schwarzschild solved Einstein's field equations in 1916.",
      "The escape velocity from a mass M at radius r: v_e = √(2GM/r)",
      "Set v_e = c (light cannot escape): c² = 2GM/r_s",
      "Solve for r_s: r_s = 2GM/c²",
    ],
    derivationFormulaNames: ["Escape Velocity", "Mass-Energy Equivalence"],
  },
  29: {
    constantIds: [23],
    topics: ["Galaxy", "Redshift", "Electromagnetic Spectrum", "Quasar"],
    derivation: [
      "A point source radiates isotropically (equally in all directions).",
      "Total power L spreads over the surface of a sphere of radius d.",
      "Surface area of sphere = 4πd²",
      "Flux F = L / (4πd²)",
    ],
  },
  30: {
    constantIds: [8, 22],
    topics: ["Redshift", "Galaxy", "Pulsar", "White Dwarf", "Neutron Star"],
    derivation: [
      "A star radiates like a blackbody with power per unit area = σT⁴",
      "Total surface area of a sphere of radius R = 4πR²",
      "Total luminosity L = area × power per unit area",
      "L = 4πR²σT⁴",
    ],
    derivationFormulaNames: ["Luminosity-Flux Relation"],
  },
  31: {
    constantIds: [2],
    topics: ["Kepler's Laws", "Orbital Period", "Gravitational Lensing"],
    derivation: [
      "For a circular orbit, gravity provides the centripetal force.",
      "GMm/r² = mv²/r",
      "Cancel m, multiply both sides by r:",
      "GM/r = v²  →  v = √(GM/r)",
    ],
    derivationFormulaNames: ["Newton's Law of Gravitation", "Kepler's Third Law"],
  },
  32: {
    constantIds: [24],
    topics: ["Redshift", "Galaxy", "Cosmological Redshift", "Dark Energy"],
    derivation: [
      "Hubble observed that galaxy recession velocity is proportional to distance.",
      "v = H₀d  (Hubble's Law, 1929)",
      "H₀ is the Hubble constant (~70 km/s/Mpc).",
      "The linear relation breaks down at cosmological distances (need GR corrections).",
    ],
  },
};
