"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Guru {
  id: string;
  email: string;
  full_name: string;
  no_telepon?: string;
  created_at: string;
}

export function useGuru() {
  return useQuery({
    queryKey: ["guru"],
    queryFn: async (): Promise<Guru[]> => {
      const response = await fetch("/api/admin/guru");
      if (!response.ok) throw new Error("Failed to fetch guru");
      const result = await response.json();
      return result.data || [];
    },
  });
}

export function useCreateGuru() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      full_name: string;
      email?: string;
      password?: string;
      no_telepon?: string;
    }) => {
      const response = await fetch("/api/admin/guru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create guru");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guru"] });
    },
  });
}

export function useUpdateGuru() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      full_name?: string;
      no_telepon?: string;
    }) => {
      const response = await fetch("/api/admin/guru", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) throw new Error("Failed to update guru");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guru"] });
    },
  });
}

export function useDeleteGuru() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/guru?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete guru");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guru"] });
    },
  });
}
