"use client";

import React, { useEffect, useState, use } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, CheckCircle, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Soal {
  id: string;
  question: string;
  type: "pilihan_ganda" | "essay";
  options?: {
    [key: string]: string | { text?: string; image_url?: string | null };
  };
  correct_answer?: string;
  points: number;
  file_url?: string;
}

type OptionValue = string | { text?: string; image_url?: string | null };

interface Jawaban {
  soal_id: string;
  answer: string;
}

interface QuizDraft {
  asesmenId: string;
  currentSoalIndex: number;
  jawaban: Jawaban[];
  flaggedSoalIds: string[];
  expiresAt: number;
}

export default function SiswaAsesmenDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [asesmen, setAsesmen] = useState<any>(null);
  const [soals, setSoals] = useState<Soal[]>([]);
  const [currentSoalIndex, setCurrentSoalIndex] = useState(0);
  const [jawaban, setJawaban] = useState<Jawaban[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 menit dalam detik
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [questionVisible, setQuestionVisible] = useState(false);
  const [allowExit, setAllowExit] = useState(false);
  const [flaggedSoalIds, setFlaggedSoalIds] = useState<string[]>([]);
  const [draftHydrated, setDraftHydrated] = useState(false);

  const getDraftKey = () => `quiz_draft_${id}`;

  const clearQuizDraft = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(getDraftKey());
  };

  useEffect(() => {
    fetchAsesmenData();
  }, [id]);

  useEffect(() => {
    setQuestionVisible(false);
    const timer = window.setTimeout(() => setQuestionVisible(true), 20);
    return () => window.clearTimeout(timer);
  }, [currentSoalIndex]);

  useEffect(() => {
    if (loading || soals.length === 0 || allowExit) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      setShowExitDialog(true);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [loading, soals.length, allowExit]);

  useEffect(() => {
    if (loading || soals.length === 0 || submitting || !draftHydrated) return;

    const draft: QuizDraft = {
      asesmenId: id,
      currentSoalIndex,
      jawaban,
      flaggedSoalIds,
      expiresAt: Date.now() + timeLeft * 1000,
    };

    localStorage.setItem(getDraftKey(), JSON.stringify(draft));
  }, [
    id,
    loading,
    soals.length,
    submitting,
    draftHydrated,
    currentSoalIndex,
    jawaban,
    flaggedSoalIds,
    timeLeft,
  ]);

  // Timer countdown
  useEffect(() => {
    if (loading || submitting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, submitting]);

  const fetchAsesmenData = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setDraftHydrated(true);
      return;
    }

    try {
      // Check if there are existing answers (not nilai)
      const { data: jawabanData } = await supabase
        .from("jawaban_siswa")
        .select("id")
        .eq("asesmen_id", id)
        .eq("siswa_id", user.id)
        .limit(1);

      if (jawabanData && jawabanData.length > 0) {
        clearQuizDraft();

        // Get latest nilai
        const { data: nilaiData } = await supabase
          .from("nilai")
          .select("score")
          .eq("asesmen_id", id)
          .eq("siswa_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(1)
          .single();

        toast.error(
          "Anda sudah mengerjakan kuis ini. Hubungi guru untuk membuka ulang.",
        );
        router.push("/siswa/asesmen");
        return;
      }

      // Fetch asesmen
      const { data: asesmenData } = await supabase
        .from("asesmen")
        .select("*")
        .eq("id", id)
        .single();

      const nowMs = Date.now();
      const startMs = asesmenData?.waktu_mulai
        ? new Date(asesmenData.waktu_mulai).getTime()
        : Number.NaN;
      const endMs = asesmenData?.waktu_selesai
        ? new Date(asesmenData.waktu_selesai).getTime()
        : Number.NaN;

      if (!Number.isNaN(startMs) && nowMs < startMs) {
        toast.error("Kuis belum dibuka sesuai jadwal.");
        router.push("/siswa/asesmen");
        return;
      }

      if (!Number.isNaN(endMs) && nowMs > endMs) {
        toast.error("Waktu pengerjaan kuis sudah ditutup.");
        router.push("/siswa/asesmen");
        return;
      }

      setAsesmen(asesmenData);

      // Set timer based on asesmen duration (convert minutes to seconds)
      let nextTimeLeft = asesmenData?.duration
        ? asesmenData.duration * 60
        : 3600;
      if (!Number.isNaN(endMs)) {
        const secondsUntilEnd = Math.max(
          0,
          Math.floor((endMs - Date.now()) / 1000),
        );
        nextTimeLeft = Math.min(nextTimeLeft, secondsUntilEnd);
      }
      setTimeLeft(nextTimeLeft);

      // Fetch soals
      const { data: soalsData } = await supabase
        .from("soal")
        .select("*")
        .eq("asesmen_id", id)
        .order("created_at", { ascending: true });

      setSoals(soalsData || []);

      // Initialize jawaban array
      const initialJawaban: Jawaban[] =
        soalsData?.map((s) => ({
          soal_id: s.id,
          answer: "",
        })) || [];

      const savedDraftRaw = localStorage.getItem(getDraftKey());

      if (savedDraftRaw && soalsData && soalsData.length > 0) {
        try {
          const savedDraft = JSON.parse(savedDraftRaw) as QuizDraft;

          if (
            savedDraft.asesmenId === id &&
            savedDraft.expiresAt > Date.now()
          ) {
            const restoredJawaban = initialJawaban.map((item) => {
              const savedAnswer = savedDraft.jawaban.find(
                (draftItem) => draftItem.soal_id === item.soal_id,
              );

              return savedAnswer
                ? { ...item, answer: savedAnswer.answer }
                : item;
            });

            setJawaban(restoredJawaban);
            setFlaggedSoalIds(savedDraft.flaggedSoalIds || []);
            setCurrentSoalIndex(
              Math.min(
                Math.max(savedDraft.currentSoalIndex || 0, 0),
                Math.max(soalsData.length - 1, 0),
              ),
            );

            if (savedDraft.expiresAt) {
              const remainingTime = Math.max(
                0,
                Math.floor((savedDraft.expiresAt - Date.now()) / 1000),
              );
              setTimeLeft((prev) => Math.min(prev, remainingTime));
            }

            toast.info(
              "Progress kuis dipulihkan. Lanjutkan dari sesi terakhir.",
            );
          } else {
            setJawaban(initialJawaban);
            setFlaggedSoalIds([]);
            clearQuizDraft();
          }
        } catch {
          setJawaban(initialJawaban);
          setFlaggedSoalIds([]);
          clearQuizDraft();
        }
      } else {
        setJawaban(initialJawaban);
        setFlaggedSoalIds([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setDraftHydrated(true);
      setLoading(false);
    }
  };

  const handleAnswerChange = (soalId: string, answer: string) => {
    setJawaban((prev) =>
      prev.map((j) => (j.soal_id === soalId ? { ...j, answer } : j)),
    );
  };

  const handleNext = () => {
    if (currentSoalIndex < soals.length - 1) {
      setCurrentSoalIndex(currentSoalIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSoalIndex > 0) {
      setCurrentSoalIndex(currentSoalIndex - 1);
    }
  };

  const toggleRaguRagu = (soalId: string) => {
    setFlaggedSoalIds((prev) =>
      prev.includes(soalId)
        ? prev.filter((id) => id !== soalId)
        : [...prev, soalId],
    );
  };

  const handleSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    try {
      let totalPoints = 0;
      let earnedPoints = 0;

      // Calculate score
      const jawabanWithScore = jawaban.map((j) => {
        const soal = soals.find((s) => s.id === j.soal_id);
        if (!soal) return { ...j, is_correct: false, points_earned: 0 };

        totalPoints += soal.points;

        let isCorrect: boolean | null = false;
        let pointsEarned = 0;

        if (soal.type === "pilihan_ganda") {
          isCorrect = j.answer === soal.correct_answer;
          pointsEarned = isCorrect ? soal.points : 0;
        } else {
          // Essay - needs manual grading
          isCorrect = null;
          pointsEarned = 0;
        }

        if (isCorrect) earnedPoints += pointsEarned;

        return {
          asesmen_id: id,
          siswa_id: user.id,
          soal_id: j.soal_id,
          answer: j.answer,
          is_correct: isCorrect,
          points_earned: pointsEarned,
        };
      });

      // Save all jawaban
      const { error: jawabanError } = await supabase
        .from("jawaban_siswa")
        .insert(jawabanWithScore);

      if (jawabanError) throw jawabanError;

      // Calculate final score
      const finalScore =
        totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

      // Save nilai
      const { error: nilaiError } = await supabase.from("nilai").insert({
        asesmen_id: id,
        siswa_id: user.id,
        score: finalScore,
        completed_at: new Date().toISOString(),
      });

      if (nilaiError) throw nilaiError;

      clearQuizDraft();
      toast.success(`Berhasil mengirim jawaban! Nilai Anda: ${finalScore}/100`);
      router.push("/siswa/asesmen");
    } catch (error: any) {
      console.error("Error submitting answers:", error);
      toast.error(`Gagal mengirim jawaban: ${error.message}`);
      setAllowExit(false);
      setSubmitting(false);
    }
  };

  const openSubmitDialog = () => {
    if (submitting) return;
    setShowSubmitDialog(true);
  };

  const openExitDialog = () => {
    if (submitting) return;
    setShowExitDialog(true);
  };

  const handleExitAndFinish = async () => {
    setShowExitDialog(false);
    setAllowExit(true);
    await handleSubmit();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getOptionText = (optionValue?: OptionValue) => {
    if (!optionValue) return "";
    if (typeof optionValue === "string") return optionValue;
    return optionValue.text || "";
  };

  const getOptionImageUrl = (optionValue?: OptionValue) => {
    if (!optionValue || typeof optionValue === "string") return "";
    return optionValue.image_url || "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (soals.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-12 text-center">
          <p className="text-gray-600">Belum ada soal untuk kuis ini.</p>
          <Link href="/siswa/asesmen">
            <Button className="mt-4 bg-green-600 hover:bg-green-700">
              Kembali
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const currentSoal = soals[currentSoalIndex];
  const currentJawaban = jawaban.find((j) => j.soal_id === currentSoal.id);
  const unansweredNumbers = soals
    .map((soal, index) => ({
      index: index + 1,
      answer: jawaban.find((j) => j.soal_id === soal.id)?.answer,
    }))
    .filter((item) => !item.answer)
    .map((item) => item.index);

  return (
    <div className="h-screen flex flex-col p-4 max-w-6xl mx-auto bg-gray-50 dark:bg-background">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={openExitDialog}>
            <ArrowLeft size={16} className="mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {asesmen?.title}
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {asesmen?.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-base font-semibold text-gray-700 dark:text-green-200 bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded-lg border border-green-100 dark:border-green-900/50 shadow-sm">
          <Clock size={16} className="text-green-600" />
          <span className={timeLeft < 300 ? "text-red-600" : ""}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="w-full max-w-4xl mx-auto h-full flex flex-col gap-3">
          <Card className="p-3 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm flex-shrink-0 bg-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Soal {currentSoalIndex + 1} dari {soals.length}
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                {currentSoal.points} poin
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {soals.map((soal, index) => {
                const answered = jawaban.find(
                  (j) => j.soal_id === soal.id,
                )?.answer;
                const isActive = index === currentSoalIndex;
                const isAnswered = Boolean(answered);
                const isFlagged = flaggedSoalIds.includes(soal.id);

                return (
                  <button
                    key={soal.id}
                    onClick={() => setCurrentSoalIndex(index)}
                    className={`min-w-8 h-8 px-2 rounded-md text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-green-600 text-white"
                        : isFlagged
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900/40"
                          : isAnswered
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900/50 hover:bg-green-200 dark:hover:bg-green-900/40"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-transparent dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                    aria-label={`Soal ${index + 1}${isFlagged ? " ditandai ragu-ragu" : isAnswered ? " sudah dijawab" : " belum dijawab"}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card
            className={`p-5 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm flex-1 flex flex-col min-h-0 transition-all duration-300 bg-card ${
              questionVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            }`}
          >
            <div className="mb-4 flex-shrink-0">
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                {currentSoal.question}
              </p>

              {currentSoal.file_url && (
                <div className="mt-2">
                  <a
                    href={currentSoal.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 underline text-xs"
                  >
                    📎 Lihat Lampiran
                  </a>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 mb-4 pr-1">
              {currentSoal.type === "pilihan_ganda" && currentSoal.options ? (
                Object.entries(currentSoal.options).map(([key, value]) => {
                  const optionText = getOptionText(value as OptionValue);
                  const optionImageUrl = getOptionImageUrl(
                    value as OptionValue,
                  );

                  return (
                    <label
                      key={key}
                      className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all duration-150 shadow-sm ${
                        currentJawaban?.answer === key
                          ? "border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/30"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-card hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50/50 dark:hover:bg-green-900/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`soal-${currentSoal.id}`}
                        value={key}
                        checked={currentJawaban?.answer === key}
                        onChange={(e) =>
                          handleAnswerChange(currentSoal.id, e.target.value)
                        }
                        className="mt-1 mr-3 flex-shrink-0"
                      />
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {key}.
                        </span>{" "}
                        {optionText}
                        {optionImageUrl && (
                          <span className="block mt-2">
                            <img
                              src={optionImageUrl}
                              alt={`Gambar opsi ${key}`}
                              className="h-20 w-auto rounded border border-gray-200 dark:border-gray-700 object-contain"
                            />
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })
              ) : (
                <textarea
                  value={currentJawaban?.answer || ""}
                  onChange={(e) =>
                    handleAnswerChange(currentSoal.id, e.target.value)
                  }
                  placeholder="Tulis jawaban Anda di sini..."
                  className="w-full h-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-input text-gray-900 dark:text-gray-100 rounded-lg focus:border-green-500 dark:focus:border-green-600 focus:outline-none text-sm resize-none"
                />
              )}
            </div>

            <div className="flex justify-between items-center flex-shrink-0 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePrevious}
                  disabled={currentSoalIndex === 0}
                  variant="outline"
                  size="sm"
                  className="min-w-28 gap-2"
                >
                  <ArrowLeft size={14} />
                  Sebelumnya
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleRaguRagu(currentSoal.id)}
                  className={
                    flaggedSoalIds.includes(currentSoal.id)
                      ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }
                >
                  {flaggedSoalIds.includes(currentSoal.id)
                    ? "Batalkan Ragu-ragu"
                    : "Ragu-ragu"}
                </Button>
              </div>

              {currentSoalIndex === soals.length - 1 ? (
                <Button
                  onClick={openSubmitDialog}
                  disabled={submitting}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 gap-2 min-w-32"
                >
                  <CheckCircle size={16} />
                  {submitting ? "Mengirim..." : "Kirim Jawaban"}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 min-w-28 gap-2"
                >
                  Selanjutnya
                  <ArrowRight size={14} />
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-md rounded-xl border border-gray-100 p-7 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Kirim Jawaban
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              Yakin ingin mengirim jawaban? Jawaban tidak dapat diubah setelah
              dikirim.
            </DialogDescription>
          </DialogHeader>

          {unansweredNumbers.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-800">
                Masih ada soal yang belum dijawab.
              </p>
              <p className="mt-1 text-sm text-amber-700">
                Nomor soal: {unansweredNumbers.join(", ")}
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSubmitDialog(false)}
              disabled={submitting}
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowSubmitDialog(false);
                handleSubmit();
              }}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              Kirim Jawaban
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="max-w-md rounded-xl border border-gray-100 p-7 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Keluar dari Kuis?
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              Jika Anda keluar sekarang, kuis akan dianggap selesai dan jawaban
              yang sudah dipilih akan dikumpulkan.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              onClick={() => setShowExitDialog(false)}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              Tetap di Kuis
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExitAndFinish}
              disabled={submitting}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Keluar & Selesai
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
