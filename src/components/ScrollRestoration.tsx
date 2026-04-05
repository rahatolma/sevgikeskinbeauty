"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    // Next.js App Router ile global 'scroll-behavior: smooth' çakışmasını çözer.
    // Sadece path değiştiğinde anında yukarı zıplamayı zorlar, böylece sayfa ortada kalmaz.
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname]);

  return null;
}
