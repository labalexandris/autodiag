import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata = { title: "Είσοδος συνεργείου", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = (await searchParams).next ?? "/admin";
  if (await getCurrentUser().catch(() => undefined)) redirect(next.startsWith("/admin") ? next : "/admin");

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" aria-label="Αρχική" className="inline-block">
          <Logo height={48} />
        </Link>
        <div className="panel mt-6 p-6">
          <h1 className="text-[22px] font-semibold leading-tight">Είσοδος συνεργείου</h1>
          <p className="mt-1 text-[14px] text-ink-2">
            Για το προσωπικό. Αν ήρθες για ραντεβού, πήγαινε στην{" "}
            <Link href="/book" className="text-brand underline underline-offset-2">
              κράτηση
            </Link>
            .
          </p>
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
