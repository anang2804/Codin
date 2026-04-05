"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, Lightbulb, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ONBOARDING_KEY_PREFIX = "simulasi-onboarding-seen:v2";
const BASIC_LEVEL_PATHS = new Set([
  "/siswa/simulasi/traffic-logic",
  "/siswa/simulasi/kasir-kantin",
  "/siswa/simulasi/beli-di-kasir",
]);

const MATERIAL_BY_PATH: Record<string, "diagram-alir" | "ipo" | "pseudocode"> =
  {
    "/siswa/simulasi/traffic-logic": "diagram-alir",
    "/siswa/simulasi/kasir-kantin": "ipo",
    "/siswa/simulasi/beli-di-kasir": "pseudocode",
  };

const MATERIAL_COPY: Record<string, { intro: string; focus: string }> = {
  "/siswa/simulasi/traffic-logic": {
    intro: "Materi aktif saat ini: Diagram Alir Dasar.",
    focus:
      "Susun alur logika lalu lintas dari awal sampai akhir dengan urutan langkah yang tepat.",
  },
  "/siswa/simulasi/kasir-kantin": {
    intro: "Materi aktif saat ini: Struktur Program (IPO).",
    focus:
      "Lengkapi bagian Input, Process, dan Output pada simulasi kasir kantin secara berurutan.",
  },
  "/siswa/simulasi/beli-di-kasir": {
    intro: "Materi aktif saat ini: Pseudocode Dasar.",
    focus:
      "Selesaikan langkah pseudocode beli di kasir sampai menghasilkan total belanja yang sesuai.",
  },
};

type TutorialStep = {
  kind: "fill-blank" | "run";
  instruction: string;
};

const TUTORIAL_STEPS_BY_PATH: Record<string, TutorialStep[]> = {
  "/siswa/simulasi/traffic-logic": [
    {
      kind: "fill-blank",
      instruction:
        "Seret simbol dari Bank Simbol ke semua slot flowchart sampai seluruh alur terisi.",
    },
    {
      kind: "run",
      instruction:
        "Bagus. Sekarang tekan tombol Jalankan untuk mencoba alur diagram yang sudah kamu susun.",
    },
  ],
  "/siswa/simulasi/kasir-kantin": [
    {
      kind: "fill-blank",
      instruction:
        "Isi bagian kosong (_____) terlebih dahulu dengan command yang sesuai.",
    },
    {
      kind: "run",
      instruction:
        "Bagus. Sekarang tekan tombol Jalankan untuk mengecek hasil simulasi.",
    },
  ],
  "/siswa/simulasi/beli-di-kasir": [
    {
      kind: "fill-blank",
      instruction:
        "Isi bagian kosong (_____) terlebih dahulu sesuai urutan input dan output.",
    },
    {
      kind: "run",
      instruction:
        "Setelah itu tekan tombol Jalankan untuk menguji hasil perhitungan total.",
    },
  ],
};

const ALLOWED_COMMAND_KEYWORDS = new Set([
  "input",
  "proses",
  "process",
  "output",
  "if",
  "else",
]);

function getNodeText(node: Node | null): string {
  if (!node || !(node instanceof HTMLElement)) return "";
  return (node.innerText || node.textContent || "").trim().toLowerCase();
}

