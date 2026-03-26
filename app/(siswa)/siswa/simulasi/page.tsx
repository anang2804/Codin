"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Microscope, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { SIMULATION_SECTIONS } from "@/lib/simulation-catalog";

function isKelasX(kelas: string | null | undefined) {
  const normalized = (kelas || "").trim().toUpperCase();
  if (!normalized) return false;

  const startsWithX = /^X(\b|[\s/-])/.test(normalized);
  const startsWithXI = /^XI(\b|[\s/-])/.test(normalized);
  const startsWithXII = /^XII(\b|[\s/-])/.test(normalized);

  return startsWithX && !startsWithXI && !startsWithXII;
}

export default function SiswaSimulasiPage() {
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);
  const [canAccessSimulasi, setCanAccessSimulasi] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [completedSimulasi, setCompletedSimulasi] = useState<
    Record<string, { completed: boolean; completed_at: string | null }>
  >({});

  useEffect(() => {
    const checkKelasAccess = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setCanAccessSimulasi(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("kelas")
          .eq("id", user.id)
          .single();

        setCanAccessSimulasi(isKelasX(profile?.kelas));
      } catch (error) {
        console.error("Error checking simulasi access:", error);
        setCanAccessSimulasi(false);
      } finally {
        setIsLoadingAccess(false);
      }
    };

    checkKelasAccess();
  }, []);

  useEffect(() => {
    if (isLoadingAccess || !canAccessSimulasi) {
      return;
    }

    let isActive = true;

    const fetchSimulationCompletion = async () => {
      try {
        const response = await fetch("/api/siswa/simulasi/check-completed", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (isActive) {
          setCompletedSimulasi(data.items || {});
        }
      } catch (error) {
        console.error("Error fetching simulation completion list:", error);
      }
    };

    fetchSimulationCompletion();

    return () => {
      isActive = false;
    };
  }, [isLoadingAccess, canAccessSimulasi]);

  useEffect(() => {
    if (!isLoadingAccess && canAccessSimulasi) {
      const timer = window.setTimeout(() => setAnimateIn(true), 40);
      return () => window.clearTimeout(timer);
    }
  }, [isLoadingAccess, canAccessSimulasi]);

  if (isLoadingAccess) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!canAccessSimulasi) {
    return (
      <Card className="border border-amber-100 bg-amber-50/70 p-6">
        <h1 className="text-xl font-semibold text-amber-900">
          Simulasi khusus Kelas X
        </h1>
        <p className="mt-2 text-sm text-amber-800">
          Fitur simulasi saat ini hanya tersedia untuk siswa kelas X.
        </p>
      </Card>
    );
  }

  const simulationSections = SIMULATION_SECTIONS;

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case "Dasar":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      case "Menengah":
        return "bg-sky-50 text-sky-700 border border-sky-100";
      case "Lanjutan":
        return "bg-rose-50 text-rose-700 border border-rose-100";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  const getStatusBadgeClass = (completed: boolean) => {
    return completed
      ? "rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-100"
      : "rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 border border-amber-100";
  };

  const getLevelRank = (level: string) => {
    switch (level) {
      case "Dasar":
        return 0;
      case "Menengah":
        return 1;
      case "Lanjutan":
        return 2;
      default:
        return 99;
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Microscope className="text-primary" size={28} />
            Simulasi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Simulasi interaktif untuk memahami algoritma dan pemrograman
          </p>
        </div>
      </div>

      {simulationSections.map((section, sectionIndex) => (
        <section key={section.title} className="space-y-4">
          {(() => {
            const sortedItems = [...section.items].sort((a, b) => {
              const rankDiff = getLevelRank(a.level) - getLevelRank(b.level);
              if (rankDiff !== 0) return rankDiff;
              return a.title.localeCompare(b.title);
            });

            return (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    {section.title}
                  </h2>
                  <span
                    className={`text-[11px] px-2 py-1 rounded-full font-medium ${section.badgeClass}`}
                  >
                    {section.items.length} simulasi
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedItems.map((item, itemIndex) => {
                    const isCompleted = Boolean(
                      completedSimulasi[item.slug]?.completed,
                    );

                    return (
                      <Card
                        key={item.href}
                        className={`overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex h-full flex-col ${
                          animateIn
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-3"
                        }`}
                        style={{
                          transitionDelay: `${sectionIndex * 120 + itemIndex * 60}ms`,
                        }}
                      >
                        <div
                          className={`h-24 bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-4xl">{item.emoji}</div>
                            <div className="flex gap-1.5">
                              <div
                                className={`w-4 h-4 border-2 ${item.accent} rounded-full bg-background`}
                              />
                              <div
                                className={`w-4 h-4 border-2 ${item.accent} rounded bg-background`}
                              />
                              <div
                                className={`w-4 h-4 border-2 ${item.accent} rotate-45 bg-background`}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col p-4">
                          <div className="space-y-3 flex-1">
                            <div className="space-y-1.5">
                              <h3 className="text-base font-semibold text-foreground leading-snug line-clamp-2">
                                {item.title}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                {item.description}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`rounded-full px-2 py-1 text-[11px] font-medium ${getLevelBadgeClass(item.level)}`}
                              >
                                Level {item.level}
                              </span>
                              <span
                                className={getStatusBadgeClass(isCompleted)}
                              >
                                {isCompleted ? "Sudah dicoba" : "Belum dicoba"}
                              </span>
                            </div>
                          </div>

                          <Button
                            onClick={() => {
                              window.location.href = item.href;
                            }}
                            className="mt-auto w-full h-9 bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-all duration-200 hover:shadow-md"
                          >
                            Mulai Simulasi
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </section>
      ))}
    </div>
  );
}
