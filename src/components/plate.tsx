import { formatPlate } from "@/lib/plate";
import { cn } from "@/lib/format";

/**
 * Ελληνική πινακίδα: λευκό φόντο, μαύρο περίγραμμα, μπλε λωρίδα ΕΕ με «GR».
 * Είναι το βασικό αναγνωριστικό σε όλη την εφαρμογή.
 */
export function Plate({
  plate,
  size = "md",
  className,
}: {
  plate: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const s = sizes[size];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-stretch overflow-hidden bg-white align-middle font-cond font-semibold leading-none text-ink",
        className,
      )}
      style={{
        height: s.h,
        borderRadius: s.r,
        boxShadow: `inset 0 0 0 ${s.b}px #1e2226`,
        fontSize: s.f,
        letterSpacing: "0.04em",
      }}
      aria-label={`Πινακίδα ${formatPlate(plate)}`}
    >
      <span
        className="flex flex-col items-center justify-end text-white"
        style={{
          width: s.strip,
          background: "var(--plate-blue)",
          paddingBottom: s.h * 0.1,
          fontSize: s.h * 0.26,
          letterSpacing: 0,
          borderTopLeftRadius: s.r,
          borderBottomLeftRadius: s.r,
        }}
        aria-hidden
      >
        {size !== "xs" && <Stars d={s.strip * 0.62} />}
        <span className="font-sans font-medium" style={{ marginTop: s.h * 0.04 }}>
          GR
        </span>
      </span>
      <span className="flex items-center whitespace-nowrap" style={{ padding: `0 ${s.pad}px` }}>
        {formatPlate(plate)}
      </span>
    </span>
  );
}

function Stars({ d }: { d: number }) {
  const stars = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return [Math.round((50 + Math.cos(a) * 36) * 10) / 10, Math.round((50 + Math.sin(a) * 36) * 10) / 10];
  });
  return (
    <svg width={d} height={d} viewBox="0 0 100 100" className="mb-auto mt-[18%]">
      {stars.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={7} fill="#f7d33b" />
      ))}
    </svg>
  );
}

const sizes = {
  xs: { h: 20, f: 12, strip: 9, pad: 5, r: 3, b: 1 },
  sm: { h: 26, f: 15, strip: 13, pad: 7, r: 4, b: 1.25 },
  md: { h: 34, f: 20, strip: 17, pad: 9, r: 5, b: 1.5 },
  lg: { h: 52, f: 32, strip: 25, pad: 14, r: 6, b: 2 },
  xl: { h: 72, f: 46, strip: 34, pad: 18, r: 8, b: 2.5 },
} as const;
