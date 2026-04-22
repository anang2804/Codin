"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  RotateCcw,
  Activity,
  CheckCircle2,
  BookOpen,
  Flag,
  Lightbulb,
  Terminal,
  Edit3,
  AlertTriangle,
  Cpu,
  ArrowLeft,
  GlassWater,
  Blend,
  CupSoda,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const CHOICE_PLACEHOLDER = "_____";
const OPERATOR_PLACEHOLDER = "[OP]";
const TYPE1_PLACEHOLDER = "[TYPE1]";
const TYPE2_PLACEHOLDER = "[TYPE2]";
const TYPE3_PLACEHOLDER = "[TYPE3]";

type CommandChoice = "+" | "-" | "*" | "/" | "%";
type TypeChoice = "Number" | "String" | "Boolean" | "Array" | "Object";
type TokenKey = "type1" | "type2" | "operator" | "type3";

const TOKEN_LINE_MAP: Record<TokenKey, number> = {
  type1: 0,
  type2: 1,
  operator: 2,
  type3: 2,
};

const EXPECTED_SOLUTION = [
  "let buah1; // tipe data: Number",
  "let buah2; // tipe data: Number",
  "let jus = buah1 + buah2; // tipe data: Number",
  "console.log(jus);",
].join("\n");

const INITIAL_TEMPLATE = [
  "let buah1; // tipe data: [TYPE1]",
  "let buah2; // tipe data: [TYPE2]",
  "let jus = buah1 [OP] buah2; // tipe data: [TYPE3]",
  "console.log(jus);",
].join("\n");

