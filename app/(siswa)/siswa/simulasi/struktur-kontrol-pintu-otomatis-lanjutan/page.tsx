"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Play,
  RotateCcw,
  Terminal,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

const SIMULASI_SLUG = "struktur-kontrol-pintu-otomatis-lanjutan";

type LoopChoice = "for" | "while" | "do-while";
type DataTypeChoice = "int" | "float" | "char" | "boolean" | "string";
type BranchChoice = "if" | "switch" | "else" | "if-else";
type ComparatorChoice = "<" | ">" | "==" | "<=";
type CommandChoice =
  | LoopChoice
  | DataTypeChoice
  | BranchChoice
  | ComparatorChoice;
type SelectorTarget =
  | "for"
  | "datatype-sensor"
  | "datatype-total"
  | "datatype"
  | "if"
  | "comparator"
  | "else"
  | null;

type SensorState = "none" | "aktif" | "mati";

const SENSOR_JARAK = [150, 30, 25, 200] as const;
const THRESHOLD_JARAK = 50;

const LOOP_OPTIONS: LoopChoice[] = ["for", "while", "do-while"];
const DATATYPE_OPTIONS: DataTypeChoice[] = [
  "int",
  "float",
  "char",
  "boolean",
  "string",
];
const BRANCH_OPTIONS: BranchChoice[] = ["if", "switch", "else"];
const COMPARATOR_OPTIONS: ComparatorChoice[] = ["<", ">", "==", "<="];
const ELSE_OPTIONS: BranchChoice[] = ["else", "switch", "if"];

const DESCRIPTION_BY_CHOICE: Record<CommandChoice, string> = {
  for: "untuk perulangan dengan jumlah iterasi yang sudah jelas, seperti membaca empat data sensor jarak.",
  while:
    "untuk perulangan selama kondisi bernilai benar, biasanya saat jumlah langkah belum pasti.",
  "do-while":
    "untuk perulangan yang menjalankan blok minimal satu kali sebelum cek kondisi.",
  int: "tipe data bilangan bulat untuk indeks perulangan seperti variabel i.",
  float: "tipe data bilangan pecahan.",
  char: "tipe data untuk satu karakter.",
  boolean: "tipe data true atau false.",
  string: "tipe data teks atau kumpulan karakter.",
  if: "untuk percabangan saat kondisi bernilai benar, misalnya saat sensor mendeteksi orang dekat pintu.",
  "if-else":
    "kombinasi percabangan untuk kondisi benar dan jalur alternatif dalam satu struktur.",
  switch:
    "untuk banyak pilihan kasus berdasarkan nilai tertentu, bukan untuk kondisi sederhana.",
  else: "untuk jalur alternatif saat kondisi if tidak terpenuhi.",
  "<": "untuk membandingkan nilai yang lebih kecil, misalnya sensor jarak di bawah batas tertentu.",
  ">": "untuk membandingkan nilai yang lebih besar.",
  "==": "untuk membandingkan kesamaan dua nilai.",
  "<=": "untuk membandingkan nilai yang lebih kecil atau sama dengan batas.",
};

type OperatorDocKey = "+" | "-" | "*" | "/" | "<" | ">" | ">=" | "<=" | "==";

type DatatypeDocKey = "int" | "float" | "char" | "boolean" | "string";

const DATATYPE_DETAILS: Record<
  DatatypeDocKey,
  { title: string; desc: string; color: string }
> = {
  int: {
    title: "INT",
    desc: "Tipe data bilangan bulat",
    color: "bg-emerald-50 border-emerald-200",
  },
  float: {
    title: "FLOAT",
    desc: "Tipe data bilangan desimal",
    color: "bg-sky-50 border-sky-200",
  },
  char: {
    title: "CHAR",
    desc: "Tipe data untuk satu karakter",
    color: "bg-lime-50 border-lime-200",
  },
  boolean: {
    title: "BOOLEAN",
    desc: "Tipe data true atau false",
    color: "bg-violet-50 border-violet-200",
  },
  string: {
    title: "STRING",
    desc: "Tipe data teks/kumpulan karakter",
    color: "bg-rose-50 border-rose-200",
  },
};

const OPERATOR_DETAILS: Record<
  OperatorDocKey,
  { title: string; desc: string; color: string }
> = {
  "+": {
    title: "PLUS (+)",
    desc: "Operator penjumlahan",
    color: "bg-sky-50 border-sky-200",
  },
  "-": {
    title: "MINUS (-)",
    desc: "Operator pengurangan",
    color: "bg-lime-50 border-lime-200",
  },
  "*": {
    title: "KALI (*)",
    desc: "Operator perkalian",
    color: "bg-violet-50 border-violet-200",
  },
  "/": {
    title: "BAGI (/)",
    desc: "Operator pembagian",
    color: "bg-emerald-50 border-emerald-200",
  },
  "<": {
    title: "PEMBANDING (<)",
    desc: "Mengecek nilai lebih kecil dari",
    color: "bg-emerald-50 border-emerald-200",
  },
  ">": {
    title: "PEMBANDING (>)",
    desc: "Mengecek nilai lebih besar dari",
    color: "bg-lime-50 border-lime-200",
  },
  ">=": {
    title: "PEMBANDING (>=)",
    desc: "Mengecek nilai lebih besar atau sama dengan",
    color: "bg-lime-50 border-lime-200",
  },
  "<=": {
    title: "PEMBANDING (<=)",
    desc: "Mengecek nilai lebih kecil atau sama dengan",
    color: "bg-emerald-50 border-emerald-200",
  },
  "==": {
    title: "PEMBANDING (==)",
    desc: "Mengecek apakah dua nilai sama",
    color: "bg-rose-50 border-rose-200",
  },
};

const OPTION_BUTTON_THEMES = [
  "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100",
  "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100",
  "border-lime-300 bg-lime-50 text-lime-700 hover:bg-lime-100",
  "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100",
  "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
] as const;

