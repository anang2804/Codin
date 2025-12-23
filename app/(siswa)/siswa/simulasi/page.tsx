"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Beaker,
  Atom,
  Zap,
  Calculator,
  TrendingUp,
  Globe,
  Microscope,
  Wind,
  Droplet,
  Activity,
  ExternalLink,
  Cpu,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";

interface Simulation {
  id: string;
  title: string;
  category: string;
  description: string;
  thumbnail: string;
  url: string;
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
  featured?: boolean;
  isLocal?: boolean;
}

const simulations: Simulation[] = [
  // Local Simulations (Custom Built)
  {
    id: "local-1",
    title: "Sistem Kasir IPO",
    category: "Komputer",
    description:
      "Simulasi interaktif sistem kasir yang menjelaskan konsep Input-Process-Output dengan visualisasi real-time",
    thumbnail: "/sim-thumbnails/kasir-ipo.jpg",
    url: "/siswa/simulasi/kasir-ipo",
    tags: ["IPO", "Algoritma", "Informatika"],
    difficulty: "easy",
    featured: true,
    isLocal: true,
  },
  // Physics
  {
    id: "1",
    title: "Quantum Coin Toss",
    category: "Physics",
    description:
      "Eksplorasi konsep quantum superposition dengan eksperimen toss koin kuantum",
    thumbnail: "/sim-thumbnails/quantum-coin.jpg",
    url: "https://phet.colorado.edu/sims/html/quantum-measurement/latest/quantum-measurement_en.html",
    tags: ["Quantum", "Probability"],
    difficulty: "hard",
    featured: true,
  },
  {
    id: "2",
    title: "Quantum Measurement",
    category: "Physics",
    description: "Pelajari pengukuran kuantum dan collapse fungsi gelombang",
    thumbnail: "/sim-thumbnails/quantum-measurement.jpg",
    url: "https://phet.colorado.edu/sims/html/quantum-measurement/latest/quantum-measurement_en.html",
    tags: ["Quantum", "Measurement"],
    difficulty: "hard",
    featured: true,
  },
  {
    id: "3",
    title: "Models of the Hydrogen Atom",
    category: "Physics",
    description:
      "Visualisasi berbagai model atom hidrogen dari klasik hingga kuantum",
    thumbnail: "/sim-thumbnails/hydrogen-atom.jpg",
    url: "https://phet.colorado.edu/sims/html/models-of-the-hydrogen-atom/latest/models-of-the-hydrogen-atom_en.html",
    tags: ["Atomic", "Quantum"],
    difficulty: "hard",
    featured: true,
  },
  {
    id: "4",
    title: "Buoyancy: Basics",
    category: "Physics",
    description:
      "Pahami prinsip dasar gaya apung Archimedes dengan berbagai benda",
    thumbnail: "/sim-thumbnails/buoyancy-basics.jpg",
    url: "https://phet.colorado.edu/sims/html/buoyancy/latest/buoyancy_en.html",
    tags: ["Fluids", "Forces"],
    difficulty: "easy",
  },
  {
    id: "5",
    title: "Buoyancy",
    category: "Physics",
    description: "Eksperimen lanjutan tentang gaya apung dan densitas",
    thumbnail: "/sim-thumbnails/buoyancy.jpg",
    url: "https://phet.colorado.edu/sims/html/buoyancy/latest/buoyancy_en.html",
    tags: ["Fluids", "Density"],
    difficulty: "medium",
  },
  {
    id: "6",
    title: "Generator",
    category: "Physics",
    description: "Simulasi generator listrik dan induksi elektromagnetik",
    thumbnail: "/sim-thumbnails/generator.jpg",
    url: "https://phet.colorado.edu/sims/html/faradays-law/latest/faradays-law_en.html",
    tags: ["Electricity", "Magnetism"],
    difficulty: "medium",
  },
  {
    id: "7",
    title: "Magnets and Electromagnets",
    category: "Physics",
    description: "Jelajahi medan magnet dan elektromagnet",
    thumbnail: "/sim-thumbnails/magnets.jpg",
    url: "https://phet.colorado.edu/sims/html/magnets-and-electromagnets/latest/magnets-and-electromagnets_en.html",
    tags: ["Magnetism", "Electricity"],
    difficulty: "easy",
  },
  {
    id: "8",
    title: "Pendulum Lab",
    category: "Physics",
    description: "Pelajari gerak harmonik sederhana dengan simulasi pendulum",
    thumbnail: "/sim-thumbnails/pendulum.jpg",
    url: "https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab_en.html",
    tags: ["Motion", "Energy"],
    difficulty: "easy",
  },

  // Math & Statistics
  {
    id: "9",
    title: "Number Pairs",
    category: "Math & Statistics",
    description: "Eksplorasi pasangan bilangan dan pola matematika",
    thumbnail: "/sim-thumbnails/number-pairs.jpg",
    url: "https://phet.colorado.edu/sims/html/number-pairs/latest/number-pairs_en.html",
    tags: ["Arithmetic", "Patterns"],
    difficulty: "easy",
    featured: true,
  },
  {
    id: "10",
    title: "Mean: Share and Balance",
    category: "Math & Statistics",
    description: "Pahami konsep rata-rata melalui sharing dan balancing",
    thumbnail: "/sim-thumbnails/mean.jpg",
    url: "https://phet.colorado.edu/sims/html/mean-share-and-balance/latest/mean-share-and-balance_en.html",
    tags: ["Statistics", "Mean"],
    difficulty: "easy",
    featured: true,
  },
  {
    id: "11",
    title: "Projectile Sampling Distributions",
    category: "Math & Statistics",
    description: "Visualisasi distribusi sampling dengan proyektil",
    thumbnail: "/sim-thumbnails/projectile-sampling.jpg",
    url: "https://phet.colorado.edu/sims/html/center-and-variability/latest/center-and-variability_en.html",
    tags: ["Statistics", "Probability"],
    difficulty: "medium",
    featured: true,
  },
  {
    id: "12",
    title: "Projectile Data Lab",
    category: "Math & Statistics",
    description: "Analisis data proyektil dan distribusi statistik",
    thumbnail: "/sim-thumbnails/projectile-data.jpg",
    url: "https://phet.colorado.edu/sims/html/center-and-variability/latest/center-and-variability_en.html",
    tags: ["Statistics", "Data Analysis"],
    difficulty: "medium",
  },
  {
    id: "13",
    title: "Center and Variability",
    category: "Math & Statistics",
    description: "Pelajari pusat data dan variabilitas dalam statistik",
    thumbnail: "/sim-thumbnails/center-variability.jpg",
    url: "https://phet.colorado.edu/sims/html/center-and-variability/latest/center-and-variability_en.html",
    tags: ["Statistics", "Variability"],
    difficulty: "medium",
  },
  {
    id: "14",
    title: "Kepler's Laws",
    category: "Math & Statistics",
    description: "Simulasi hukum Kepler tentang gerakan planet",
    thumbnail: "/sim-thumbnails/keplers-laws.jpg",
    url: "https://phet.colorado.edu/sims/html/keplers-laws/latest/keplers-laws_en.html",
    tags: ["Astronomy", "Physics"],
    difficulty: "medium",
  },
  {
    id: "15",
    title: "Quadrilateral",
    category: "Math & Statistics",
    description: "Eksplorasi sifat-sifat bangun datar segi empat",
    thumbnail: "/sim-thumbnails/quadrilateral.jpg",
    url: "https://phet.colorado.edu/sims/html/quadrilateral/latest/quadrilateral_en.html",
    tags: ["Geometry", "Shapes"],
    difficulty: "easy",
  },

  // Chemistry
  {
    id: "16",
    title: "Balancing Chemical Equations",
    category: "Chemistry",
    description: "Latihan menyeimbangkan persamaan reaksi kimia",
    thumbnail: "/sim-thumbnails/balancing-equations.jpg",
    url: "https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations_en.html",
    tags: ["Reactions", "Stoichiometry"],
    difficulty: "medium",
    featured: true,
  },
  {
    id: "17",
    title: "Molecules and Light",
    category: "Chemistry",
    description: "Interaksi molekul dengan cahaya berbagai panjang gelombang",
    thumbnail: "/sim-thumbnails/molecules-light.jpg",
    url: "https://phet.colorado.edu/sims/html/molecules-and-light/latest/molecules-and-light_en.html",
    tags: ["Molecular", "Spectroscopy"],
    difficulty: "medium",
  },
  {
    id: "18",
    title: "Build a Molecule",
    category: "Chemistry",
    description: "Bangun molekul dari atom-atom individual",
    thumbnail: "/sim-thumbnails/build-molecule.jpg",
    url: "https://phet.colorado.edu/sims/html/build-a-molecule/latest/build-a-molecule_en.html",
    tags: ["Molecular", "Bonding"],
    difficulty: "easy",
  },
  {
    id: "19",
    title: "Concentration",
    category: "Chemistry",
    description: "Pelajari konsep konsentrasi larutan",
    thumbnail: "/sim-thumbnails/concentration.jpg",
    url: "https://phet.colorado.edu/sims/html/concentration/latest/concentration_en.html",
    tags: ["Solutions", "Molarity"],
    difficulty: "medium",
  },
  {
    id: "20",
    title: "pH Scale",
    category: "Chemistry",
    description: "Eksplorasi skala pH dan sifat asam-basa",
    thumbnail: "/sim-thumbnails/ph-scale.jpg",
    url: "https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale_en.html",
    tags: ["Acids", "Bases"],
    difficulty: "easy",
  },
];

