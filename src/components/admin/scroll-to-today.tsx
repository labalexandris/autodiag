"use client";

import { useEffect } from "react";

/** Στο κινητό η λίστα του μήνα ανοίγει στη σημερινή μέρα (αν είναι αυτός ο μήνας). */
export function ScrollToToday() {
  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) return;
    document.getElementById("today")?.scrollIntoView({ block: "start" });
  }, []);
  return null;
}
