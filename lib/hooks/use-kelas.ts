"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Kelas {
  id: string;
  name: string;
  wali_kelas_id: string | null;
  created_at: string;
}

export function useKelas() {
  return useQuery({
    queryKey: ["kelas"],
    queryFn: async (): Promise<Kelas[]> => {
      const response = await fetch("/api/admin/kelas");
      if (!response.ok) throw new Error("Failed to fetch kelas");
      const result = await response.json();
      return result.data || [];
    },
  });
}

export function useCreateKelas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; wali_kelas_id?: string }) => {
      const response = await fetch("/api/admin/kelas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create kelas");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kelas"] });
    },
  });
}

export function useUpdateKelas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name: string;
      wali_kelas_id?: string;
    }) => {
      const response = await fetch("/api/admin/kelas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) throw new Error("Failed to update kelas");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kelas"] });
    },
  });
}

export function useDeleteKelas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/kelas?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete kelas");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kelas"] });
    },
  });
}
