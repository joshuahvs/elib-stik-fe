import { Suspense } from "react";
import KoleksiPageClient from "./KoleksiPageClient";

function KoleksiPageFallback() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-500">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 rounded bg-slate-200" />
          <div className="h-4 w-72 rounded bg-slate-200" />
          <div className="h-10 w-full rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export default function KoleksiPage() {
  return (
    <Suspense fallback={<KoleksiPageFallback />}>
      <KoleksiPageClient />
    </Suspense>
  );
}
