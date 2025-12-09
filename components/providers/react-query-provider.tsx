"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // Data fresh selama 5 menit (lebih lama)
            gcTime: 10 * 60 * 1000, // Cache disimpan 10 menit
            refetchOnWindowFocus: false, // Tidak refetch saat switch tab
            refetchOnMount: false, // Tidak refetch saat component mount jika masih fresh
            retry: 2, // Retry 2x jika gagal
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
