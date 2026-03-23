import type React from "react";
import SimulasiOnboarding from "@/components/SimulasiOnboarding";

export default function SimulasiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SimulasiOnboarding>{children}</SimulasiOnboarding>;
}
