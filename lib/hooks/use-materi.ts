"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Materi {
  id: string;
  mapel_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  created_by: string;
  created_at: string;
  mapel: {
    id: string;
    name: string;
  };
  created_by_profile: {
    id: string;
    full_name: string | null;
  };
  _count: {
    babs: number;
  };
}

export function useMateri(mapelId?: string) {
  return useQuery({
    queryKey: ["materi", mapelId],
    queryFn: async (): Promise<Materi[]> => {
      const url = mapelId
        ? `/api/guru/materi?mapel_id=${mapelId}`
        : "/api/guru/materi";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch materi");
      const result = await response.json();
      return result.data || result || [];
    },
  });
}

export function useMateriDetail(materiId: string) {
  return useQuery({
    queryKey: ["materi", materiId],
    queryFn: async (): Promise<Materi> => {
      const response = await fetch(`/api/guru/materi?id=${materiId}`);
      if (!response.ok) throw new Error("Failed to fetch materi");
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data[0] : data;
    },
    enabled: !!materiId,
  });
}

export function useCreateMateri() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      mapel_id: string;
      title: string;
      description?: string;
      thumbnail_url?: string;
    }) => {
      const response = await fetch("/api/guru/materi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create materi");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materi"] });
    },
  });
}

export function useUpdateMateri() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      mapel_id: string;
      title: string;
      description?: string;
      thumbnail_url?: string;
    }) => {
      const response = await fetch("/api/guru/materi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) throw new Error("Failed to update materi");
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["materi"] });
      queryClient.invalidateQueries({ queryKey: ["materi", variables.id] });
    },
  });
}

export function useDeleteMateri() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/guru/materi?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete materi");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materi"] });
    },
  });
}
