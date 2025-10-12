"use client";

import { useRouter } from "next/navigation";
import { HeroUIProvider, ToastProvider } from "@heroui/react";

export function HeroProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <HeroUIProvider navigate={router.push}>
      <ToastProvider />
      {children}
    </HeroUIProvider>
  );
}
