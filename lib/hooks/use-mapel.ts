"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Mapel {
  id: string;
  name: string;
  description: string | null;
  guru_id: string | null;
  semester?: string | null;
  tahun_ajaran?: string | null;
  created_at: string;
  created_by: string;
  guru?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export function useMapel() {
  return useQuery({
    queryKey: ["mapel"],
    queryFn: async (): Promise<Mapel[]> => {
      const response = await fetch("/api/admin/mapel", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch mapel");
      const result = await response.json();
      return result.data || result || [];
    },
  });
}

export function useCreateMapel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      guru_id?: string;
      semester?: string;
      tahun_ajaran?: string;
    }) => {
      const response = await fetch("/api/admin/mapel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create mapel");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mapel"] });
    },
  });
}

export function useUpdateMapel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name: string;
      description?: string;
      guru_id?: string;
      semester?: string;
      tahun_ajaran?: string;
    }) => {
      const response = await fetch("/api/admin/mapel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) throw new Error("Failed to update mapel");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mapel"] });
    },
  });
}

export function useDeleteMapel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/mapel?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete mapel");
      return response.json();
    },
    onSuccess: (_result, id) => {
      queryClient.setQueryData<Mapel[]>(["mapel"], (old) =>
        old ? old.filter((item) => item.id !== id) : [],
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["mapel"] });
    },
  });
}
