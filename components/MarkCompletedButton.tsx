"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

interface MarkCompletedButtonProps {
  simulasiSlug: string;
}

export default function MarkCompletedButton({
  simulasiSlug,
}: MarkCompletedButtonProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkCompleted();
  }, [simulasiSlug]);

  const checkCompleted = async () => {
    try {
      const response = await fetch(
        `/api/siswa/simulasi/check-completed?simulasi_slug=${simulasiSlug}`
      );
      const data = await response.json();
      setIsCompleted(data.completed || false);
    } catch (error) {
      console.error("Error checking completion status:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (isCompleted) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/siswa/simulasi/mark-completed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ simulasi_slug: simulasiSlug }),
      });

      if (response.ok) {
        setIsCompleted(true);
      }
    } catch (error) {
      console.error("Error marking as completed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <button
        disabled
        className="px-4 py-2 text-xs font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-2"
      >
        <Loader2 size={14} className="animate-spin" />
        Memuat...
      </button>
    );
  }

  return (
    <button
      onClick={handleMarkCompleted}
      disabled={isCompleted || isLoading}
      className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${
        isCompleted
          ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300 cursor-default"
          : isLoading
          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
          : "bg-white text-emerald-600 border-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400 active:scale-95"
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          Menyimpan...
        </>
      ) : isCompleted ? (
        <>
          <CheckCircle2 size={14} fill="currentColor" />
          Sudah Dicoba ✓
        </>
      ) : (
        <>
          <CheckCircle2 size={14} />
          Tandai Sudah Coba
        </>
      )}
    </button>
  );
}
