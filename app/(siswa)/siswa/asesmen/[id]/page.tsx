"use client";

import React, { useEffect, useState, use } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Soal {
  id: string;
  question: string;
  type: "pilihan_ganda" | "essay";
  options?: { [key: string]: string };
  correct_answer?: string;
  points: number;
  file_url?: string;
}

interface Jawaban {
  soal_id: string;
  answer: string;
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

  useEffect(() => {
    fetchAsesmenData();
  }, [id]);

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

    if (!user) return;

    try {
      // Check if already completed
      const { data: nilaiData } = await supabase
        .from("nilai")
        .select("score")
        .eq("asesmen_id", id)
        .eq("siswa_id", user.id)
        .single();

      if (nilaiData) {
        alert(
          "Anda sudah mengerjakan asesmen ini. Nilai Anda: " + nilaiData.score
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

      setAsesmen(asesmenData);

      // Set timer based on asesmen duration (convert minutes to seconds)
      if (asesmenData?.duration) {
        setTimeLeft(asesmenData.duration * 60);
      }

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
      setJawaban(initialJawaban);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (soalId: string, answer: string) => {
    setJawaban((prev) =>
      prev.map((j) => (j.soal_id === soalId ? { ...j, answer } : j))
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

  const handleSubmit = async () => {
    if (submitting) return;

    if (
      !confirm(
        "Yakin ingin mengirim jawaban? Jawaban tidak dapat diubah setelah dikirim."
      )
    ) {
      return;
    }

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

        let isCorrect = false;
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

      alert(`Berhasil mengirim jawaban! Nilai Anda: ${finalScore}`);
      router.push("/siswa/asesmen");
    } catch (error: any) {
      console.error("Error submitting answers:", error);
      alert(`Gagal mengirim jawaban: ${error.message}`);
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
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
          <p className="text-gray-600">Belum ada soal untuk asesmen ini.</p>
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/siswa/asesmen">
          <Button variant="outline" size="sm">
            <ArrowLeft size={16} className="mr-2" />
            Kembali
          </Button>
        </Link>
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-700">
          <Clock size={20} />
          <span className={timeLeft < 300 ? "text-red-600" : ""}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Asesmen Info */}
      <Card className="p-6 mb-6 border-green-100">
        <h1 className="text-2xl font-bold text-gray-900">{asesmen?.title}</h1>
        <p className="text-gray-600 mt-2">{asesmen?.description}</p>
      </Card>

      {/* Question Number Navigation */}
      <Card className="p-4 mb-6 border-green-100">
        <div className="flex flex-wrap gap-2">
          {soals.map((soal, index) => {
            const answered = jawaban.find((j) => j.soal_id === soal.id)?.answer;
            return (
              <button
                key={soal.id}
                onClick={() => setCurrentSoalIndex(index)}
                className={`w-10 h-10 rounded-lg font-medium transition ${
                  index === currentSoalIndex
                    ? "bg-green-600 text-white"
                    : answered
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Current Question */}
      <Card className="p-6 mb-6 border-green-100">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Soal {currentSoalIndex + 1} dari {soals.length}
          </h2>
          <span className="text-sm text-gray-500">
            {currentSoal.points} poin
          </span>
        </div>

        <p className="text-gray-800 mb-4 whitespace-pre-wrap">
          {currentSoal.question}
        </p>

        {currentSoal.file_url && (
          <div className="mb-4">
            <a
              href={currentSoal.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700 underline text-sm"
            >
              📎 Lihat Lampiran
            </a>
          </div>
        )}

        {/* Answer Options */}
        <div className="space-y-3">
          {currentSoal.type === "pilihan_ganda" && currentSoal.options ? (
            Object.entries(currentSoal.options).map(([key, value]) => (
              <label
                key={key}
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                  currentJawaban?.answer === key
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200 hover:border-green-300"
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
                  className="mt-1 mr-3"
                />
                <span className="flex-1">
                  <span className="font-medium">{key}.</span> {value}
                </span>
              </label>
            ))
          ) : (
            <textarea
              value={currentJawaban?.answer || ""}
              onChange={(e) =>
                handleAnswerChange(currentSoal.id, e.target.value)
              }
              placeholder="Tulis jawaban Anda di sini..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none min-h-[150px]"
            />
          )}
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          onClick={handlePrevious}
          disabled={currentSoalIndex === 0}
          variant="outline"
          className="border-green-200"
        >
          Sebelumnya
        </Button>

        {currentSoalIndex === soals.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <CheckCircle size={16} />
            {submitting ? "Mengirim..." : "Kirim Jawaban"}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="bg-green-600 hover:bg-green-700"
          >
            Selanjutnya
          </Button>
        )}
      </div>
    </div>
  );
}