const OPERATOR_OPTIONS: Array<{
  type: CommandChoice;
  label: string;
  className: string;
}> = [
  {
    type: "+",
    label: "+",
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
  {
    type: "-",
    label: "-",
    className: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
  },
  {
    type: "*",
    label: "*",
    className: "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
  },
  {
    type: "/",
    label: "/",
    className: "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100",
  },
  {
    type: "%",
    label: "%",
    className:
      "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100",
  },
];

const DATA_TYPE_OPTIONS: Array<{
  type: TypeChoice;
  label: string;
  className: string;
}> = [
  {
    type: "Number",
    label: "Number",
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
  {
    type: "String",
    label: "String",
    className: "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
  },
  {
    type: "Boolean",
    label: "Boolean",
    className:
      "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100",
  },
  {
    type: "Array",
    label: "Array",
    className: "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100",
  },
  {
    type: "Object",
    label: "Object",
    className: "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100",
  },
];

type CommandDetail = {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
};

const COMMAND_DETAILS: Record<
  CommandChoice | TypeChoice | "DEFAULT",
  CommandDetail
> = {
  "+": {
    title: "(+)",
    desc: "Penjumlahan (menambah nilai) ",
    icon: <GlassWater className="text-emerald-600" size={20} />,
    color: "bg-emerald-50 border-emerald-100",
  },
  "-": {
    title: "(-)",
    desc: "Pengurangan (mengurangi nilai)",
    icon: <Blend className="text-red-600" size={20} />,
    color: "bg-red-50 border-red-100",
  },
  "*": {
    title: "(*)",
    desc: "Perkalian (mengalikan nilai)",
    icon: <CupSoda className="text-amber-600" size={20} />,
    color: "bg-amber-50 border-amber-100",
  },
  "/": {
    title: "(/)",
    desc: "Pembagian (membagi nilai)",
    icon: <Cpu className="text-sky-600" size={20} />,
    color: "bg-sky-50 border-sky-100",
  },
  "%": {
    title: "SISA BAGI (%)",
    desc: "Sisa bagi",
    icon: <Flag className="text-violet-600" size={20} />,
    color: "bg-violet-50 border-violet-100",
  },
  Number: {
    title: "NUMBER",
    desc: "Tipe data Number digunakan untuk menyimpan nilai angka.",
    icon: <Cpu className="text-emerald-600" size={20} />,
    color: "bg-emerald-50 border-emerald-100",
  },
  String: {
    title: "STRING",
    desc: "Tipe data String digunakan untuk menyimpan teks.",
    icon: <Edit3 className="text-amber-600" size={20} />,
    color: "bg-amber-50 border-amber-100",
  },
  Boolean: {
    title: "BOOLEAN",
    desc: "Tipe data Boolean hanya memiliki nilai true atau false.",
    icon: <Flag className="text-violet-600" size={20} />,
    color: "bg-violet-50 border-violet-100",
  },
  Array: {
    title: "ARRAY",
    desc: "Tipe data Array digunakan untuk daftar nilai.",
    icon: <GlassWater className="text-sky-600" size={20} />,
    color: "bg-sky-50 border-sky-100",
  },
  Object: {
    title: "OBJECT",
    desc: "Tipe data Object digunakan untuk pasangan key dan value.",
    icon: <Blend className="text-rose-600" size={20} />,
    color: "bg-rose-50 border-rose-100",
  },
  DEFAULT: {
    title: "SIAP MENULIS",
    desc: "Klik bagian kosong (___) lalu pilih tipe data atau operator yang sesuai.",
    icon: <Edit3 className="text-muted-foreground" size={20} />,
    color: "bg-slate-50 border-slate-200",
  },
};

const SIMULASI_SLUG = "mesin-jus-blender";
const FRUIT_OPTIONS = ["apel", "mangga", "jeruk"] as const;
const FRUIT_TYPES = {
  apel: { color: "#ef4444", name: "Apel", icon: "🍎" },
  mangga: { color: "#fbbf24", name: "Mangga", icon: "🥭" },
  jeruk: { color: "#f97316", name: "Jeruk", icon: "🍊" },
} as const;

const FOREIGN_OBJECTS = [
  { name: "Batu", icon: "🪨", color: "#6b7280" },
  { name: "Sendok", icon: "🥄", color: "#94a3b8" },
  { name: "Baut", icon: "🔩", color: "#64748b" },
] as const;

const toTitle = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

type SimData = {
  buah1: string;
  buah2: string;
  jus: string;
};

const BlenderSimulation = () => {
  const [selectedTokens, setSelectedTokens] = useState<
    Partial<Record<TokenKey, CommandChoice | TypeChoice>>
  >({});
  const [openSelectorToken, setOpenSelectorToken] = useState<TokenKey | null>(
    null,
  );
  const [activeToken, setActiveToken] = useState<TokenKey | null>(null);
  const [code, setCode] = useState<string>(INITIAL_TEMPLATE as string);
  const [activeLine, setActiveLine] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorLine, setErrorLine] = useState<number>(-1);
  const [showSuccessCard, setShowSuccessCard] = useState<boolean>(false);
  const [hasTried, setHasTried] = useState<boolean>(false);
  const [isSavingCompletion, setIsSavingCompletion] = useState<boolean>(false);

  const [buah1, setBuah1] = useState<string>("");
  const [buah2, setBuah2] = useState<string>("");
  const [jus, setJus] = useState<string>("");
  const [blenderActive, setBlenderActive] = useState<boolean>(false);
  const [jusKeluar, setJusKeluar] = useState<boolean>(false);
  const [liquidLevel, setLiquidLevel] = useState<number>(0);
  const [glassLevel, setGlassLevel] = useState<number>(0);
  const [mixedColor, setMixedColor] = useState<string>(
    "rgba(255,255,255,0.05)",
  );
  const [isPouring, setIsPouring] = useState<boolean>(false);
  const [blenderBroken, setBlenderBroken] = useState<boolean>(false);
  const [isLeaking, setIsLeaking] = useState<boolean>(false);
  const [isOverheating, setIsOverheating] = useState<boolean>(false);
  const [foreignObject, setForeignObject] = useState<
    (typeof FOREIGN_OBJECTS)[number] | null
  >(null);
  const [feedback, setFeedback] = useState<string>(
    "Sistem siap menjalankan algoritma.",
  );

  const simDataRef = useRef<SimData>({
    buah1: "",
    buah2: "",
    jus: "",
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const linesArray = code.split("\n");

  const getCodeFromSelection = (
    tokens: Partial<Record<TokenKey, CommandChoice | TypeChoice>>,
  ): string => {
    return INITIAL_TEMPLATE.replace(
      TYPE1_PLACEHOLDER,
      (tokens.type1 as TypeChoice | undefined) ?? CHOICE_PLACEHOLDER,
    )
      .replace(
        TYPE2_PLACEHOLDER,
        (tokens.type2 as TypeChoice | undefined) ?? CHOICE_PLACEHOLDER,
      )
      .replace(
        OPERATOR_PLACEHOLDER,
        (tokens.operator as CommandChoice | undefined) ?? CHOICE_PLACEHOLDER,
      )
      .replace(
        TYPE3_PLACEHOLDER,
        (tokens.type3 as TypeChoice | undefined) ?? CHOICE_PLACEHOLDER,
      );
  };

  useEffect(() => {
    const newCode = getCodeFromSelection(selectedTokens);
    setCode(newCode);
  }, [selectedTokens]);

  const updateSimData = (newData: Partial<SimData>) => {
    simDataRef.current = { ...simDataRef.current, ...newData };
  };

  const normalizeCode = (line: string): string => {
    return line.trim().toLowerCase().replace(/\s+/g, " ");
  };

  const generateEducationalFeedback = (userLine: string): string => {
    const trimmed = userLine.trim().toLowerCase();
    if (!trimmed || trimmed.includes("_")) {
      return "Masih ada bagian yang kosong. Lengkapi semua placeholder tipe data dan operator terlebih dahulu.";
    }

    if (
      !trimmed.includes("+") &&
      !trimmed.includes("-") &&
      !trimmed.includes("*") &&
      !trimmed.includes("/") &&
      !trimmed.includes("%")
    ) {
      return `Operator tidak ditemukan.\n\nBagian yang dipilih belum mengandung operator yang valid.\n\nPetunjuk: Gunakan salah satu operator: +, -, *, /, atau %`;
    }

    return "Ada yang kurang sesuai pada baris ini. Coba periksa kembali tipe data dan operator yang dipilih.";
  };

  const getActiveDescription = (): CommandDetail => {
    if (activeLine === -1 || !activeToken) return COMMAND_DETAILS.DEFAULT;
    const currentTokenChoice = selectedTokens[activeToken];
    if (!currentTokenChoice) return COMMAND_DETAILS.DEFAULT;
    return COMMAND_DETAILS[currentTokenChoice] || COMMAND_DETAILS.DEFAULT;
  };

  useEffect(() => {
    let isActive = true;

    const fetchCompletionStatus = async () => {
      try {
        const response = await fetch(
          `/api/siswa/simulasi/check-completed?simulasi_slug=${SIMULASI_SLUG}`,
          { cache: "no-store" },
        );

        if (!response.ok) return;

        const data = (await response.json()) as { completed?: boolean };
        if (isActive && data.completed) {
          setHasTried(true);
        }
      } catch (error) {
        console.error("Error checking simulation completion:", error);
      }
    };

    fetchCompletionStatus();

    return () => {
      isActive = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleSelectCommand = (
    token: TokenKey,
    value: CommandChoice | TypeChoice,
  ) => {
    if (isRunning) return;
    setSelectedTokens((prev) => ({ ...prev, [token]: value }));
    setActiveToken(token);
    setOpenSelectorToken(null);
    setActiveLine(TOKEN_LINE_MAP[token]);
  };

  const resetSim = () => {
    setSelectedTokens({});
    setOpenSelectorToken(null);
    setActiveToken(null);
    setIsRunning(false);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    setBuah1("");
    setBuah2("");
    setJus("");
    setBlenderActive(false);
    setJusKeluar(false);
    setLiquidLevel(0);
    setGlassLevel(0);
    setMixedColor("rgba(255,255,255,0.05)");
    setIsPouring(false);
    setBlenderBroken(false);
    setIsLeaking(false);
    setIsOverheating(false);
    setForeignObject(null);
    setFeedback("Sistem siap menjalankan algoritma.");
    setCode(getCodeFromSelection({}));
    updateSimData({ buah1: "", buah2: "", jus: "" });

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const markAsTried = async () => {
    if (hasTried || isSavingCompletion) return;

    try {
      setIsSavingCompletion(true);
      const response = await fetch("/api/siswa/simulasi/mark-completed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ simulasi_slug: SIMULASI_SLUG }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan progress simulasi");
      }

      setHasTried(true);
      toast.success("Simulasi ditandai selesai");
    } catch (error: unknown) {
      console.error("Error marking simulation as completed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan progress simulasi",
      );
    } finally {
      setIsSavingCompletion(false);
    }
  };

  const executeStep = async (): Promise<void> => {
    const validateToken = async (
      token: TokenKey,
      expected: CommandChoice | TypeChoice,
      line: number,
    ): Promise<boolean> => {
      setActiveLine(line);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const chosen = selectedTokens[token];

      if (!chosen) {
        setIsRunning(false);
        setErrorLine(line);
        setShowSuccessCard(false);
        setBlenderBroken(false);
        setIsLeaking(false);
        setIsOverheating(false);
        setForeignObject(null);
        setFeedback(
          `Baris ${line + 1} belum diisi.\n\nBagian ini masih kosong dan perlu dilengkapi.\n\nPetunjuk: Perhatikan tujuan dari baris tersebut, kemudian pilih jawaban yang sesuai.`,
        );
        return false;
      }

      if (chosen !== expected) {
        setIsRunning(false);
        setErrorLine(line);
        setShowSuccessCard(false);
        setBlenderBroken(false);
        setIsLeaking(false);
        setIsOverheating(false);
        setForeignObject(null);
        setFeedback(
          `Baris ${line + 1} belum tepat.\n\nBagian yang dipilih belum sesuai dengan fungsi pada baris ini.\n\nPetunjuk: Perhatikan tujuan dari baris tersebut, kemudian sesuaikan dengan jenis data atau proses yang dilakukan.`,
        );
        return false;
      }

      return true;
    };

    const stepType1 = await validateToken("type1", "Number", 0);
    if (!stepType1) return;

    const pickedFirstFruit =
      FRUIT_OPTIONS[Math.floor(Math.random() * FRUIT_OPTIONS.length)];
    setBuah1(pickedFirstFruit);
    setMixedColor(FRUIT_TYPES[pickedFirstFruit].color);
    setLiquidLevel(25);
    updateSimData({ buah1: pickedFirstFruit });
    setFeedback("Baris 1 benar. Buah pertama berhasil dimasukkan ke blender.");
    await new Promise((resolve) => setTimeout(resolve, 550));

    const stepType2 = await validateToken("type2", "Number", 1);
    if (!stepType2) return;

    const availableSecondFruits = FRUIT_OPTIONS.filter(
      (fruit) => fruit !== simDataRef.current.buah1,
    );
    const pickedSecondFruit =
      availableSecondFruits[
        Math.floor(Math.random() * availableSecondFruits.length)
      ] ?? FRUIT_OPTIONS[0];
    setBuah2(pickedSecondFruit);
    setLiquidLevel(50);
    updateSimData({ buah2: pickedSecondFruit });
    setFeedback("Baris 2 benar. Buah kedua masuk dan blender siap memproses.");
    await new Promise((resolve) => setTimeout(resolve, 550));

    const stepOperator = await validateToken("operator", "+", 2);
    if (!stepOperator) return;

    const selectedOperator =
      (selectedTokens.operator as CommandChoice | undefined) ?? "+";
    setBlenderActive(true);
    setFeedback(
      `Baris 3 benar. Operator ${selectedOperator} dipakai untuk memproses campuran.`,
    );
    await new Promise((resolve) => setTimeout(resolve, 800));

    const stepType3 = await validateToken("type3", "Number", 2);
    if (!stepType3) return;

    setActiveLine(3);
    await new Promise((resolve) => setTimeout(resolve, 450));

    const lineRaw = code;
    const lineParsed = normalizeCode(lineRaw);
    const solution = normalizeCode(EXPECTED_SOLUTION as string);

    if (lineParsed !== solution) {
      setIsRunning(false);
      setErrorLine(0);
      setShowSuccessCard(false);
      setBlenderBroken(false);
      setIsLeaking(false);
      setIsOverheating(false);
      setForeignObject(null);
      setFeedback(generateEducationalFeedback(lineRaw));
      return;
    }

    // Success: All lines are correct
    setBlenderBroken(false);
    setIsLeaking(false);
    setIsOverheating(false);
    setForeignObject(null);
    await new Promise((resolve) => setTimeout(resolve, 700));
    const dataBuah1 =
      FRUIT_TYPES[simDataRef.current.buah1 as keyof typeof FRUIT_TYPES];
    const dataBuah2 =
      FRUIT_TYPES[simDataRef.current.buah2 as keyof typeof FRUIT_TYPES];
    if (dataBuah1 && dataBuah2) {
      setMixedColor(
        `linear-gradient(to top, ${dataBuah1.color}, ${dataBuah2.color})`,
      );
    }
    setLiquidLevel(75);
    setBlenderActive(false);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const hasilJus = `${toTitle(simDataRef.current.buah1)} ${selectedOperator} ${toTitle(simDataRef.current.buah2)}`;
    setJus(hasilJus);
    updateSimData({ jus: hasilJus });
    setFeedback("Baris 4 dieksekusi. Output jus dituang ke gelas.");
    setIsPouring(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setLiquidLevel(10);
    setGlassLevel(85);
    setJusKeluar(true);
    setIsPouring(false);
    setShowSuccessCard(true);
    setFeedback(
      `Berhasil! Operator ${selectedOperator} sudah benar.\n\nbuah1 ${selectedOperator} buah2 = hasil yang sempurna!`,
    );
    setIsRunning(false);
  };

  const startRunning = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsRunning(true);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    setBuah1("");
    setBuah2("");
    setJus("");
    setBlenderActive(false);
    setJusKeluar(false);
    setLiquidLevel(0);
    setGlassLevel(0);
    setMixedColor("rgba(255,255,255,0.05)");
    setIsPouring(false);
    setBlenderBroken(false);
    setIsLeaking(false);
    setIsOverheating(false);
    setForeignObject(null);
    setFeedback("Sistem siap menjalankan algoritma.");
    updateSimData({ buah1: "", buah2: "", jus: "" });
    await executeStep();
  };

  const currentDesc = getActiveDescription();
  const buah1Data = buah1
    ? FRUIT_TYPES[buah1 as keyof typeof FRUIT_TYPES]
    : null;
  const buah2Data = buah2
    ? FRUIT_TYPES[buah2 as keyof typeof FRUIT_TYPES]
    : null;
  const totalDisplayLines = linesArray.length;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans overflow-hidden">
      <header className="z-40 flex shrink-0 items-center justify-between border-b border-emerald-100/80 bg-white/90 px-6 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              window.location.href = "/siswa/simulasi";
            }}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
          >
            <ArrowLeft size={14} /> Kembali
          </button>

          <div className="h-6 w-px bg-border" />

          <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-2 text-white shadow-lg shadow-emerald-200/60">
            <Terminal size={20} />
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black uppercase italic leading-none tracking-tighter">
              Blender Jus
            </h1>
            <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
              Menengah
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetSim}
            className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-5 py-2.5 text-xs font-bold transition-all duration-200 hover:bg-emerald-50"
          >
            <RotateCcw size={14} /> Reset
          </button>

          <button
            onClick={markAsTried}
            disabled={hasTried || isSavingCompletion || !showSuccessCard}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wide transition-all duration-200 disabled:opacity-50 ${
              hasTried
                ? "border-2 border-emerald-300 bg-emerald-100 text-emerald-800"
                : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <CheckCircle2 size={14} /> {hasTried ? "Selesai" : "Tandai Selesai"}
          </button>

          <button
            onClick={startRunning}
            disabled={isRunning}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-wide transition-all duration-200 disabled:opacity-50 ${
              isRunning
                ? "cursor-not-allowed border border-border bg-muted text-muted-foreground"
                : "bg-gradient-to-br from-emerald-600 to-green-600 text-white hover:from-green-600 hover:to-emerald-600"
            }`}
          >
            <Play size={14} fill={isRunning ? "none" : "white"} /> Jalankan
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-72 bg-white border-r border-emerald-100 p-5 flex flex-col gap-6 shrink-0 z-20 overflow-y-auto">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-emerald-600/70" />
            <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.12em] text-wrap">
              Deskripsi Perintah
            </h2>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentDesc.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`rounded-2xl border p-4 shadow-sm ${currentDesc.color}`}
            >
              <h3 className="mb-2 text-xs font-black uppercase tracking-tight text-foreground">
                {currentDesc.title}
              </h3>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {currentDesc.desc}
              </p>
            </motion.div>
          </AnimatePresence>

          <div
            className={`p-4 rounded-3xl border transition-all duration-300 ${
              errorLine !== -1
                ? "bg-rose-50/95 border-rose-200"
                : "bg-[#c8dde6] border-[#60d8bb]"
            }`}
          >
            <div
              className={`flex items-center gap-2 pb-2 border-b ${
                errorLine !== -1 ? "border-rose-200" : "border-[#60d8bb]"
              }`}
            >
              {errorLine !== -1 ? (
                <AlertTriangle size={13} className="text-rose-500" />
              ) : (
                <CheckCircle2
                  size={12}
                  className={jusKeluar ? "text-[#0b6e5d]" : "text-[#0b6e5d]"}
                />
              )}
              <span
                className={`text-[10px] font-black uppercase tracking-[0.12em] ${
                  errorLine !== -1 ? "text-rose-600" : "text-[#0b6e5d]"
                }`}
              >
                CATATAN PROSES
              </span>
            </div>

            <div
              className={`mt-3 whitespace-pre-line rounded-2xl px-3 py-2 text-[11px] leading-snug ${
                errorLine !== -1
                  ? "text-rose-700 bg-rose-100/60"
                  : "text-[#125f52] bg-[#d4e5e1]"
              }`}
            >
              {feedback}
            </div>
          </div>

          <div className="mt-auto p-4 bg-emerald-100/40 border border-emerald-200 rounded-3xl">
            <div className="flex items-center justify-between text-[10px] font-black text-emerald-700 uppercase mb-2 tracking-[0.08em]">
              <span>Status Fokus</span>
              <Activity size={10} />
            </div>
            <p className="text-[11px] font-bold text-slate-600 italic leading-tight">
              {activeLine !== -1
                ? `Menganalisis baris ke-${activeLine + 1}`
                : "Editor siap digunakan"}
            </p>
          </div>
        </aside>

        <div className="relative flex-1 flex flex-col min-w-0 bg-background">
          <section className="px-6 pt-4 pb-2">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
              <div className="bg-background p-2 rounded-xl shadow-sm text-primary">
                <Lightbulb size={20} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded uppercase tracking-widest">
                    MISI
                  </span>
                  <h2 className="text-[15px] font-black text-foreground uppercase tracking-tight">
                    Rancang Algoritma Blender Buah
                  </h2>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed max-w-4xl font-medium">
                  Ayo bantu blender membuat jus! 🥤 Lengkapi pseudocode agar
                  blender dapat membaca dua buah, memprosesnya, dan menghasilkan
                  jus.
                </p>
              </div>
            </div>
          </section>

          <AnimatePresence>
            {showSuccessCard && (
              <motion.section
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="absolute left-6 right-6 top-[84px] z-20 px-0 pb-0"
              >
                <div className="bg-card border border-emerald-200 rounded-2xl px-4 py-3 shadow-sm">
                  <h3 className="text-sm font-black text-emerald-700 tracking-tight">
                    🎉 Berhasil! Algoritma benar
                  </h3>
                  <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed font-medium">
                    Tipe data dan ekspresi sudah digunakan dengan tepat pada
                    setiap baris algoritma.
                    <br />
                    Blender berhasil membaca input buah, memproses campuran, dan
                    menghasilkan output jus dengan benar.
                  </p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="relative flex-1 flex gap-5 px-6 pb-6 overflow-hidden">
            <section className="flex-1 min-w-[500px] bg-card rounded-3xl border border-border shadow-sm flex flex-col overflow-hidden relative">
              <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isRunning
                        ? "bg-rose-500 animate-pulse"
                        : errorLine !== -1
                          ? "bg-red-500 shadow-[0_0_5px_red]"
                          : "bg-emerald-500"
                    }`}
                  />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic font-mono">
                    ALGORITMA BLENDER
                  </span>
                </div>
                <div
                  className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${
                    isRunning
                      ? "bg-rose-500 text-white"
                      : errorLine !== -1
                        ? "bg-red-500 text-white border-red-600 shadow-sm"
                        : "bg-background text-muted-foreground border-border"
                  }`}
                >
                  {isRunning
                    ? "RUNNING"
                    : errorLine !== -1
                      ? "ERROR"
                      : "SIAP MENYUSUN"}
                </div>
              </div>

              <div className="relative flex-1 flex font-mono text-[13px] leading-[26px] overflow-hidden">
                <div
                  id="line-gutter"
                  className="w-12 bg-muted/30 text-muted-foreground text-right pr-4 pt-5 select-none border-r border-border overflow-hidden shrink-0"
                >
                  {Array.from({ length: totalDisplayLines }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-[26px] transition-all ${
                        activeLine === i
                          ? "text-emerald-600 font-black scale-110 pr-1"
                          : ""
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                <div className="relative flex-1 bg-card overflow-hidden">
                  <div className="absolute inset-0 p-5 pt-5 whitespace-pre overflow-hidden z-10">
                    {linesArray.map((line, index) => {
                      const renderHighlight = activeLine === index;

                      if (index === 0) {
                        return (
                          <div
                            key={`line-${index}`}
                            className="relative h-[26px] flex items-center"
                          >
                            {renderHighlight && (
                              <motion.div
                                layoutId="lineHighlight"
                                className={`absolute inset-0 -mx-5 border-l-4 z-0 ${
                                  isRunning
                                    ? "bg-emerald-50 border-emerald-500"
                                    : errorLine === index
                                      ? "bg-red-50 border-red-500"
                                      : "bg-emerald-50/30 border-emerald-200"
                                }`}
                              />
                            )}
                            <div className="relative z-10 whitespace-pre font-bold">
                              <span className="text-violet-700">let</span>
                              <span className="text-slate-900"> </span>
                              <span className="text-blue-700">buah1</span>
                              <span className="text-slate-900">; </span>
                              <span className="text-slate-500">
                                // tipe data:{" "}
                              </span>
                              <button
                                type="button"
                                disabled={isRunning}
                                onClick={() => {
                                  setOpenSelectorToken("type1");
                                  setActiveToken("type1");
                                  setActiveLine(index);
                                }}
                                className={`rounded px-1.5 py-0.5 transition-all ${
                                  selectedTokens.type1
                                    ? "text-emerald-700 hover:bg-emerald-50"
                                    : "text-slate-300 tracking-widest hover:bg-slate-100"
                                } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                              >
                                {selectedTokens.type1 ?? CHOICE_PLACEHOLDER}
                              </button>
                            </div>
                          </div>
                        );
                      }

                      if (index === 1) {
                        return (
                          <div
                            key={`line-${index}`}
                            className="relative h-[26px] flex items-center"
                          >
                            {renderHighlight && (
                              <motion.div
                                layoutId="lineHighlight"
                                className={`absolute inset-0 -mx-5 border-l-4 z-0 ${
                                  isRunning
                                    ? "bg-emerald-50 border-emerald-500"
                                    : errorLine === index
                                      ? "bg-red-50 border-red-500"
                                      : "bg-emerald-50/30 border-emerald-200"
                                }`}
                              />
                            )}
                            <div className="relative z-10 whitespace-pre font-bold">
                              <span className="text-violet-700">let</span>
                              <span className="text-slate-900"> </span>
                              <span className="text-blue-700">buah2</span>
                              <span className="text-slate-900">; </span>
                              <span className="text-slate-500">
                                // tipe data:{" "}
                              </span>
                              <button
                                type="button"
                                disabled={isRunning}
                                onClick={() => {
                                  setOpenSelectorToken("type2");
                                  setActiveToken("type2");
                                  setActiveLine(index);
                                }}
                                className={`rounded px-1.5 py-0.5 transition-all ${
                                  selectedTokens.type2
                                    ? "text-emerald-700 hover:bg-emerald-50"
                                    : "text-slate-300 tracking-widest hover:bg-slate-100"
                                } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                              >
                                {selectedTokens.type2 ?? CHOICE_PLACEHOLDER}
                              </button>
                            </div>
                          </div>
                        );
                      }

                      if (index === 2) {
                        return (
                          <div
                            key={`line-${index}`}
                            className="relative h-[26px] flex items-center"
                          >
                            {renderHighlight && (
                              <motion.div
                                layoutId="lineHighlight"
                                className={`absolute inset-0 -mx-5 border-l-4 z-0 ${
                                  isRunning
                                    ? "bg-emerald-50 border-emerald-500"
                                    : errorLine === index
                                      ? "bg-red-50 border-red-500"
                                      : "bg-emerald-50/30 border-emerald-200"
                                }`}
                              />
                            )}
                            <div className="relative z-10 whitespace-pre font-bold">
                              <span className="text-violet-700">let</span>
                              <span className="text-slate-900"> </span>
                              <span className="text-blue-700">jus</span>
                              <span className="text-slate-900"> = </span>
                              <span className="text-blue-700">buah1</span>
                              <span className="text-slate-900"> </span>
                              <button
                                type="button"
                                disabled={isRunning}
                                onClick={() => {
                                  setOpenSelectorToken("operator");
                                  setActiveToken("operator");
                                  setActiveLine(index);
                                }}
                                className={`rounded px-1.5 py-0.5 transition-all ${
                                  selectedTokens.operator
                                    ? "text-emerald-700 hover:bg-emerald-50"
                                    : "text-slate-300 tracking-widest hover:bg-slate-100"
                                } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                              >
                                {selectedTokens.operator ?? CHOICE_PLACEHOLDER}
                              </button>
                              <span className="text-slate-900"> </span>
                              <span className="text-blue-700">buah2</span>
                              <span className="text-slate-900">; </span>
                              <span className="text-slate-500">
                                // tipe data:{" "}
                              </span>
                              <button
                                type="button"
                                disabled={isRunning}
                                onClick={() => {
                                  setOpenSelectorToken("type3");
                                  setActiveToken("type3");
                                  setActiveLine(index);
                                }}
                                className={`rounded px-1.5 py-0.5 transition-all ${
                                  selectedTokens.type3
                                    ? "text-emerald-700 hover:bg-emerald-50"
                                    : "text-slate-300 tracking-widest hover:bg-slate-100"
                                } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                              >
                                {selectedTokens.type3 ?? CHOICE_PLACEHOLDER}
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`line-${index}`}
                          className="relative h-[26px] flex items-center"
                        >
                          {renderHighlight && (
                            <motion.div
                              layoutId="lineHighlight"
                              className={`absolute inset-0 -mx-5 border-l-4 z-0 ${
                                isRunning
                                  ? "bg-emerald-50 border-emerald-500"
                                  : errorLine === index
                                    ? "bg-red-50 border-red-500"
                                    : "bg-emerald-50/30 border-emerald-200"
                              }`}
                            />
                          )}
                          <div className="relative z-10 whitespace-pre font-bold">
                            <span className="text-slate-900">console.log(</span>
                            <span className="text-blue-700">jus</span>
                            <span className="text-slate-900">);</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {openSelectorToken !== null && !isRunning && (
                    <div className="absolute left-5 right-5 bottom-4 z-30 bg-card border border-emerald-200 rounded-xl px-3 py-2 shadow-lg">
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">
                        {openSelectorToken === "operator"
                          ? "PILIH OPERATOR baris 3"
                          : "PILIH TIPE DATA baris"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {openSelectorToken === "operator"
                          ? OPERATOR_OPTIONS.map((option) => (
                              <button
                                key={option.type}
                                type="button"
                                onClick={() =>
                                  handleSelectCommand(
                                    openSelectorToken,
                                    option.type,
                                  )
                                }
                                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wide rounded-lg border transition-all ${option.className}`}
                              >
                                {option.label}
                              </button>
                            ))
                          : DATA_TYPE_OPTIONS.map((option) => (
                              <button
                                key={option.type}
                                type="button"
                                onClick={() =>
                                  handleSelectCommand(
                                    openSelectorToken,
                                    option.type,
                                  )
                                }
                                className={`px-3 py-1.5 text-[10px] font-black tracking-wide rounded-lg border transition-all ${option.className}`}
                              >
                                {option.label}
                              </button>
                            ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="w-[380px] bg-[#020617] rounded-3xl flex flex-col shrink-0 min-h-0 overflow-hidden shadow-2xl border border-slate-800 relative">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center px-6">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                    <Activity size={14} />
                  </div>
                  <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    VISUALISASI
                  </h2>
                </div>
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    errorLine !== -1
                      ? "bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]"
                      : blenderActive
                        ? "bg-emerald-500 animate-pulse shadow-[0_0_10px_#22c55e]"
                        : "bg-slate-700"
                  }`}
                />
              </div>

              <div className="flex-1 min-h-[230px] md:min-h-[260px] p-4 md:p-6 flex flex-col items-center justify-center relative bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)] overflow-hidden">
                <div className="absolute top-2 left-2 md:top-3 md:left-3 z-50 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-700 rounded-lg px-2 py-1">
                    <div
                      className="w-3 h-3 rounded-full border border-white/40"
                      style={{ backgroundColor: buah1Data?.color ?? "#64748b" }}
                    />
                    <span className="text-[9px] font-black text-slate-200 uppercase tracking-wide">
                      Buah1: {buah1Data?.name ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-700 rounded-lg px-2 py-1">
                    <div
                      className="w-3 h-3 rounded-sm rotate-45 border border-white/40"
                      style={{ backgroundColor: buah2Data?.color ?? "#64748b" }}
                    />
                    <span className="text-[9px] font-black text-slate-200 uppercase tracking-wide">
                      Buah2: {buah2Data?.name ?? "-"}
                    </span>
                  </div>
                </div>

                <motion.div
                  animate={
                    errorLine !== -1 ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }
                  }
                  transition={
                    errorLine !== -1
                      ? { duration: 0.35, repeat: Infinity, ease: "linear" }
                      : { duration: 0.2 }
                  }
                  className="relative flex flex-col items-center scale-90 md:scale-95"
                >
                  <div className="relative w-36 h-48 z-20">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-700 rounded-t-2xl z-30 shadow-lg border-b border-slate-600" />

                    <div className="absolute inset-0 bg-white/10 border-2 border-white/20 rounded-b-xl rounded-t-lg backdrop-blur-md overflow-hidden shadow-[inset_0_0_20px_rgba(255,255,255,0.1)] flex flex-col justify-end">
                      <motion.div
                        animate={{
                          height: `${liquidLevel}%`,
                          background: mixedColor,
                        }}
                        transition={{ duration: 1.1, ease: "easeInOut" }}
                        className="w-full relative origin-bottom"
                      >
                        {blenderActive && (
                          <motion.div
                            animate={{
                              rotate: [0, 360],
                              scale: [1, 1.1, 1],
                              y: [0, -5, 0],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.25,
                              ease: "linear",
                            }}
                            className="absolute inset-0 flex items-center justify-center opacity-50"
                          >
                            <Blend
                              size={56}
                              className="text-white drop-shadow-lg"
                            />
                          </motion.div>
                        )}

                        {blenderActive &&
                          [...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{ y: -60, opacity: 0, scale: 0.5 }}
                              transition={{
                                repeat: Infinity,
                                duration: Math.random() + 0.5,
                                delay: i * 0.2,
                              }}
                              className="absolute bottom-0 w-2 h-2 bg-white/40 rounded-full"
                              style={{ left: `${20 + i * 15}%` }}
                            />
                          ))}

                        {isOverheating &&
                          [...Array(8)].map((_, i) => (
                            <motion.div
                              key={`spark-${i}`}
                              animate={{
                                x: (Math.random() - 0.5) * 80,
                                y: -100 + Math.random() * 40,
                                opacity: 0,
                                scale: 0,
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.8 + Math.random() * 0.4,
                                delay: i * 0.1,
                              }}
                              className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                              style={{
                                backgroundColor:
                                  Math.random() > 0.5 ? "#fbbf24" : "#f97316",
                                boxShadow:
                                  Math.random() > 0.5
                                    ? "0 0 6px #fbbf24"
                                    : "0 0 6px #f97316",
                              }}
                            />
                          ))}
                      </motion.div>

                      <AnimatePresence>
                        {!!buah1 && liquidLevel < 30 && (
                          <motion.div
                            key="buah1-drop"
                            initial={{ y: -250, opacity: 0, rotate: -20 }}
                            animate={{ y: 90, opacity: 1, rotate: 0 }}
                            className="absolute left-10 w-12 h-12 flex items-center justify-center text-4xl filter drop-shadow-md"
                          >
                            {
                              FRUIT_TYPES[buah1 as keyof typeof FRUIT_TYPES]
                                ?.icon
                            }
                          </motion.div>
                        )}
                        {!!buah2 && liquidLevel < 60 && (
                          <motion.div
                            key="buah2-drop"
                            initial={{ y: -250, opacity: 0, rotate: 20 }}
                            animate={{ y: 70, opacity: 1, rotate: 0 }}
                            className="absolute right-10 w-12 h-12 flex items-center justify-center text-4xl filter drop-shadow-md"
                          >
                            {
                              FRUIT_TYPES[buah2 as keyof typeof FRUIT_TYPES]
                                ?.icon
                            }
                          </motion.div>
                        )}

                        {blenderBroken && foreignObject && (
                          <motion.div
                            key={`foreign-${foreignObject.name}-${errorLine}`}
                            initial={{ y: -260, opacity: 0, rotate: -18 }}
                            animate={{ y: 78, opacity: 1, rotate: 6 }}
                            exit={{ opacity: 0 }}
                            className="absolute left-1/2 -translate-x-1/2 w-12 h-12 flex items-center justify-center text-4xl filter drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                            style={{ color: foreignObject.color }}
                          >
                            {foreignObject.icon}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {blenderBroken && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 pointer-events-none"
                        >
                          <div className="absolute top-6 left-9 w-[2px] h-20 bg-rose-300/80 rotate-[16deg]" />
                          <div className="absolute top-12 left-12 w-[2px] h-14 bg-rose-300/70 -rotate-[10deg]" />
                          <div className="absolute top-8 right-10 w-[2px] h-16 bg-rose-300/80 rotate-[20deg]" />
                        </motion.div>
                      )}

                      <AnimatePresence>
                        {blenderBroken && isLeaking && (
                          <>
                            <motion.div
                              key="crack-leak-stream"
                              initial={{ height: 0, opacity: 0, scaleX: 0.7 }}
                              animate={{
                                height: 78,
                                opacity: [0.35, 0.9, 0.45],
                                scaleX: [0.8, 1.15, 0.9],
                              }}
                              exit={{ height: 0, opacity: 0, scaleX: 0.7 }}
                              transition={{
                                height: { duration: 0.45, ease: "easeOut" },
                                opacity: {
                                  repeat: Infinity,
                                  duration: 1.05,
                                  ease: "easeInOut",
                                },
                                scaleX: {
                                  repeat: Infinity,
                                  duration: 0.9,
                                  ease: "easeInOut",
                                },
                              }}
                              className="absolute top-[62px] right-[30px] w-[5px] rounded-full blur-[0.4px]"
                              style={{
                                background:
                                  "linear-gradient(to bottom, rgba(186,230,253,0.95), rgba(56,189,248,0.92), rgba(2,132,199,0.9))",
                              }}
                            />

                            {[0, 0.28, 0.56].map((delay, idx) => (
                              <motion.div
                                key={`crack-leak-drip-${idx}`}
                                initial={{ y: 0, opacity: 0, scale: 0.7 }}
                                animate={{
                                  y: [0, 10, 22, 34],
                                  opacity: [0, 0.95, 0.95, 0],
                                  scale: [0.65, 0.9, 1, 0.85],
                                }}
                                exit={{ opacity: 0 }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 1,
                                  delay,
                                  ease: "easeIn",
                                }}
                                className="absolute top-[136px] right-[27px] w-2.5 h-2.5 rounded-full bg-sky-300"
                              />
                            ))}
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="absolute top-12 -right-8 w-10 h-28 border-8 border-slate-700 rounded-r-3xl z-10 shadow-lg" />
                  </div>

                  <div className="w-44 h-20 bg-gradient-to-b from-slate-700 to-slate-900 rounded-t-xl rounded-b-[2rem] border-t-4 border-slate-600 shadow-2xl relative z-40 flex flex-col items-center justify-center gap-2">
                    <div className="flex gap-4">
                      <div
                        className={`w-3 h-3 rounded-full border border-slate-800 ${isRunning ? "bg-emerald-500 shadow-[0_0_8px_emerald]" : "bg-slate-800"}`}
                      />
                      <div
                        className={`w-3 h-3 rounded-full border border-slate-800 ${blenderActive ? "bg-amber-500 shadow-[0_0_8px_amber]" : "bg-slate-800"}`}
                      />
                      <div
                        className={`w-3 h-3 rounded-full border border-slate-800 ${errorLine !== -1 ? "bg-rose-500 shadow-[0_0_8px_rose]" : "bg-slate-800"}`}
                      />
                    </div>
                    <div className="w-24 h-6 bg-slate-950/50 rounded-full border border-slate-800 shadow-inner flex items-center px-1">
                      <motion.div
                        animate={{ x: blenderActive ? 65 : 0 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className="w-6 h-4 bg-slate-600 rounded-full border border-slate-500 shadow-md"
                      />
                    </div>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {errorLine !== -1 && (
                    <>
                      <motion.div
                        key="hardware-error-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-rose-500/10 border-y border-rose-400/30 pointer-events-none"
                      />
                      <motion.div
                        key="hardware-error-badge"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-3 right-3 bg-rose-500/90 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-rose-300 z-50"
                      >
                        <AlertTriangle size={11} /> Error Logic
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isPouring && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 120, opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="absolute top-[55%] right-[22%] w-3 z-30 rounded-full"
                      style={{ background: mixedColor }}
                    />
                  )}
                </AnimatePresence>

                <div className="absolute bottom-4 right-6 md:bottom-8 md:right-12 w-24 h-28 md:w-28 md:h-32 border-x-4 border-b-4 border-white/20 rounded-b-[2rem] rounded-t-md bg-white/5 overflow-hidden z-40 shadow-xl backdrop-blur-sm">
                  <motion.div
                    animate={{ height: `${glassLevel}%` }}
                    transition={{ duration: 1.4, ease: "easeOut" }}
                    className="absolute bottom-0 left-0 right-0 origin-bottom"
                    style={{ background: mixedColor }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <CupSoda size={48} className="text-white" />
                  </div>
                  <div className="absolute top-0 left-2 w-2 h-full bg-white/10 skew-x-12" />
                </div>

                <div className="absolute bottom-0 w-full h-10 bg-slate-900 border-t-4 border-slate-800 shadow-2xl" />

                <AnimatePresence>
                  {blenderBroken && isLeaking && (
                    <motion.div
                      key="leak-puddle"
                      initial={{ width: 0, opacity: 0, scaleY: 0.6 }}
                      animate={{
                        width: [96, 122, 112],
                        opacity: [0.45, 0.9, 0.7],
                        scaleY: [0.75, 1, 0.88],
                      }}
                      exit={{ width: 0, opacity: 0, scaleY: 0.6 }}
                      transition={{
                        width: { duration: 0.45, ease: "easeOut" },
                        opacity: {
                          repeat: Infinity,
                          duration: 1.1,
                          ease: "easeInOut",
                        },
                        scaleY: {
                          repeat: Infinity,
                          duration: 1,
                          ease: "easeInOut",
                        },
                      }}
                      className="absolute bottom-6 right-20 h-3 rounded-full blur-[0.6px] bg-sky-400/70 z-20"
                    />
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {blenderActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute bg-emerald-600 text-white px-5 py-2.5 rounded-full text-[10px] font-black flex items-center gap-3 shadow-2xl border border-emerald-400 uppercase tracking-widest z-50"
                    >
                      <Cpu size={16} className="animate-spin" /> Blender Aktif
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BlenderSimulation;