function isVisible(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function getBlankCandidates() {
  const scope = getMainAlgoContainer();
  if (!scope) return [];

  const nodes = Array.from(
    scope.querySelectorAll<HTMLElement>("button, [role='button'], span, div"),
  );

  return nodes.filter((el) => {
    const text = (el.innerText || el.textContent || "").trim();
    return /^_{3,}/.test(text) && isVisible(el);
  });
}

function getUnfilledCommandButtons() {
  const scope = getMainAlgoContainer();
  if (!scope) return [];

  const nodes = Array.from(scope.querySelectorAll<HTMLElement>("button"));

  return nodes.filter((el) => {
    if (!isVisible(el)) return false;

    const text = (el.innerText || el.textContent || "").trim().toLowerCase();
    const isCommandText =
      ALLOWED_COMMAND_KEYWORDS.has(text) || /^_{3,}/.test(text);
    if (!isCommandText) return false;

    const className = typeof el.className === "string" ? el.className : "";
    const isGhostByClass = className.includes("italic");
    const isGhostByStyle = window.getComputedStyle(el).fontStyle === "italic";

    return isGhostByClass || isGhostByStyle;
  });
}

function getUnfilledPlaceholderCount() {
  const buttonCandidates = getUnfilledCommandButtons();
  if (buttonCandidates.length > 0) return buttonCandidates.length;

  const scope = getMainAlgoContainer();
  if (!scope) return 0;

  const panelText = (scope.innerText || scope.textContent || "").toLowerCase();
  const lines = panelText
    .split("\n")
    .map((line) => line.replace(/^\s*\d+\s*/, "").trim())
    .filter(Boolean);

  let unfilledCount = 0;
  for (const line of lines) {
    if (/(?:^|\s)[-_–—]{3,}(?:\s+[a-z_]+)?(?:\s|$)/i.test(line)) {
      unfilledCount += 1;
    }
  }

  return unfilledCount;
}

function normalizeTutorialLine(line: string) {
  return line.trim().toLowerCase().replace(/\s+/g, " ");
}

function isBeliDiKasirFillStepComplete() {
  const textarea = document.querySelector<HTMLTextAreaElement>(
    "#line-gutter ~ div textarea, textarea",
  );
  if (!textarea) return false;

  const lines = (textarea.value || "").split("\n").map(normalizeTutorialLine);
  return (
    lines[0] === "start" &&
    lines[1] === "input harga_barang" &&
    lines[2] === "input jumlah_barang" &&
    lines[4] === "total = harga_barang * jumlah_barang" &&
    lines[6] === "output total" &&
    lines[7] === "end"
  );
}

function isTrafficLogicFillStepComplete() {
  const placedSymbols = document.querySelectorAll("div.cursor-move").length;
  return placedSymbols >= 6;
}

function isFillBlankStepComplete(pathname: string | null) {
  if (pathname === "/siswa/simulasi/traffic-logic") {
    return isTrafficLogicFillStepComplete();
  }

  if (pathname === "/siswa/simulasi/beli-di-kasir") {
    return isBeliDiKasirFillStepComplete();
  }

  return getUnfilledPlaceholderCount() === 0;
}

function getMainAlgoContainer() {
  const lineGutter = document.getElementById("line-gutter");
  if (lineGutter) {
    let current: HTMLElement | null = lineGutter as HTMLElement;
    while (current) {
      if (isVisible(current)) {
        const rect = current.getBoundingClientRect();
        const radius = Number.parseFloat(
          window.getComputedStyle(current).borderTopLeftRadius || "0",
        );

        const isReasonableEditorSize =
          rect.width >= 420 &&
          rect.width <= window.innerWidth * 0.9 &&
          rect.height >= 260 &&
          rect.height <= window.innerHeight * 0.9;

        if (isReasonableEditorSize && radius >= 8) {
          return current;
        }
      }

      current = current.parentElement;
    }
  }

  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>("span, div, p"),
  );
  for (const node of nodes) {
    const text = (node.innerText || node.textContent || "")
      .trim()
      .toLowerCase();
    if (text !== "main.algo" && text !== "main algo") continue;

    let current: HTMLElement | null = node;
    while (current) {
      if (isVisible(current)) {
        const rect = current.getBoundingClientRect();
        const radius = Number.parseFloat(
          window.getComputedStyle(current).borderTopLeftRadius || "0",
        );
        const isReasonableEditorSize =
          rect.width >= 420 &&
          rect.width <= window.innerWidth * 0.9 &&
          rect.height >= 260 &&
          rect.height <= window.innerHeight * 0.9;

        if (isReasonableEditorSize && radius >= 8) {
          return current;
        }
      }
      current = current.parentElement;
    }
  }

  return null;
}

function getBoundingRectFromElements(elements: HTMLElement[]) {
  if (!elements.length) return null;

  let top = Number.POSITIVE_INFINITY;
  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (const el of elements) {
    const rect = el.getBoundingClientRect();
    top = Math.min(top, rect.top);
    left = Math.min(left, rect.left);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }

  return {
    top,
    left,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function getRunButton() {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>("button, [role='button']"),
  );

  return (
    nodes.find((el) => getNodeText(el).includes("jalankan") && isVisible(el)) ??
    null
  );
}

function findKeywordTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  let current: HTMLElement | null = target;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    const text = getNodeText(current);
    if (ALLOWED_COMMAND_KEYWORDS.has(text)) return true;
    current = current.parentElement;
  }

  return false;
}

