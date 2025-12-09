"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Bab {
  id: string;
  materi_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  sub_babs?: Array<{
    id: string;
    bab_id: string;
    title: string;
    content_type: "text" | "video" | "file" | "link";
    content: string | null;
    content_url: string | null;
    duration: number | null;
    order_index: number;
    created_at: string;
  }>;
}

export function useBabs(materiId: string) {
  return useQuery({
    queryKey: ["babs", materiId],
    queryFn: async (): Promise<Bab[]> => {
      const response = await fetch(`/api/guru/bab?materi_id=${materiId}`);
      if (!response.ok) throw new Error("Failed to fetch babs");
      const json = await response.json();
      return json.data || [];
    },
    enabled: !!materiId,
  });
}

export function useCreateBab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      materi_id: string;
      title: string;
      description?: string;
    }) => {
      const response = await fetch("/api/guru/bab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create bab");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["babs", variables.materi_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["materi", variables.materi_id],
      });
    },
  });
}

export function useUpdateBab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      materi_id,
      ...data
    }: {
      id: string;
      materi_id: string;
      title: string;
      description?: string;
    }) => {
      const response = await fetch("/api/guru/bab", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) throw new Error("Failed to update bab");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["babs", variables.materi_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["materi", variables.materi_id],
      });
    },
  });
}

export function useDeleteBab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      materi_id,
    }: {
      id: string;
      materi_id: string;
    }) => {
      const response = await fetch(`/api/guru/bab?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete bab");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["babs", variables.materi_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["materi", variables.materi_id],
      });
    },
  });
}
