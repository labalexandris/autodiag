"use client";

import { Link2 } from "lucide-react";
import { toast } from "@/components/toast";

export function ShareButton({ token }: { token: string }) {
  return (
    <button
      className="btn btn-outline"
      onClick={async () => {
        const url = `${window.location.origin}/b/${token}`;
        try {
          await navigator.clipboard.writeText(url);
          toast("Ο σύνδεσμος του βιβλιαρίου αντιγράφηκε");
        } catch {
          window.open(url, "_blank");
        }
      }}
    >
      <Link2 size={16} /> Σύνδεσμος για τον πελάτη
    </button>
  );
}
