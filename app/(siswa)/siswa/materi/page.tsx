"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Calendar, Search, Filter, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Materi {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  mapel_id?: string;
  created_by?: string;
  created_at: string;
  mapel?: {
    id: string;
    name: string;
  };
  profiles?: {
    full_name: string;
  };
  progress?: number; // Progress percentage 0-100
}

export default function SiswaMateriPage() {
  const [materi, setMateri] = useState<Materi[]>([]);
  const [filteredMateri, setFilteredMateri] = useState<Materi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMapel, setSelectedMapel] = useState<string>("all");
  const [mapelList, setMapelList] = useState<any[]>([]);
  const [animateCards, setAnimateCards] = useState(false);

  useEffect(() => {
    fetchMateri();

    // Refresh progress when user returns to this page
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchMateri();
      }
    };

    // Listen for progress updates from detail page
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "materi_progress_updated") {
        fetchMateri();
        // Clear the flag
        localStorage.removeItem("materi_progress_updated");
      }
    };

    // Listen for custom progress update event
    const handleProgressUpdate = () => {
      fetchMateri();
    };

    // Refresh when page becomes visible (user comes back from detail page)
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Also refresh on focus (when user switches back to tab)
    window.addEventListener("focus", fetchMateri);

    // Listen for storage events (cross-tab/page communication)
    window.addEventListener("storage", handleStorageChange);

    // Listen for custom event (same-page communication)
    window.addEventListener("progressUpdated", handleProgressUpdate);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", fetchMateri);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("progressUpdated", handleProgressUpdate);
    };
  }, []);

  useEffect(() => {
    filterMateri();
  }, [searchTerm, selectedMapel, materi]);

  useEffect(() => {
    if (!loading) {
      const timer = window.setTimeout(() => setAnimateCards(true), 50);
      return () => window.clearTimeout(timer);
    }
  }, [loading]);

  const toProgressValue = (value: unknown) => {
    if (typeof value === "number") {
      if (Number.isNaN(value)) return 0;
      return Math.min(100, Math.max(0, Math.round(value)));
    }

    if (typeof value === "string") {
      const parsed = Number.parseFloat(value.replace("%", ""));
      if (Number.isNaN(parsed)) return 0;
      return Math.min(100, Math.max(0, Math.round(parsed)));
    }

    return 0;
  };

  const fetchMateri = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch materi data
      const { data: materiData, error: materiError } = await supabase
        .from("materi")
        .select("*")
        .order("created_at", { ascending: false });

      if (materiError) throw materiError;

      // Fetch all progress for this user
      const progressResponse = await fetch("/api/siswa/materi-progress");
      const progressData = await progressResponse.json();
      const progressMap = new Map(
        (progressData.data || []).map((p: any) => [
          p.materi_id,
          p.progress_percentage,
        ]),
      );

      // Fetch related data separately
      if (materiData && materiData.length > 0) {
        const mapelIds = [
          ...new Set(materiData.map((m) => m.mapel_id).filter(Boolean)),
        ];
        const creatorIds = [
          ...new Set(materiData.map((m) => m.created_by).filter(Boolean)),
        ];

        // Fetch mapel data
        const { data: mapelData } = await supabase
          .from("mapel")
          .select("id, name")
          .in("id", mapelIds);

        // Fetch profiles data
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", creatorIds);

        // Merge data with real progress from database
        const enrichedData = materiData.map((materi) => ({
          ...materi,
          mapel: mapelData?.find((m) => m.id === materi.mapel_id) || null,
          profiles:
            profilesData?.find((p) => p.id === materi.created_by) || null,
          progress: toProgressValue(progressMap.get(materi.id)),
        }));

        setMateri(enrichedData);
        setFilteredMateri(enrichedData);

        // Get unique mapel untuk filter
        const uniqueMapel = mapelData || [];
        setMapelList(uniqueMapel);
      } else {
        setMateri([]);
        setFilteredMateri([]);
        setMapelList([]);
      }
    } catch (error) {
      console.error("Error fetching materi:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterMateri = () => {
    let filtered = [...materi];

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title?.toLowerCase().includes(term) ||
          m.description?.toLowerCase().includes(term) ||
          m.mapel?.name?.toLowerCase().includes(term),
      );
    }

    // Filter by mapel
    if (selectedMapel !== "all") {
      filtered = filtered.filter((m) => m.mapel_id === selectedMapel);
    }

    setFilteredMateri(filtered);
  };

  const handleViewMateri = (materiId: string) => {
    // Navigate to materi detail page
    window.location.href = `/siswa/materi/${materiId}`;
  };

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground dark:text-gray-100 leading-tight">
            Materi Pembelajaran
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground dark:text-gray-400 mt-0.5">
            Akses semua materi pembelajaran yang tersedia
          </p>
          <p className="mt-1 text-xs text-muted-foreground dark:text-gray-400 md:hidden">
            {filteredMateri.length} materi tersedia
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <BookOpen className="text-green-600" size={24} />
          <span className="text-xl font-bold text-green-600">
            {filteredMateri.length}
          </span>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="p-3 md:p-4 border border-border dark:border-gray-800 bg-card dark:bg-card rounded-xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-gray-500"
              size={18}
            />
            <Input
              type="text"
              placeholder="Cari materi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 border-border dark:border-gray-700 focus:border-green-400 dark:focus:border-green-600"
            />
          </div>
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-gray-500"
              size={18}
            />
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full pl-10 h-9 rounded-md border border-input dark:border-gray-700 bg-background dark:bg-input px-3 py-2 text-sm dark:text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">Semua Mata Pelajaran</option>
              {mapelList.map((mapel) => (
                <option key={mapel.id} value={mapel.id}>
                  {mapel.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-gray-400">
            Memuat materi...
          </p>
        </div>
      ) : filteredMateri.length === 0 ? (
        <Card className="p-12 text-center border-green-100 dark:border-green-900/50 bg-card">
          <BookOpen
            size={48}
            className="mx-auto text-muted-foreground dark:text-gray-600 mb-4"
          />
          <p className="text-muted-foreground dark:text-gray-400">
            {searchTerm || selectedMapel !== "all"
              ? "Tidak ada materi yang cocok dengan pencarian"
              : "Belum ada materi tersedia"}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 auto-rows-fr">
          {filteredMateri.map((m, index) =>
            (() => {
              const progressValue = toProgressValue(m.progress);

              return (
                <Card
                  key={m.id}
                  className={`overflow-hidden border-border dark:border-gray-800 bg-card dark:bg-card rounded-xl shadow-sm hover:shadow-md hover:-translate-y-[5px] transition-all duration-200 cursor-pointer flex flex-col ${animateCards ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
                  style={{ transitionDelay: `${index * 60}ms` }}
                  onClick={() => handleViewMateri(m.id)}
                >
                  {/* Thumbnail */}
                  <div className="relative h-24 md:h-20 bg-gradient-to-br from-green-100 dark:from-green-900/40 to-green-200 dark:to-green-900/30 overflow-hidden flex-shrink-0">
                    {m.thumbnail_url ? (
                      <img
                        src={m.thumbnail_url}
                        alt={m.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-green-700 text-center p-2">
                          <BookOpen
                            size={22}
                            className="mx-auto mb-1 opacity-80"
                          />
                          <h3 className="text-xs font-semibold line-clamp-1">
                            {m.title}
                          </h3>
                        </div>
                      </div>
                    )}
                    {/* Progress indicator on thumbnail */}
                    {progressValue > 0 && (
                      <div className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[11px] font-semibold text-green-700 dark:text-green-300">
                        {progressValue}%
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col overflow-hidden">
                    <h3 className="text-sm md:text-base font-semibold text-foreground dark:text-gray-100 mb-1 line-clamp-1">
                      {m.title}
                    </h3>

                    <p className="text-[11px] md:text-xs text-muted-foreground dark:text-gray-400 mb-3 line-clamp-1">
                      {m.mapel?.name || "Mata pelajaran belum tersedia"}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground dark:text-gray-400 font-medium">
                          Progress
                        </span>
                        <span className="font-semibold text-foreground dark:text-gray-100">
                          {progressValue}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-[width] duration-[800ms] ease-out"
                          style={{
                            width: `${animateCards ? progressValue : 0}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] md:text-xs text-muted-foreground dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>
                          {new Date(m.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 h-8 text-xs mt-auto"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewMateri(m.id);
                      }}
                    >
                      Lanjut Belajar
                      <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </Card>
              );
            })(),
          )}
        </div>
      )}
    </div>
  );
}