const categoryIcons: Record<string, any> = {
  Komputer: Cpu,
  Physics: Zap,
  "Math & Statistics": Calculator,
  Chemistry: Beaker,
};

const difficultyColors = {
  easy: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  hard: "bg-red-100 text-red-700 border-red-200",
};

export default function SiswaSimulasiPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    "all",
    ...Array.from(new Set(simulations.map((s) => s.category))),
  ];

  const filteredSimulations = useMemo(() => {
    return simulations.filter((sim) => {
      const matchesSearch =
        sim.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sim.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sim.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === "all" || sim.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const featuredSimulations = simulations.filter((s) => s.featured);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Microscope className="text-green-600" size={32} />
            Simulasi Interaktif
          </h1>
          <p className="text-gray-600 mt-1"></p>Simulasi interaktif untuk
          memahami algoritma dan pemrograman
        </div>
      </div>

      {/* Search & Filter */}
      <Card className="p-6 bg-white border-green-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              placeholder="Cari simulasi berdasarkan judul, deskripsi, atau tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-green-200 focus:border-green-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => {
              const Icon =
                categoryIcons[category as keyof typeof categoryIcons];
              return (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? "default" : "outline"
                  }
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap ${
                    selectedCategory === category
                      ? "bg-green-600 hover:bg-green-700"
                      : "border-green-200 hover:bg-green-50"
                  }`}
                >
                  {Icon && <Icon size={16} className="mr-2" />}
                  {category === "all" ? "Semua" : category}
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Featured Simulations */}
      {selectedCategory === "all" && !searchTerm && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="text-green-600" size={24} />
            Simulasi Unggulan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredSimulations.map((sim) => {
              const CategoryIcon = categoryIcons[sim.category];
              return (
                <Card
                  key={sim.id}
                  className="group hover:shadow-lg transition-all duration-300 border-green-100 hover:border-green-300 overflow-hidden bg-white"
                >
                  <div className="relative">
                    {sim.isLocal && sim.id === "local-1" ? (
                      <div className="h-40 bg-slate-100 p-3 flex items-center justify-center gap-2 relative overflow-hidden">
                        {/* Mini Monitor */}
                        <div className="flex-1 bg-slate-900 rounded-xl p-1 shadow-lg border-[3px] border-slate-800 relative">
                          <div className="bg-white rounded-lg h-full overflow-hidden">
                            <div className="h-3 bg-slate-100 border-b flex items-center px-1.5 gap-1">
                              <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                              <div className="text-[5px] font-mono text-slate-400">
                                Terminal
                              </div>
                            </div>
                            <div className="p-2 space-y-1">
                              <div className="flex gap-1">
                                <div className="w-6 h-6 bg-blue-50 rounded border border-blue-200"></div>
                                <div className="w-6 h-6 bg-blue-50 rounded border border-blue-200"></div>
                                <div className="w-6 h-6 bg-blue-50 rounded border border-blue-200"></div>
                              </div>
                              <div className="h-0.5 bg-slate-100 rounded"></div>
                              <div className="flex justify-between items-center">
                                <div className="text-[5px] font-mono text-slate-400">
                                  INPUT
                                </div>
                                <div className="text-[5px] font-mono text-blue-600 font-bold">
                                  → PROCESS
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Mini Printer */}
                        <div className="w-12 bg-slate-900 rounded-xl p-1 shadow-lg border-[3px] border-slate-800 flex flex-col items-center h-20">
                          <div className="w-6 h-1.5 bg-slate-800 rounded mt-1 mb-1"></div>
                          <div className="w-5 h-12 bg-white rounded shadow-sm border border-slate-200 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-2 bg-slate-50 border-b border-dashed"></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                        <CategoryIcon
                          size={64}
                          className="text-green-600 opacity-50"
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition-colors line-clamp-2">
                        {sim.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {sim.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge
                        variant="outline"
                        className="text-xs border-green-200 text-green-700"
                      >
                        {sim.category}
                      </Badge>
                      <Badge
                        className={`text-xs border ${
                          difficultyColors[sim.difficulty]
                        }`}
                      >
                        {sim.difficulty === "easy"
                          ? "Mudah"
                          : sim.difficulty === "medium"
                          ? "Sedang"
                          : "Sulit"}
                      </Badge>
                    </div>
                    <Button
                      asChild
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {sim.isLocal ? (
                        <Link href={sim.url}>
                          <Activity size={16} className="mr-2" />
                          Mulai Simulasi
                        </Link>
                      ) : (
                        <a
                          href={sim.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink size={16} className="mr-2" />
                          Buka Simulasi
                        </a>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All Simulations */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Globe className="text-green-600" size={24} />
          {selectedCategory === "all" ? "Semua Simulasi" : selectedCategory}
          <span className="text-sm font-normal text-gray-500">
            ({filteredSimulations.length} simulasi)
          </span>
        </h2>

        {filteredSimulations.length === 0 ? (
          <Card className="p-12 text-center border-green-100">
            <Microscope size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Tidak ada simulasi yang ditemukan</p>
            <p className="text-sm text-gray-400 mt-1">
              Coba ubah kata kunci atau filter kategori
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSimulations.map((sim) => {
              const CategoryIcon = categoryIcons[sim.category];
              return (
                <Card
                  key={sim.id}
                  className="group hover:shadow-lg transition-all duration-300 border-green-100 hover:border-green-300 overflow-hidden bg-white"
                >
                  <div className="relative">
                    {sim.isLocal && sim.id === "local-1" ? (
                      <div className="h-40 bg-slate-100 p-3 flex items-center justify-center gap-2 relative overflow-hidden group-hover:bg-slate-50 transition-colors">
                        {/* Mini Monitor */}
                        <div className="flex-1 bg-slate-900 rounded-xl p-1 shadow-lg border-[3px] border-slate-800 relative group-hover:border-slate-700 transition-colors">
                          <div className="bg-white rounded-lg h-full overflow-hidden">
                            <div className="h-3 bg-slate-100 border-b flex items-center px-1.5 gap-1">
                              <div className="w-1 h-1 rounded-full bg-blue-500 group-hover:animate-pulse"></div>
                              <div className="text-[5px] font-mono text-slate-400">
                                Terminal
                              </div>
                            </div>
                            <div className="p-2 space-y-1">
                              <div className="flex gap-1">
                                <div className="w-6 h-6 bg-blue-50 rounded border border-blue-200 group-hover:bg-blue-100 transition-colors"></div>
                                <div className="w-6 h-6 bg-blue-50 rounded border border-blue-200 group-hover:bg-blue-100 transition-colors"></div>
                                <div className="w-6 h-6 bg-blue-50 rounded border border-blue-200 group-hover:bg-blue-100 transition-colors"></div>
                              </div>
                              <div className="h-0.5 bg-slate-100 rounded"></div>
                              <div className="flex justify-between items-center">
                                <div className="text-[5px] font-mono text-slate-400">
                                  INPUT
                                </div>
                                <div className="text-[5px] font-mono text-blue-600 font-bold group-hover:text-amber-600 transition-colors">
                                  → PROCESS
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Mini Printer */}
                        <div className="w-12 bg-slate-900 rounded-xl p-1 shadow-lg border-[3px] border-slate-800 flex flex-col items-center h-20 group-hover:border-slate-700 transition-colors">
                          <div className="w-6 h-1.5 bg-slate-800 rounded mt-1 mb-1"></div>
                          <div className="w-5 h-12 bg-white rounded shadow-sm border border-slate-200 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-2 bg-slate-50 border-b border-dashed"></div>
                            <div className="absolute top-2 left-0 right-0 space-y-0.5 px-0.5">
                              <div className="h-0.5 bg-slate-200 rounded"></div>
                              <div className="h-0.5 bg-slate-200 rounded"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:from-green-50 group-hover:to-blue-50 transition-all">
                        <CategoryIcon
                          size={64}
                          className="text-gray-400 group-hover:text-green-600 transition-colors opacity-50"
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition-colors mb-2 line-clamp-2 min-h-[3rem]">
                      {sim.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">
                      {sim.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {sim.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs border-gray-200 text-gray-600"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mb-3">
                      <Badge
                        variant="outline"
                        className="text-xs border-green-200 text-green-700 flex-1 justify-center"
                      >
                        {sim.category}
                      </Badge>
                      <Badge
                        className={`text-xs border flex-1 justify-center ${
                          difficultyColors[sim.difficulty]
                        }`}
                      >
                        {sim.difficulty === "easy"
                          ? "Mudah"
                          : sim.difficulty === "medium"
                          ? "Sedang"
                          : "Sulit"}
                      </Badge>
                    </div>
                    <Button
                      asChild
                      className="w-full bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      {sim.isLocal ? (
                        <Link href={sim.url}>
                          <Activity size={16} className="mr-2" />
                          Mulai Simulasi
                        </Link>
                      ) : (
                        <a
                          href={sim.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink size={16} className="mr-2" />
                          Buka Simulasi
                        </a>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