export default function StrukturKontrolPintuOtomatisLanjutanPage() {
  const [selectedSensorDataType, setSelectedSensorDataType] =
    useState<DataTypeChoice | null>(null);
  const [selectedTotalDataType, setSelectedTotalDataType] =
    useState<DataTypeChoice | null>(null);
  const [selectedFor, setSelectedFor] = useState<CommandChoice | null>(null);
  const [selectedDataType, setSelectedDataType] =
    useState<DataTypeChoice | null>(null);
  const [selectedIf, setSelectedIf] = useState<CommandChoice | null>(null);
  const [selectedComparator, setSelectedComparator] =
    useState<ComparatorChoice | null>(null);
  const [selectedElse, setSelectedElse] = useState<CommandChoice | null>(null);
  const [selectorTarget, setSelectorTarget] = useState<SelectorTarget>(null);
  const [descriptionTarget, setDescriptionTarget] =
    useState<SelectorTarget>(null);
  const [selectorOptions, setSelectorOptions] = useState<CommandChoice[]>([]);

  const [activeLine, setActiveLine] = useState(-1);
  const [errorLine, setErrorLine] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [feedback, setFeedback] = useState("Sistem siap menjalankan simulasi.");
  const [hasTried, setHasTried] = useState(false);
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);

  const [sensorValue, setSensorValue] = useState<SensorState>("none");
  const [sensorError, setSensorError] = useState(false);
  const [totalError, setTotalError] = useState(false);
  const [forError, setForError] = useState(false);
  const [ifError, setIfError] = useState(false);
  const [elseError, setElseError] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [personVisible, setPersonVisible] = useState(false);
  const [totalAksi, setTotalAksi] = useState(0);
  const [visualError, setVisualError] = useState(false);
  const [crossingPulse, setCrossingPulse] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const codeLines = [
    "int main() {",
    "    int sensorJarak[] = {150, 30, 25, 200};",
    "    int totalAksi = 0;",
    null,
    null,
    '            printf("Sensor %d: Orang Dekat -> PINTU BUKA \\n", i+1);',
    "            totalAksi++;",
    "        }",
    null,
    '            printf("Sensor %d: Area Kosong -> PINTU TUTUP \\n", i+1);',
    "        }",
    "    }",
    '    printf("Total aktivitas sensor hari ini: %d kali. Hijau Emerald\\n", totalAksi);',
    "    return 0;",
    "}",
  ] as const;

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
        if (isActive && data.completed) setHasTried(true);
      } catch (error) {
        console.error("Error checking simulation completion:", error);
      }
    };

    fetchCompletionStatus();

    return () => {
      isActive = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const markAsTried = async () => {
    if (hasTried || isSavingCompletion) return;
    try {
      setIsSavingCompletion(true);
      const response = await fetch("/api/siswa/simulasi/mark-completed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulasi_slug: SIMULASI_SLUG }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan progress simulasi");
      }
      setHasTried(true);
      toast.success("Simulasi ditandai selesai");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan progress simulasi",
      );
    } finally {
      setIsSavingCompletion(false);
    }
  };

  const buildMixedOptions = (target: SelectorTarget): CommandChoice[] => {
    if (target === "for") {
      return ["for", "while", "do-while", "if", "if-else"].sort(
        () => Math.random() - 0.5,
      ) as CommandChoice[];
    }

    if (
      target === "datatype" ||
      target === "datatype-sensor" ||
      target === "datatype-total"
    ) {
      return [...DATATYPE_OPTIONS].sort(
        () => Math.random() - 0.5,
      ) as CommandChoice[];
    }

    let pool: CommandChoice[] = [];

    if (target === "if") {
      return ["if", "if-else", "switch", "else", "while"].sort(
        () => Math.random() - 0.5,
      ) as CommandChoice[];
    }

    if (target === "comparator") {
      pool = [">", "==", "<="];
      return ["<", ...pool].sort(() => Math.random() - 0.5) as CommandChoice[];
    }

    return ["else", "if-else", "switch", "if", "while"].sort(
      () => Math.random() - 0.5,
    ) as CommandChoice[];
  };

  const resetVisualState = () => {
    setSensorValue("none");
    setSensorError(false);
    setTotalError(false);
    setForError(false);
    setIfError(false);
    setElseError(false);
    setDoorOpen(false);
    setPersonVisible(false);
    setTotalAksi(0);
    setVisualError(false);
    setCrossingPulse(false);
  };

  const resetSim = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(false);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    setSelectorTarget(null);
    setDescriptionTarget(null);
    setSelectedSensorDataType(null);
    setSelectedTotalDataType(null);
    setSelectedFor(null);
    setSelectedDataType(null);
    setSelectedIf(null);
    setSelectedComparator(null);
    setSelectedElse(null);
    resetVisualState();
    setFeedback("Sistem siap menjalankan simulasi.");
  };

  const openSelector = (target: SelectorTarget, line: number) => {
    if (isRunning) return;
    setSelectorTarget(target);
    setDescriptionTarget(target);
    setSelectorOptions(buildMixedOptions(target));
    setErrorLine(-1);
    setActiveLine(line);
    setShowSuccessCard(false);
    setFeedback(
      target === "for"
        ? "Pilih token untuk perulangan sensor jarak."
        : target === "datatype-sensor"
          ? "Pilih tipe data untuk deklarasi sensorJarak."
          : target === "datatype-total"
            ? "Pilih tipe data untuk deklarasi totalAksi."
            : target === "datatype"
              ? "Pilih tipe data variabel indeks pada perulangan."
              : target === "if"
                ? "Pilih token untuk percabangan kondisi sensor."
                : target === "comparator"
                  ? "Pilih operator perbandingan untuk batas jarak sensor."
                  : "Pilih token untuk cabang alternatif ketika sensor tidak aktif.",
    );
  };

  const runSensorCycle = (index: number) => {
    if (index >= SENSOR_JARAK.length) {
      setIsRunning(false);
      setActiveLine(14);
      setShowSuccessCard(true);
      setFeedback(
        "Berhasil! Semua langkah struktur kontrol sudah sesuai.\n\nSensor berhasil membaca jarak dan pintu merespons dengan tepat sesuai kondisi.",
      );
      return;
    }

    const currentDistance = SENSOR_JARAK[index];
    const isNear = currentDistance < THRESHOLD_JARAK;

    setActiveLine(3);
    setSensorValue(isNear ? "aktif" : "mati");
    setPersonVisible(isNear);
    setDoorOpen(isNear);
    setVisualError(false);
    setCrossingPulse(false);
    setFeedback(
      `Iterasi i=${index + 1}. Sensor membaca jarak ${currentDistance} cm.`,
    );

    timerRef.current = setTimeout(() => {
      setActiveLine(4);
      setFeedback(
        `Mengecek kondisi if: apakah ${currentDistance} cm ${isNear ? "lebih kecil" : "bukan lebih kecil"} dari ${THRESHOLD_JARAK} cm?`,
      );

      timerRef.current = setTimeout(() => {
        setActiveLine(4);

        if (isNear) {
          setDoorOpen(true);
          setPersonVisible(true);
          setVisualError(false);
          setFeedback(
            `Jarak ${currentDistance} cm -> sensor aktif, pintu terbuka.`,
          );

          timerRef.current = setTimeout(() => {
            setActiveLine(7);
            setTotalAksi((prev) => prev + 1);
            setFeedback("Cabang benar berjalan, total aksi bertambah.");

            timerRef.current = setTimeout(() => {
              runSensorCycle(index + 1);
            }, 550);
          }, 500);
          return;
        }

        setActiveLine(8);
        setDoorOpen(false);
        setPersonVisible(false);
        setFeedback(
          `Jarak ${currentDistance} cm -> area kosong, pintu tetap tertutup.`,
        );

        timerRef.current = setTimeout(() => {
          setActiveLine(9);
          setTotalAksi((prev) => prev + 0);
          setFeedback("Cabang else berjalan, pintu tetap aman.");

          timerRef.current = setTimeout(() => {
            runSensorCycle(index + 1);
          }, 550);
        }, 500);
      }, 420);
    }, 420);
  };

  const executeStep = () => {
    const validationLines = Array.from(
      { length: codeLines.length },
      (_, i) => i,
    );

    const syncPrecheckVisual = (line: number) => {
      setVisualError(false);

      if (line === 0) {
        setSensorError(false);
        setTotalError(false);
        setForError(false);
        setIfError(false);
        setElseError(false);
        setSensorValue("none");
        setDoorOpen(false);
        setPersonVisible(false);
        setTotalAksi(0);
        setCrossingPulse(false);
        return;
      }

      if (line === 1) {
        if (!selectedSensorDataType) {
          failAtLine(
            1,
            "Baris 2 belum lengkap.\n\nLengkapi tipe data untuk deklarasi sensorJarak.\n\nPetunjuk: array jarak berisi angka bulat.",
          );
          return;
        }
        if (selectedSensorDataType !== "int") {
          failAtLine(
            1,
            "Baris 2 belum tepat.\n\nTipe data deklarasi sensorJarak belum sesuai konteks.\n\nPetunjuk: gunakan int untuk data angka bulat pada array ini.",
          );
          return;
        }
        setSensorError(false);
        setTotalError(false);
        setSensorValue("mati");
        setDoorOpen(false);
        setPersonVisible(false);
        setCrossingPulse(false);
        return;
      }

      if (line === 2) {
        setSensorError(false);
        setTotalError(false);
        if (!selectedTotalDataType) {
          failAtLine(
            2,
            "Baris 3 belum lengkap.\n\nLengkapi tipe data untuk deklarasi totalAksi.\n\nPetunjuk: nilai awal totalAksi adalah angka bulat 0.",
          );
          return;
        }
        if (selectedTotalDataType !== "int") {
          failAtLine(
            2,
            "Baris 3 belum tepat.\n\nTipe data deklarasi totalAksi belum sesuai konteks.\n\nPetunjuk: gunakan int untuk penghitung total aksi.",
          );
          return;
        }
        setSensorError(false);
        setTotalError(false);
        setTotalAksi(0);
        setCrossingPulse(false);
        return;
      }

      if (line === 3) {
        setSensorValue("aktif");
        setPersonVisible(true);
        setDoorOpen(false);
        setCrossingPulse(true);
        return;
      }

      if (line === 4) {
        setSensorError(false);
        setTotalError(false);
        setForError(false);
        setIfError(false);
        setSensorValue("aktif");
        setPersonVisible(true);
        setDoorOpen(false);
        setCrossingPulse(true);
        return;
      }

      if (line === 5) {
        setDoorOpen(true);
        setCrossingPulse(false);
        return;
      }

      if (line === 6) {
        setTotalAksi(1);
        setCrossingPulse(false);
        return;
      }

      if (line === 8) {
        setSensorValue("mati");
        setPersonVisible(false);
        setDoorOpen(false);
        setCrossingPulse(true);
        return;
      }

      if (line === 9) {
        setCrossingPulse(false);
        return;
      }

      if (line === 12) {
        setTotalAksi(2);
        setCrossingPulse(false);
        return;
      }

      if (line === 14) {
        setCrossingPulse(false);
      }
    };

    const failAtLine = (line: number, message: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsRunning(false);
      setErrorLine(line);
      setVisualError(true);
      if (line === 1) {
        setSensorError(true);
      } else if (line === 2) {
        setTotalError(true);
      } else if (line === 3) {
        setForError(true);
      } else if (line === 4) {
        setIfError(true);
      } else if (line === 8) {
        setElseError(true);
      }
      setFeedback(message);
    };

    const scanLine = (cursor: number) => {
      if (cursor >= validationLines.length) {
        setErrorLine(-1);
        setVisualError(false);
        setFeedback(
          "Semua token benar. Sistem mulai membaca sensor jarak satu per satu dan mengatur pintu otomatis sesuai hasil pengukuran.",
        );
        timerRef.current = setTimeout(() => runSensorCycle(0), 380);
        return;
      }

      const line = validationLines[cursor];
      setActiveLine(line);
      syncPrecheckVisual(line);

      if (line === 0) {
        setFeedback(
          "Memeriksa pembuka program (int main).\n\nAlur validasi dimulai dari baris paling atas.",
        );
      } else if (line === 1) {
        setFeedback("Memeriksa deklarasi array sensorJarak.");
      } else if (line === 2) {
        setFeedback("Memeriksa inisialisasi totalAksi.");
      } else if (line === 5) {
        setFeedback("Memeriksa perintah output untuk kondisi Orang Dekat.");
      } else if (line === 6) {
        setFeedback(
          "Memeriksa update totalAksi (increment).\n\nJika valid, sistem lanjut ke baris berikutnya.",
        );
      } else if (line === 9) {
        setFeedback("Memeriksa perintah output untuk kondisi Area Kosong.");
      } else if (line === 10) {
        setFeedback("Memeriksa penutup blok else.");
      } else if (line === 11) {
        setFeedback("Memeriksa penutup blok perulangan for.");
      } else if (line === 12) {
        setFeedback("Memeriksa ringkasan total aktivitas sensor.");
      } else if (line === 13) {
        setFeedback("Memeriksa return 0 sebagai penutup eksekusi.");
      } else if (line === 14) {
        setFeedback("Memeriksa penutup akhir program.");
      }

      if (line === 1) {
        if (!selectedSensorDataType) {
          failAtLine(
            1,
            "Baris 2 belum lengkap.\n\nLengkapi tipe data untuk deklarasi sensorJarak.\n\nPetunjuk: array jarak berisi angka bulat.",
          );
          return;
        }
        if (selectedSensorDataType !== "int") {
          failAtLine(
            1,
            "Baris 2 belum tepat.\n\nTipe data deklarasi sensorJarak belum sesuai konteks.\n\nPetunjuk: gunakan int untuk data angka bulat pada array ini.",
          );
          return;
        }
      }

      if (line === 2) {
        if (!selectedTotalDataType) {
          failAtLine(
            2,
            "Baris 3 belum lengkap.\n\nLengkapi tipe data untuk deklarasi totalAksi.\n\nPetunjuk: nilai awal totalAksi adalah angka bulat 0.",
          );
          return;
        }
        if (selectedTotalDataType !== "int") {
          failAtLine(
            2,
            "Baris 3 belum tepat.\n\nTipe data deklarasi totalAksi belum sesuai konteks.\n\nPetunjuk: gunakan int untuk penghitung total aksi.",
          );
          return;
        }
      }

      if (line === 3) {
        if (!selectedFor) {
          failAtLine(
            3,
            "Baris 4 belum lengkap.\n\nLengkapi terlebih dahulu token pada baris ini sebelum melanjutkan simulasi.\n\nPetunjuk: baca tujuan perulangan, lalu pilih token yang paling sesuai.",
          );
          return;
        }
        if (selectedFor !== "for") {
          failAtLine(
            3,
            "Baris 4 belum tepat.\n\nToken pada baris ini belum sesuai konteks proses.\n\nPetunjuk: baris ini harus mengulang pembacaan empat sensor secara berurutan.",
          );
          return;
        }

        if (!selectedDataType) {
          failAtLine(
            3,
            "Baris 4 belum lengkap.\n\nLengkapi tipe data variabel indeks pada baris ini sebelum melanjutkan simulasi.\n\nPetunjuk: variabel i pada for menggunakan tipe data bilangan bulat.",
          );
          return;
        }

        if (selectedDataType !== "int") {
          failAtLine(
            3,
            "Baris 4 belum tepat.\n\nTipe data pada baris ini belum sesuai konteks perulangan.\n\nPetunjuk: variabel i pada for menggunakan tipe data int.",
          );
          return;
        }
      }

      if (line === 4) {
        if (!selectedIf) {
          failAtLine(
            4,
            "Baris 5 belum lengkap.\n\nLengkapi token kondisi sebelum simulasi dilanjutkan.\n\nPetunjuk: pilih struktur percabangan yang tepat untuk memeriksa sensor jarak.",
          );
          return;
        }
        if (selectedIf !== "if") {
          failAtLine(
            4,
            "Baris 5 belum tepat.\n\nToken pada baris ini belum sesuai konteks proses.\n\nPetunjuk: cabang ini harus dimulai dengan pengecekan kondisi.",
          );
          return;
        }
        if (!selectedComparator) {
          failAtLine(
            4,
            "Baris 5 belum lengkap.\n\nLengkapi operator perbandingan agar kondisi sensor bisa dievaluasi.\n\nPetunjuk: bandingkan jarak sensor dengan batas aman.",
          );
          return;
        }
        if (selectedComparator !== "<") {
          failAtLine(
            4,
            "Baris 5 belum tepat.\n\nOperator pada baris ini belum sesuai dengan logika sensor jarak.\n\nPetunjuk: pintu harus terbuka saat jarak lebih kecil dari batas.",
          );
          return;
        }
      }

      if (line === 8) {
        if (!selectedElse) {
          failAtLine(
            8,
            "Baris 9 belum lengkap.\n\nLengkapi token cabang alternatif sebelum simulasi dilanjutkan.\n\nPetunjuk: pilih pasangan jalur saat kondisi if tidak terpenuhi.",
          );
          return;
        }
        if (selectedElse !== "else") {
          failAtLine(
            8,
            "Baris 9 belum tepat.\n\nToken pada baris ini belum sesuai konteks proses.\n\nPetunjuk: cabang ini harus menjadi jalur alternatif dari if.",
          );
          return;
        }
        setSensorError(false);
        setElseError(false);
      }

      timerRef.current = setTimeout(() => scanLine(cursor + 1), 220);
    };

    scanLine(0);
  };

  const startRunning = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(true);
    setActiveLine(-1);
    setErrorLine(-1);
    setShowSuccessCard(false);
    resetVisualState();
    setFeedback(
      "Memulai simulasi pintu otomatis...\n\nSistem membaca baris kode dari atas lalu mengeksekusi perulangan sensor.",
    );
    timerRef.current = setTimeout(executeStep, 250);
  };

  const currentDescriptionTarget = selectorTarget ?? descriptionTarget;

  const selectedDescription =
    currentDescriptionTarget === "for"
      ? selectedFor
        ? DESCRIPTION_BY_CHOICE[selectedFor]
        : "Pilih token untuk perulangan empat data sensor jarak."
      : currentDescriptionTarget === "datatype"
        ? selectedDataType
          ? DESCRIPTION_BY_CHOICE[selectedDataType]
          : "Pilih tipe data untuk indeks i pada for-loop."
        : currentDescriptionTarget === "datatype-sensor"
          ? selectedSensorDataType
            ? DESCRIPTION_BY_CHOICE[selectedSensorDataType]
            : "Pilih tipe data untuk deklarasi array sensorJarak."
          : currentDescriptionTarget === "datatype-total"
            ? selectedTotalDataType
              ? DESCRIPTION_BY_CHOICE[selectedTotalDataType]
              : "Pilih tipe data untuk deklarasi variabel totalAksi."
            : currentDescriptionTarget === "if"
              ? selectedIf
                ? DESCRIPTION_BY_CHOICE[selectedIf]
                : "Pilih token untuk percabangan kondisi sensor."
              : currentDescriptionTarget === "comparator"
                ? selectedComparator
                  ? DESCRIPTION_BY_CHOICE[selectedComparator]
                  : "Pilih operator yang tepat untuk batas jarak sensor."
                : currentDescriptionTarget === "else"
                  ? selectedElse
                    ? DESCRIPTION_BY_CHOICE[selectedElse]
                    : "Pilih token pasangan jalur alternatif."
                  : selectedFor
                    ? DESCRIPTION_BY_CHOICE[selectedFor]
                    : "Pilih token yang tepat untuk melengkapi simulasi pintu otomatis.";

  const activeDescriptionTitle =
    currentDescriptionTarget === "comparator" &&
    selectedComparator &&
    selectedComparator in OPERATOR_DETAILS
      ? OPERATOR_DETAILS[selectedComparator as OperatorDocKey].title
      : (currentDescriptionTarget === "datatype" ||
            currentDescriptionTarget === "datatype-sensor" ||
            currentDescriptionTarget === "datatype-total") &&
          ((currentDescriptionTarget === "datatype" && selectedDataType) ||
            (currentDescriptionTarget === "datatype-sensor" &&
              selectedSensorDataType) ||
            (currentDescriptionTarget === "datatype-total" &&
              selectedTotalDataType))
        ? DATATYPE_DETAILS[
            ((currentDescriptionTarget === "datatype" && selectedDataType) ||
              (currentDescriptionTarget === "datatype-sensor" &&
                selectedSensorDataType) ||
              selectedTotalDataType) as DatatypeDocKey
          ].title
        : currentDescriptionTarget === "for" && selectedFor
          ? selectedFor.toUpperCase()
          : currentDescriptionTarget === "if" && selectedIf
            ? selectedIf.toUpperCase()
            : currentDescriptionTarget === "else" && selectedElse
              ? selectedElse.toUpperCase()
              : "SIAP MENULIS";

  const activeDescriptionText =
    currentDescriptionTarget === "comparator" &&
    selectedComparator &&
    selectedComparator in OPERATOR_DETAILS
      ? OPERATOR_DETAILS[selectedComparator as OperatorDocKey].desc
      : (currentDescriptionTarget === "datatype" ||
            currentDescriptionTarget === "datatype-sensor" ||
            currentDescriptionTarget === "datatype-total") &&
          ((currentDescriptionTarget === "datatype" && selectedDataType) ||
            (currentDescriptionTarget === "datatype-sensor" &&
              selectedSensorDataType) ||
            (currentDescriptionTarget === "datatype-total" &&
              selectedTotalDataType))
        ? DATATYPE_DETAILS[
            ((currentDescriptionTarget === "datatype" && selectedDataType) ||
              (currentDescriptionTarget === "datatype-sensor" &&
                selectedSensorDataType) ||
              selectedTotalDataType) as DatatypeDocKey
          ].desc
        : selectedDescription;

  const activeDescriptionColor =
    currentDescriptionTarget === "comparator" &&
    selectedComparator &&
    selectedComparator in OPERATOR_DETAILS
      ? OPERATOR_DETAILS[selectedComparator as OperatorDocKey].color
      : (currentDescriptionTarget === "datatype" ||
            currentDescriptionTarget === "datatype-sensor" ||
            currentDescriptionTarget === "datatype-total") &&
          ((currentDescriptionTarget === "datatype" && selectedDataType) ||
            (currentDescriptionTarget === "datatype-sensor" &&
              selectedSensorDataType) ||
            (currentDescriptionTarget === "datatype-total" &&
              selectedTotalDataType))
        ? DATATYPE_DETAILS[
            ((currentDescriptionTarget === "datatype" && selectedDataType) ||
              (currentDescriptionTarget === "datatype-sensor" &&
                selectedSensorDataType) ||
              selectedTotalDataType) as DatatypeDocKey
          ].color
        : "border-emerald-200 bg-emerald-50";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-lime-50 via-emerald-50 to-amber-50 text-foreground">
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
              Pintu Otomatis Cerdas
            </h1>
            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[8px] font-bold uppercase italic tracking-widest text-emerald-600">
              Lanjutan
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
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-wide transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 ${
              isRunning
                ? "cursor-not-allowed border border-border bg-muted text-muted-foreground"
                : "bg-gradient-to-br from-[#16a34a] to-[#22c55e] text-white hover:from-[#22c55e] hover:to-[#16a34a]"
            }`}
          >
            <Play size={14} fill={isRunning ? "none" : "white"} /> Jalankan
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <aside className="z-20 flex w-72 shrink-0 flex-col gap-6 overflow-y-auto border-r border-emerald-100 bg-white/85 p-5 backdrop-blur">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-emerald-600/70" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Deskripsi Perintah
            </h2>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectorTarget ?? "default"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`rounded-2xl border p-4 shadow-sm ${activeDescriptionColor}`}
            >
              <h3 className="mb-2 text-xs font-black uppercase tracking-tight text-foreground">
                {activeDescriptionTitle}
              </h3>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {activeDescriptionText}
              </p>
            </motion.div>
          </AnimatePresence>

          <div
            className={`rounded-2xl border p-3 transition-all duration-300 ${
              errorLine !== -1
                ? "border-rose-200 bg-rose-50/95"
                : "border-border bg-card"
            }`}
          >
            <div
              className={`flex items-center gap-2 border-b pb-2 ${
                errorLine !== -1 ? "border-rose-200" : "border-border"
              }`}
            >
              {errorLine !== -1 ? (
                <AlertTriangle size={13} className="text-rose-500" />
              ) : (
                <CheckCircle2
                  size={12}
                  className={
                    doorOpen ? "text-emerald-500" : "text-muted-foreground"
                  }
                />
              )}
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${
                  errorLine !== -1 ? "text-rose-600" : "text-muted-foreground"
                }`}
              >
                CATATAN PROSES
              </span>
            </div>

            <div
              className={`mt-2 rounded-lg px-3 py-2 text-[11px] leading-snug whitespace-pre-line ${
                errorLine !== -1
                  ? "bg-rose-100/60 text-rose-700"
                  : "bg-muted text-foreground"
              }`}
            >
              {feedback}
            </div>
          </div>

          <div className="mt-auto rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4">
            <div className="mb-2 flex items-center justify-between text-[9px] font-black uppercase text-emerald-700">
              <span>Status Fokus</span>
              <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-[8px] text-emerald-700">
                Fokus
              </span>
            </div>
            <p className="text-[10px] font-bold italic leading-tight text-muted-foreground">
              {activeLine !== -1
                ? `Menganalisis baris ke-${activeLine + 1}`
                : "Editor siap digunakan"}
            </p>
          </div>
        </aside>

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-transparent">
          <section className="px-6 pb-2 pt-4">
            <div className="flex items-start gap-4 rounded-2xl border border-primary/20 bg-primary/10 p-4 shadow-sm">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                    MISI
                  </span>
                  <h2 className="text-[15px] font-black uppercase tracking-tight text-foreground">
                    Koneksi Sensor & Pintu
                  </h2>
                </div>
                <p className="max-w-4xl text-[11px] font-medium leading-relaxed text-muted-foreground">
                  Lengkapi logika pintu otomatis dengan perulangan sensor jarak,
                  percabangan kondisi, dan jalur alternatif saat area kosong.
                </p>
              </div>
            </div>
          </section>

          <AnimatePresence>
            {showSuccessCard && (
              <motion.section
                key="success-card"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="absolute left-6 right-6 top-[84px] z-20 px-0 pb-0"
              >
                <div className="rounded-2xl border border-emerald-200 bg-card px-4 py-3 shadow-sm">
                  <h3 className="text-sm font-black tracking-tight text-emerald-700">
                    🎉 Berhasil! Algoritma benar
                  </h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground font-medium">
                    Struktur kontrol berjalan sesuai urutan: for → if → else.
                    <br />
                    Pintu otomatis merespons sensor jarak dengan benar.
                  </p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="relative flex flex-1 gap-5 overflow-hidden px-6 pb-6">
            <section className="relative flex min-w-[500px] flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isRunning
                        ? "animate-pulse bg-rose-500"
                        : errorLine !== -1
                          ? "bg-red-500 shadow-[0_0_5px_red]"
                          : "bg-emerald-500"
                    }`}
                  />
                  <span className="font-mono text-[10px] font-black uppercase italic tracking-widest text-muted-foreground">
                    ALGORITMA PINTU OTOMATIS
                  </span>
                </div>
                <div
                  className={`rounded border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${
                    isRunning
                      ? "bg-rose-500 text-white"
                      : errorLine !== -1
                        ? "border-red-600 bg-red-500 text-white shadow-sm"
                        : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {isRunning
                    ? "RUNNING"
                    : errorLine !== -1
                      ? "ERROR"
                      : "SIAP MENULIS"}
                </div>
              </div>

              <div className="relative flex flex-1 overflow-hidden font-mono text-[11px] leading-[22px]">
                <div className="w-10 shrink-0 select-none overflow-hidden border-r border-border bg-muted/30 pt-4 pr-3 text-right text-[10px] text-muted-foreground">
                  {Array.from({ length: codeLines.length }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-[22px] transition-all ${
                        activeLine === i
                          ? "scale-105 pr-1 font-black text-emerald-600"
                          : ""
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                <div className="relative flex-1 overflow-hidden bg-card">
                  <div className="absolute inset-0 z-10 overflow-x-auto overflow-y-hidden whitespace-pre p-4 pt-4">
                    {codeLines.map((line, i) => (
                      <div
                        key={i}
                        className="relative flex h-[22px] items-center"
                      >
                        {activeLine === i && (
                          <motion.div
                            layoutId="lineHighlightPintuOtomatisLanjutan"
                            className={`absolute inset-0 -mx-4 -my-1 z-0 border-l-4 ${
                              isRunning
                                ? "border-emerald-500 bg-emerald-50"
                                : errorLine === i
                                  ? "border-rose-500 bg-rose-50/60"
                                  : "border-emerald-200 bg-emerald-50/30"
                            }`}
                          />
                        )}

                        {i === 1 ? (
                          <div className="relative z-10 whitespace-pre text-[11px] font-bold text-slate-900">
                            <span>{"    "}</span>
                            <button
                              type="button"
                              disabled={isRunning}
                              onClick={() => openSelector("datatype-sensor", 1)}
                              className={`rounded px-1 py-0 transition-all ${
                                selectedSensorDataType
                                  ? "text-slate-900 hover:bg-emerald-50"
                                  : "italic text-slate-300 hover:bg-slate-100"
                              } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {selectedSensorDataType ?? "___"}
                            </button>
                            <span>
                              {" sensorJarak[] = {150, 30, 25, 200};"}
                            </span>
                          </div>
                        ) : i === 2 ? (
                          <div className="relative z-10 whitespace-pre text-[11px] font-bold text-slate-900">
                            <span>{"    "}</span>
                            <button
                              type="button"
                              disabled={isRunning}
                              onClick={() => openSelector("datatype-total", 2)}
                              className={`rounded px-1 py-0 transition-all ${
                                selectedTotalDataType
                                  ? "text-slate-900 hover:bg-emerald-50"
                                  : "italic text-slate-300 hover:bg-slate-100"
                              } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {selectedTotalDataType ?? "___"}
                            </button>
                            <span>{" totalAksi = 0;"}</span>
                          </div>
                        ) : i === 3 ? (
                          <div className="relative z-10 whitespace-pre text-[11px] font-bold text-slate-900">
                            <button
                              type="button"
                              disabled={isRunning}
                              onClick={() => openSelector("for", 3)}
                              className={`rounded px-1 py-0 transition-all ${
                                selectedFor
                                  ? "text-slate-900 hover:bg-emerald-50"
                                  : "italic text-slate-300 hover:bg-slate-100"
                              } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {selectedFor ?? "_____"}
                            </button>
                            <span>{" ("}</span>
                            <button
                              type="button"
                              disabled={isRunning}
                              onClick={() => openSelector("datatype", 3)}
                              className={`rounded px-1 py-0 transition-all ${
                                selectedDataType
                                  ? "text-slate-900 hover:bg-emerald-50"
                                  : "italic text-slate-300 hover:bg-slate-100"
                              } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {selectedDataType ?? "___"}
                            </button>
                            <span>{" i = 0; i < 4; i++) {"}</span>
                          </div>
                        ) : i === 4 ? (
                          <div className="relative z-10 whitespace-pre text-[11px] font-bold text-slate-900">
                            <span>{"    "}</span>
                            <button
                              type="button"
                              disabled={isRunning}
                              onClick={() => openSelector("if", 4)}
                              className={`rounded px-1 py-0 transition-all ${
                                selectedIf
                                  ? "text-slate-900 hover:bg-emerald-50"
                                  : "italic text-slate-300 hover:bg-slate-100"
                              } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {selectedIf ?? "___"}
                            </button>
                            <span>{" (sensorJarak[i] "}</span>
                            <button
                              type="button"
                              disabled={isRunning}
                              onClick={() => openSelector("comparator", 4)}
                              className={`rounded px-1 py-0 transition-all ${
                                selectedComparator
                                  ? "text-slate-900 hover:bg-emerald-50"
                                  : "italic text-slate-300 hover:bg-slate-100"
                              } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {selectedComparator ?? "__"}
                            </button>
                            <span>{" 50) {"}</span>
                          </div>
                        ) : i === 8 ? (
                          <div className="relative z-10 whitespace-pre text-[11px] font-bold text-slate-900">
                            <span>{"        } "}</span>
                            <button
                              type="button"
                              disabled={isRunning}
                              onClick={() => openSelector("else", 8)}
                              className={`rounded px-1 py-0 transition-all ${
                                selectedElse
                                  ? "text-slate-900 hover:bg-emerald-50"
                                  : "italic text-slate-300 hover:bg-slate-100"
                              } ${isRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {selectedElse ?? "_____"}
                            </button>
                            <span>{" {"}</span>
                          </div>
                        ) : (
                          <div className="relative z-10 whitespace-pre text-[11px] font-bold text-slate-900">
                            {line}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectorTarget && !isRunning && (
                    <div className="absolute bottom-4 left-5 right-5 z-30 rounded-xl border border-emerald-200 bg-card px-3 py-2 shadow-lg">
                      <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-emerald-700">
                        {selectorTarget === "for"
                          ? "PILIH TOKEN BARIS 5"
                          : selectorTarget === "datatype-sensor"
                            ? "PILIH TIPE DATA BARIS 2"
                            : selectorTarget === "datatype-total"
                              ? "PILIH TIPE DATA BARIS 3"
                              : selectorTarget === "datatype"
                                ? "PILIH TIPE DATA BARIS 5"
                                : selectorTarget === "if"
                                  ? "PILIH TOKEN BARIS 6"
                                  : selectorTarget === "comparator"
                                    ? "PILIH OPERATOR BARIS 7"
                                    : "PILIH TOKEN BARIS 11"}
                      </p>
                      <div
                        className={`grid gap-2 ${
                          selectorTarget === "comparator"
                            ? "grid-cols-4"
                            : "grid-cols-5"
                        }`}
                      >
                        {selectorOptions.map((choice, idx) => (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => {
                              if (selectorTarget === "for") {
                                setSelectedFor(choice);
                              } else if (selectorTarget === "datatype-sensor") {
                                setSelectedSensorDataType(
                                  choice as DataTypeChoice,
                                );
                              } else if (selectorTarget === "datatype-total") {
                                setSelectedTotalDataType(
                                  choice as DataTypeChoice,
                                );
                              } else if (selectorTarget === "datatype") {
                                setSelectedDataType(choice as DataTypeChoice);
                              } else if (selectorTarget === "if") {
                                setSelectedIf(choice);
                              } else if (selectorTarget === "comparator") {
                                setSelectedComparator(
                                  choice as ComparatorChoice,
                                );
                              } else {
                                setSelectedElse(choice);
                              }
                              setSelectorTarget(null);
                              setErrorLine(-1);
                              setShowSuccessCard(false);
                              setVisualError(false);
                            }}
                            className={`rounded-lg border px-2 py-1 text-[9px] font-black uppercase tracking-wide ${
                              OPTION_BUTTON_THEMES[
                                idx % OPTION_BUTTON_THEMES.length
                              ]
                            }`}
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="flex w-[380px] shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-800 bg-[#020617] shadow-2xl min-h-0 relative">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 px-6 p-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    VISUALISASI
                  </h2>
                </div>
              </div>

              <div className="relative flex flex-1 min-h-[230px] flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)] p-4 md:min-h-[260px] md:p-6">
                <AnimatePresence>
                  {sensorError && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="absolute top-6 z-50 flex items-center gap-3 rounded-lg border-2 border-red-500 bg-red-950 px-4 py-3 shadow-2xl shadow-red-500/50"
                    >
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="h-4 w-4 rounded-full bg-red-500 shadow-[0_0_12px_#ef4444]"
                      />
                      <span className="text-[11px] font-black uppercase tracking-widest text-red-300">
                        ⚠ Error Sensor
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {totalError && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="absolute top-6 z-50 flex items-center gap-3 rounded-lg border-2 border-orange-500 bg-orange-950 px-4 py-3 shadow-2xl shadow-orange-500/50"
                    >
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="h-4 w-4 rounded-full bg-orange-500 shadow-[0_0_12px_#ff8c00]"
                      />
                      <span className="text-[11px] font-black uppercase tracking-widest text-orange-300">
                        ⚠ Error Counter
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {forError && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="absolute top-6 z-50 flex items-center gap-3 rounded-lg border-2 border-yellow-500 bg-yellow-950 px-4 py-3 shadow-2xl shadow-yellow-500/50"
                    >
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="h-4 w-4 rounded-full bg-yellow-500 shadow-[0_0_12px_#eab308]"
                      />
                      <span className="text-[11px] font-black uppercase tracking-widest text-yellow-300">
                        ⚠ Error Loop
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {ifError && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="absolute top-6 z-50 flex items-center gap-3 rounded-lg border-2 border-cyan-500 bg-cyan-950 px-4 py-3 shadow-2xl shadow-cyan-500/50"
                    >
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="h-4 w-4 rounded-full bg-cyan-500 shadow-[0_0_12px_#06b6d4]"
                      />
                      <span className="text-[11px] font-black uppercase tracking-widest text-cyan-300">
                        ⚠ Error Kondisi
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {elseError && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="absolute top-6 z-50 flex items-center gap-3 rounded-lg border-2 border-purple-500 bg-purple-950 px-4 py-3 shadow-2xl shadow-purple-500/50"
                    >
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="h-4 w-4 rounded-full bg-purple-500 shadow-[0_0_12px_#a855f7]"
                      />
                      <span className="text-[11px] font-black uppercase tracking-widest text-purple-300">
                        ⚠ Sistem Terkunci
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute top-20 flex h-5 w-72 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-800/80 shadow-lg">
                  <motion.div
                    animate={
                      ifError
                        ? { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }
                        : sensorError
                          ? { opacity: [0.3, 1, 0.3] }
                          : { opacity: 1 }
                    }
                    transition={
                      ifError
                        ? { duration: 0.4, repeat: Infinity }
                        : sensorError
                          ? { duration: 0.6, repeat: Infinity }
                          : { duration: 0.3 }
                    }
                    className={`h-3 w-3 rounded-full transition-all duration-300 ${
                      ifError
                        ? "bg-orange-600 shadow-[0_0_20px_#ea580c]"
                        : sensorError
                          ? "bg-red-500 shadow-[0_0_15px_#ef4444]"
                          : sensorValue === "aktif"
                            ? "bg-rose-500 shadow-[0_0_15px_#ef4444]"
                            : sensorValue === "mati"
                              ? "bg-cyan-400/70 shadow-[0_0_10px_rgba(34,211,238,.55)]"
                              : "bg-slate-900"
                    }`}
                  />
                  <div
                    className={`ml-2 font-black uppercase tracking-widest ${
                      ifError
                        ? "text-[10px] text-orange-400 animate-pulse"
                        : sensorError
                          ? "text-[10px] text-red-400"
                          : "text-[9px] text-slate-300"
                    }`}
                  >
                    {ifError
                      ? "❌ ERROR KONDISI"
                      : sensorError
                        ? "⚠ ERROR SENSOR"
                        : "Detektor Infrared"}
                  </div>
                </div>

                <div className="relative h-80 w-72 overflow-hidden rounded-t-lg border-4 border-slate-800 bg-slate-900/50 shadow-2xl">
                  <AnimatePresence>
                    {crossingPulse && !visualError && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.08, 0.2, 0.08] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,.22),rgba(16,185,129,0)_60%)]"
                      />
                    )}
                  </AnimatePresence>

                  <motion.div
                    animate={{ x: doorOpen ? "-90%" : "0%" }}
                    transition={{ duration: 0.8 }}
                    className="absolute left-0 top-0 z-10 flex h-full w-1/2 items-center justify-end border-r border-slate-600 bg-slate-700 p-2"
                  >
                    <div className="h-12 w-1 rounded-full bg-slate-600 shadow-lg" />
                  </motion.div>
                  <motion.div
                    animate={{ x: doorOpen ? "90%" : "0%" }}
                    transition={{ duration: 0.8 }}
                    className="absolute right-0 top-0 z-10 flex h-full w-1/2 items-center justify-start border-l border-slate-600 bg-slate-700 p-2"
                  >
                    <div className="h-12 w-1 rounded-full bg-slate-600 shadow-lg" />
                  </motion.div>
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950 opacity-30">
                    <div className="h-24 w-36 rounded-2xl border border-emerald-500/10 bg-emerald-500/5" />
                  </div>
                  <AnimatePresence>
                    {visualError && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.15, 0.35, 0.15, 0.3] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_50%_30%,rgba(248,113,113,.18),rgba(248,113,113,0)_58%)]"
                      />
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {ifError && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-40 flex items-center justify-center bg-orange-950/90 backdrop-blur-sm"
                      >
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="flex flex-col items-center gap-3"
                        >
                          <div className="text-4xl">❌</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-orange-300 text-center">
                            Evaluasi
                            <br />
                            Gagal
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {elseError && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-40 flex items-center justify-center bg-purple-950/95 backdrop-blur-sm"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                          className="flex flex-col items-center gap-3"
                        >
                          <div className="text-4xl">🔒</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-purple-300 text-center">
                            Sistem
                            <br />
                            Terkunci
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="h-8 w-full rounded-b-xl border-t-2 border-slate-700 bg-slate-800 shadow-xl" />

                <motion.div
                  initial={{ opacity: 0, y: 150 }}
                  animate={{
                    opacity: personVisible ? 1 : 0,
                    y: personVisible ? 60 : 150,
                  }}
                  transition={{ duration: 0.8 }}
                  className="absolute z-30"
                >
                  <div className="flex flex-col items-center">
                    <div className="relative mb-1 z-10 h-14 w-14 rounded-full border-4 border-amber-300 bg-gradient-to-br from-amber-100 to-amber-200 shadow-2xl">
                      <div className="absolute left-3 top-5 h-2 w-2 rounded-full bg-slate-800" />
                      <div className="absolute right-3 top-5 h-2 w-2 rounded-full bg-slate-800" />
                      <div className="absolute left-1/2 top-8 h-2 w-4 -translate-x-1/2 rounded-b-lg border-b-2 border-slate-800" />
                    </div>

                    <div className="relative h-24 w-16 overflow-hidden rounded-b-lg rounded-t-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-2xl">
                      <div className="absolute left-1/2 top-0 h-3 w-8 -translate-x-1/2 rounded-b-full bg-white/20" />
                      <div className="absolute left-1/2 top-6 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/40" />
                      <div className="absolute left-1/2 top-10 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/40" />
                      <div className="absolute left-1/2 top-14 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/40" />
                      <div className="absolute -left-2 top-2 h-16 w-3 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 shadow-lg" />
                      <div className="absolute -right-2 top-2 h-16 w-3 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 shadow-lg" />
                    </div>

                    <div className="mt-1 flex gap-2">
                      <div className="h-8 w-5 rounded-b-lg bg-gradient-to-b from-slate-700 to-slate-800 shadow-lg" />
                      <div className="h-8 w-5 rounded-b-lg bg-gradient-to-b from-slate-700 to-slate-800 shadow-lg" />
                    </div>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {isRunning && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute z-50 flex items-center gap-3 rounded-full border border-emerald-400 bg-emerald-600 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl"
                    >
                      Menganalisis...
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <footer className="z-30 flex shrink-0 items-center justify-between border-t border-border bg-background px-6 py-2 text-[10px] font-medium text-muted-foreground select-none">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              isRunning
                ? "animate-pulse bg-emerald-500"
                : errorLine !== -1
                  ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                  : "bg-slate-300"
            }`}
          />
          <span className="font-bold uppercase tracking-wider">
            STATUS SISTEM •{" "}
            {isRunning
              ? "Algoritma sedang dijalankan"
              : errorLine !== -1
                ? "Pemeriksaan logika diperlukan"
                : "Sistem siap menjalankan algoritma."}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden font-bold uppercase tracking-tighter md:inline">
            Bahasa: Pseudocode Indonesia
          </span>
          <span className="font-black uppercase italic tracking-tight text-emerald-700">
            CODIN • Interactive Algorithm Learning • 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