function isSuccessStateVisible() {
  const pageText = (document.body?.innerText || "").toLowerCase();
  const normalizedText = pageText.replace(/\s+/g, " ").trim();
  return (
    normalizedText.includes("berhasil! algoritma benar") ||
    normalizedText.includes("algoritma berjalan sesuai urutan input") ||
    normalizedText.includes("simulasi berhasil! flowchart kamu sudah benar") ||
    normalizedText.includes("berhasil! diagram alir benar") ||
    normalizedText.includes("logic log: selesai") ||
    normalizedText.includes("sukses: algoritma berhasil dijalankan")
  );
}

export default function SimulasiOnboarding({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasStartedTutorial, setHasStartedTutorial] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const [initialBlankCount, setInitialBlankCount] = useState<number | null>(
    null,
  );
  const [hasInteractedCurrentStep, setHasInteractedCurrentStep] =
    useState(false);
  const [isSuccessDetected, setIsSuccessDetected] = useState(false);
  const [showOfferPrompt, setShowOfferPrompt] = useState(false);

  const autoAdvancingRef = useRef(false);

  const shouldShowTutorial = useMemo(() => {
    if (!pathname) return false;
    return BASIC_LEVEL_PATHS.has(pathname);
  }, [pathname]);

  const materialCopy = useMemo(() => {
    if (!pathname) return null;
    return MATERIAL_COPY[pathname] ?? null;
  }, [pathname]);

  const onboardingKey = useMemo(() => {
    if (!pathname) return null;
    const material = MATERIAL_BY_PATH[pathname];
    if (!material) return null;
    return `${ONBOARDING_KEY_PREFIX}:${material}`;
  }, [pathname]);

  const tutorialSteps = useMemo(() => {
    if (!pathname) return [];
    return TUTORIAL_STEPS_BY_PATH[pathname] ?? [];
  }, [pathname]);

  const currentStep =
    hasStartedTutorial && tutorialSteps.length > 0
      ? tutorialSteps[stepIndex] || null
      : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !shouldShowTutorial) {
      setIsSuccessDetected(false);
      return;
    }

    const updateSuccessState = () => {
      setIsSuccessDetected(isSuccessStateVisible());
    };

    updateSuccessState();

    const observer = new MutationObserver(() => {
      updateSuccessState();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [mounted, shouldShowTutorial, pathname]);

  useEffect(() => {
    if (!isSuccessDetected) return;

    setShowOfferPrompt(false);
    setOpen(false);
    setHasStartedTutorial(false);
    setStepIndex(0);
    setTargetRect(null);
  }, [isSuccessDetected]);

  useEffect(() => {
    if (!mounted || !shouldShowTutorial) {
      setShowOfferPrompt(false);
      setOpen(false);
      setTargetRect(null);
      setInitialBlankCount(null);
      setHasInteractedCurrentStep(false);
      setHasStartedTutorial(false);
      setStepIndex(0);
      return;
    }

    if (isSuccessDetected) {
      setShowOfferPrompt(false);
      setOpen(false);
      setTargetRect(null);
      setInitialBlankCount(null);
      setHasInteractedCurrentStep(false);
      setHasStartedTutorial(false);
      setStepIndex(0);
      return;
    }

    setShowOfferPrompt(true);
    setOpen(false);
    setHasStartedTutorial(false);
    setStepIndex(0);
    setTargetRect(null);
    setInitialBlankCount(null);
    setHasInteractedCurrentStep(false);
  }, [mounted, shouldShowTutorial, isSuccessDetected, pathname]);

  const handleClose = () => {
    if (onboardingKey) {
      localStorage.setItem(onboardingKey, "1");
    }
    setTargetRect(null);
    setInitialBlankCount(null);
    setHasInteractedCurrentStep(false);
    setHasStartedTutorial(false);
    setStepIndex(0);
    setOpen(false);
  };

  const handleOpenTutorial = () => {
    setShowOfferPrompt(false);
    setHasStartedTutorial(true);
    setStepIndex(0);
    setTargetRect(null);
    setInitialBlankCount(null);
    setHasInteractedCurrentStep(false);
    setOpen(true);
  };

  const handleAcceptTutorialOffer = () => {
    setShowOfferPrompt(false);
    setHasStartedTutorial(false);
    setStepIndex(0);
    setOpen(true);
  };

  const handleDeclineTutorialOffer = () => {
    setShowOfferPrompt(false);
    setOpen(false);
    setHasStartedTutorial(false);
    setStepIndex(0);
  };

  const handleStartTutorial = () => {
    setHasStartedTutorial(true);
    setStepIndex(0);
    setHasInteractedCurrentStep(false);
    setOpen(false);
  };

  const completeOrNextStep = () => {
    if (autoAdvancingRef.current) return;
    autoAdvancingRef.current = true;

    if (stepIndex >= tutorialSteps.length - 1) {
      window.setTimeout(() => {
        autoAdvancingRef.current = false;
      }, 250);
      handleClose();
      return;
    }

    window.setTimeout(() => {
      setStepIndex((prev) => prev + 1);
      setInitialBlankCount(null);
      setHasInteractedCurrentStep(false);
      autoAdvancingRef.current = false;
    }, 220);
  };

  useEffect(() => {
    if (!hasStartedTutorial || !currentStep || isSuccessDetected) {
      setTargetRect(null);
      return;
    }

    const updateTarget = () => {
      if (currentStep.kind === "fill-blank") {
        const mainAlgoPanel = getMainAlgoContainer();
        if (mainAlgoPanel) {
          const rect = mainAlgoPanel.getBoundingClientRect();
          setTargetRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });
          return;
        }

        setTargetRect(null);
        return;
      }

      const runButton = getRunButton();

      if (!runButton) {
        setTargetRect(null);
        return;
      }

      const rect = runButton.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    if (currentStep.kind === "fill-blank") {
      setInitialBlankCount((prev) => {
        if (prev !== null) return prev;
        return getUnfilledPlaceholderCount();
      });
    } else {
      setInitialBlankCount(null);
    }

    updateTarget();

    const interval = window.setInterval(() => {
      updateTarget();

      if (currentStep.kind === "fill-blank") {
        const isCurrentFillStepComplete = isFillBlankStepComplete(pathname);
        if (
          initialBlankCount !== null &&
          hasInteractedCurrentStep &&
          isCurrentFillStepComplete &&
          !open
        ) {
          completeOrNextStep();
        }
      }

      if (currentStep.kind === "run") {
        const runButton = getRunButton();
        if (!runButton) return;

        if (runButton.hasAttribute("disabled") && !open) {
          completeOrNextStep();
        }
      }
    }, 220);

    const onWindowChange = () => updateTarget();
    window.addEventListener("resize", onWindowChange);
    window.addEventListener("scroll", onWindowChange, true);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("resize", onWindowChange);
      window.removeEventListener("scroll", onWindowChange, true);
    };
  }, [
    currentStep,
    hasStartedTutorial,
    initialBlankCount,
    hasInteractedCurrentStep,
    isSuccessDetected,
    open,
    stepIndex,
  ]);

  useEffect(() => {
    if (!hasStartedTutorial || !currentStep || open || isSuccessDetected)
      return;

    const blockOutsideStep = (event: Event) => {
      const target = event.target;

      if (
        target instanceof HTMLElement &&
        target.closest("[data-simulasi-tutorial-ui='true']")
      ) {
        return;
      }

      if (currentStep.kind === "fill-blank") {
        if (pathname === "/siswa/simulasi/traffic-logic") {
          return;
        }

        if (target instanceof HTMLElement && target.closest("textarea")) {
          return;
        }

        const blankTarget = getBlankCandidates()[0] || null;
        if (
          blankTarget &&
          target instanceof Node &&
          blankTarget.contains(target)
        ) {
          setHasInteractedCurrentStep(true);
          return;
        }

        if (findKeywordTarget(target)) {
          setHasInteractedCurrentStep(true);
          return;
        }
      }

      if (currentStep.kind === "run") {
        const runButton = getRunButton();
        if (runButton && target instanceof Node && runButton.contains(target)) {
          return;
        }
      }

      event.preventDefault();
      event.stopPropagation();
    };

    const onRunClickAutoNext = (event: Event) => {
      if (currentStep.kind !== "run") return;
      const runButton = getRunButton();
      if (!runButton || !(event.target instanceof Node)) return;
      if (!runButton.contains(event.target)) return;

      window.setTimeout(() => {
        completeOrNextStep();
      }, 180);
    };

    document.addEventListener("pointerdown", blockOutsideStep, true);
    document.addEventListener("click", blockOutsideStep, true);
    document.addEventListener("click", onRunClickAutoNext, true);

    const onTrafficDragInteraction = () => {
      if (
        pathname === "/siswa/simulasi/traffic-logic" &&
        currentStep.kind === "fill-blank"
      ) {
        setHasInteractedCurrentStep(true);
      }
    };

    document.addEventListener("dragstart", onTrafficDragInteraction, true);
    document.addEventListener("drop", onTrafficDragInteraction, true);

    const textarea = document.querySelector<HTMLTextAreaElement>(
      "#line-gutter ~ div textarea, textarea",
    );
    const onTextareaInput = () => {
      if (currentStep.kind === "fill-blank") {
        setHasInteractedCurrentStep(true);
      }
    };
    textarea?.addEventListener("input", onTextareaInput);

    return () => {
      document.removeEventListener("pointerdown", blockOutsideStep, true);
      document.removeEventListener("click", blockOutsideStep, true);
      document.removeEventListener("click", onRunClickAutoNext, true);
      document.removeEventListener("dragstart", onTrafficDragInteraction, true);
      document.removeEventListener("drop", onTrafficDragInteraction, true);
      textarea?.removeEventListener("input", onTextareaInput);
    };
  }, [currentStep, hasStartedTutorial, open, isSuccessDetected, pathname]);

  return (
    <>
      {children}

      {mounted &&
        shouldShowTutorial &&
        !isSuccessDetected &&
        !showOfferPrompt &&
        !open &&
        !hasStartedTutorial && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenTutorial}
            className="fixed bottom-4 right-4 z-[70] h-8 rounded-full bg-background/95 px-3 text-xs shadow-sm"
          >
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Lihat tutorial lagi
          </Button>
        )}

      {mounted &&
        !isSuccessDetected &&
        hasStartedTutorial &&
        !open &&
        currentStep &&
        targetRect && (
          <div className="fixed inset-0 z-[74] pointer-events-none">
            <div
              className="absolute left-0 right-0 top-0"
              style={{
                height: Math.max(0, targetRect.top - 8),
                backgroundColor:
                  currentStep.kind === "fill-blank"
                    ? "rgba(107,114,128,0.40)"
                    : "rgba(107,114,128,0.52)",
              }}
            />
            <div
              className="absolute left-0"
              style={{
                top: Math.max(0, targetRect.top - 8),
                width: Math.max(0, targetRect.left - 8),
                height: Math.max(24, targetRect.height + 16),
                backgroundColor:
                  currentStep.kind === "fill-blank"
                    ? "rgba(107,114,128,0.40)"
                    : "rgba(107,114,128,0.52)",
              }}
            />
            <div
              className="absolute right-0"
              style={{
                top: Math.max(0, targetRect.top - 8),
                left: Math.max(0, targetRect.left + targetRect.width + 8),
                height: Math.max(24, targetRect.height + 16),
                backgroundColor:
                  currentStep.kind === "fill-blank"
                    ? "rgba(107,114,128,0.40)"
                    : "rgba(107,114,128,0.52)",
              }}
            />
            <div
              className="absolute left-0 right-0 bottom-0"
              style={{
                top: Math.max(0, targetRect.top + targetRect.height + 8),
                backgroundColor:
                  currentStep.kind === "fill-blank"
                    ? "rgba(107,114,128,0.40)"
                    : "rgba(107,114,128,0.52)",
              }}
            />
            <div
              className="absolute rounded-xl border-2 border-primary transition-all duration-150"
              style={{
                top: Math.max(8, targetRect.top - 8),
                left: Math.max(8, targetRect.left - 8),
                width: Math.max(24, targetRect.width + 16),
                height: Math.max(24, targetRect.height + 16),
                boxShadow:
                  currentStep.kind === "fill-blank"
                    ? "0 0 0 3px rgba(255,255,255,0.26), 0 0 18px rgba(34,197,94,0.28)"
                    : "0 0 0 4px rgba(255,255,255,0.32), 0 0 22px rgba(34,197,94,0.35)",
              }}
            />
          </div>
        )}

      {mounted &&
        shouldShowTutorial &&
        !isSuccessDetected &&
        hasStartedTutorial &&
        !open &&
        currentStep && (
          <div
            data-simulasi-tutorial-ui="true"
            className={`fixed bottom-4 z-[75] w-[min(92vw,380px)] rounded-xl border border-border bg-card/95 p-3 shadow-md backdrop-blur ${
              pathname === "/siswa/simulasi/traffic-logic"
                ? "left-1/2 -translate-x-1/2"
                : "left-4"
            }`}
          >
            <p className="text-xs font-medium text-muted-foreground">
              Langkah{" "}
              {Math.min(stepIndex + 1, Math.max(tutorialSteps.length, 1))} dari{" "}
              {Math.max(tutorialSteps.length, 1)}
            </p>
            <p className="mt-1 text-sm text-foreground">
              {currentStep.instruction}
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={handleOpenTutorial}>
                Lihat petunjuk
              </Button>
              <Button size="sm" variant="outline" onClick={handleClose}>
                Lewati Tutorial
              </Button>
            </div>
          </div>
        )}

      {mounted && !isSuccessDetected && open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/75 backdrop-blur-sm" />

          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <BookOpen className="h-5 w-5" />
              <h2 className="text-lg font-semibold text-foreground">
                Tutorial Singkat Simulasi
              </h2>
            </div>

            <p className="mb-4 text-sm leading-6 text-muted-foreground">
              {materialCopy?.intro ?? "Materi simulasi dasar sedang dimuat."}
            </p>

            <div className="mb-5 space-y-2 rounded-xl bg-muted/60 p-4 text-sm text-foreground/90">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-4 w-4 text-amber-500" />
                <span>
                  {hasStartedTutorial
                    ? (currentStep?.instruction ??
                      "Ikuti langkah tutorial sesuai instruksi yang tampil.")
                    : (materialCopy?.focus ??
                      "Ikuti instruksi sesuai langkah materi yang sedang dibuka.")}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-4 w-4 text-amber-500" />
                <span>
                  {hasStartedTutorial
                    ? `Langkah ${Math.min(stepIndex + 1, Math.max(tutorialSteps.length, 1))} dari ${Math.max(tutorialSteps.length, 1)}`
                    : "Tutorial ini muncul sekali saat pertama masuk materi ini."}
                </span>
              </div>
              {hasStartedTutorial && (
                <div className="flex items-start gap-2">
                  <Lightbulb className="mt-0.5 h-4 w-4 text-amber-500" />
                  <span>
                    Area yang di-highlight adalah langkah aktif. Selesaikan
                    langkah itu dulu untuk lanjut otomatis.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              {!hasStartedTutorial ? (
                <>
                  <Button variant="outline" onClick={handleClose}>
                    Lewati
                  </Button>
                  <Button onClick={handleStartTutorial} className="gap-2">
                    <PlayCircle className="h-4 w-4" />
                    Mulai Tutorial
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Lanjutkan Tutorial
                  </Button>
                  <Button onClick={handleClose} className="gap-2">
                    Selesai Tutorial
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {mounted &&
        shouldShowTutorial &&
        !isSuccessDetected &&
        showOfferPrompt && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
            <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <BookOpen className="h-5 w-5" />
                <h3 className="text-base font-semibold text-foreground">
                  Mau lihat tutorial simulasi?
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Kamu bisa ikuti panduan langkah demi langkah sebelum mulai.
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button variant="outline" onClick={handleDeclineTutorialOffer}>
                  Nanti
                </Button>
                <Button onClick={handleAcceptTutorialOffer} className="gap-2">
                  <PlayCircle className="h-4 w-4" />
                  Lihat Tutorial
                </Button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
