"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Siswa {
  id: string;
  email: string;
  full_name: string;
  kelas?: string;
  kelas_id?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  no_telepon?: string;
  alamat?: string;
  created_at: string;
  kelas_info?: {
    id: string;
    name: string;
  };
}

export function useSiswa() {
  return useQuery({
    queryKey: ["siswa"],
    queryFn: async (): Promise<Siswa[]> => {
      const response = await fetch("/api/admin/siswa");
      if (!response.ok) throw new Error("Failed to fetch siswa");
      const result = await response.json();
      return result.data || [];
    },
  });
}

export function useCreateSiswa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      full_name: string;
      email?: string;
      password?: string;
      no_telepon?: string;
      kelas_id?: string;
      tanggal_lahir?: string;
      jenis_kelamin?: string;
      alamat?: string;
    }) => {
      const response = await fetch("/api/admin/siswa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create siswa");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siswa"] });
    },
  });
}

export function useUpdateSiswa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      full_name?: string;
      no_telepon?: string;
      kelas_id?: string;
      tanggal_lahir?: string;
      jenis_kelamin?: string;
      alamat?: string;
    }) => {
      const response = await fetch("/api/admin/siswa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (!response.ok) throw new Error("Failed to update siswa");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siswa"] });
    },
  });
}

export function useDeleteSiswa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/siswa?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete siswa");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siswa"] });
    },
  });
}
