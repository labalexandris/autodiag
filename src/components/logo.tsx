import Image from "next/image";
import { cn } from "@/lib/format";

/*
 * Επίσημο λογότυπο: public/autodiag.png (392×137).
 * Αν έρθει SVG, αλλάζει μόνο το src εδώ.
 */
const RATIO = 392 / 137;

export function Logo({ className, height = 40 }: { className?: string; height?: number }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src="/autodiag.png"
        alt="AutoDiag · Παπουτσάκης & Κώτσας ΟΕ, Ηλεκτρολογείο Αυτοκινήτων"
        width={Math.round(height * RATIO)}
        height={height}
        priority
      />
    </span>
  );
}
