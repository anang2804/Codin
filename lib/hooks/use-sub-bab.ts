"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface SubBab {
  id: string;
  bab_id: string;
  title: string;
  content_type: "text" | "video" | "file" | "link";
  content: string | null;
  content_url: string | null;
  order_index: number;
  created_at: string;
}

export function useSubBabs(babId: string) {
  return useQuery({
    queryKey: ["sub-babs", babId],
    queryFn: async (): Promise<SubBab[]> => {
      const response = await fetch(`/api/guru/sub-bab?bab_id=${babId}`);
      if (!response.ok) throw new Error("Failed to fetch sub-babs");
      const json = await response.json();
      return json.data || [];
    },
    enabled: !!babId,
  });
}

export function useCreateSubBab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      bab_id: string;
      title: string;
      content_type: "text" | "video" | "file" | "link";
      content?: string;
      content_url?: string;
    }) => {
      const response = await fetch("/api/guru/sub-bab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create sub-bab");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sub-babs", variables.bab_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["babs"],
      });
    },
  });
}

export function useUpdateSubBab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      bab_id,
      ...data
    }: {
      id: string;
      bab_id: string;
      title: string;
      content_type: "text" | "video" | "file" | "link";
      content?: string;
      content_url?: string;
    }) => {
      const response = await fetch("/api/guru/sub-bab", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) throw new Error("Failed to update sub-bab");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sub-babs", variables.bab_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["babs"],
      });
    },
  });
}

export function useDeleteSubBab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bab_id }: { id: string; bab_id: string }) => {
      const response = await fetch(`/api/guru/sub-bab?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete sub-bab");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sub-babs", variables.bab_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["babs"],
      });
    },
  });
}
