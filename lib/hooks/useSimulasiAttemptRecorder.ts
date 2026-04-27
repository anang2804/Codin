import { useEffect, useRef } from "react";

type AttemptResult = "success" | "failed";

type UseSimulasiAttemptRecorderArgs = {
  simulasiSlug: string;
  isRunning: boolean;
  isSuccess: boolean;
};

/**
 * Record one attempt whenever a simulation run starts and then stops.
 * The backend skips counting if the simulation has been marked completed.
 */
export function useSimulasiAttemptRecorder({
  simulasiSlug,
  isRunning,
  isSuccess,
}: UseSimulasiAttemptRecorderArgs) {
  const prevIsRunningRef = useRef(false);
  const pendingRunRef = useRef(false);

  useEffect(() => {
    const wasRunning = prevIsRunningRef.current;

    if (!wasRunning && isRunning) {
      pendingRunRef.current = true;
    }

    if (wasRunning && !isRunning && pendingRunRef.current) {
      pendingRunRef.current = false;
      const result: AttemptResult = isSuccess ? "success" : "failed";

      void fetch("/api/siswa/simulasi/record-attempt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          simulasi_slug: simulasiSlug,
          result,
        }),
      }).catch((error) => {
        console.error("Error recording simulation attempt:", error);
      });
    }

    prevIsRunningRef.current = isRunning;
  }, [isRunning, isSuccess, simulasiSlug]);
}
