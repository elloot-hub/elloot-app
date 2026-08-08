"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    quote:
      "Comprar conta com escrow na Elloot tirou o medo da negociação. O pagamento só liberou depois que eu confirmei a entrega.",
    name: "Marina S.",
    role: "Compradora · Free Fire",
  },
  {
    quote:
      "Vender ficou simples: anunciei, entreguei no chat e o saldo caiu na carteira. Sem drama e sem sair da plataforma.",
    name: "Rafael C.",
    role: "Vendedor · Roblox",
  },
  {
    quote:
      "O fluxo de intermediação é claro do começo ao fim. Parece marketplace sério — e a UI ajuda a confiar no processo.",
    name: "Sofia L.",
    role: "Tech Lead · Studio Indie",
  },
];

export function AuthTestimonialPanel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % testimonials.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  const item = testimonials[index] ?? testimonials[0];

  return (
    <aside className="relative hidden overflow-hidden bg-[linear-gradient(165deg,hsl(217_91%_52%)_0%,hsl(210_90%_62%)_45%,hsl(205_85%_72%)_100%)] p-8 text-white lg:flex lg:flex-col lg:justify-end lg:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full border border-white/25"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-28 -right-10 size-56 rounded-full border border-white/20"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-24 left-10 size-40 rounded-full border border-white/15"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(0_0%_100%/0.18),transparent_45%)]"
      />

      <div className="relative z-10 space-y-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-white/20 text-lg font-semibold backdrop-blur-sm ring-1 ring-white/30">
          {item.name.charAt(0)}
        </div>
        <blockquote className="max-w-md text-lg leading-relaxed text-pretty sm:text-xl">
          “{item.quote}”
        </blockquote>
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-white/75">{item.role}</p>
        </div>
        <div className="flex gap-1.5 pt-2">
          {testimonials.map((entry, i) => (
            <button
              key={entry.name}
              type="button"
              aria-label={`Depoimento ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1 rounded-full transition-all",
                i === index ? "w-8 bg-white" : "w-4 bg-white/40 hover:bg-white/60",
              )}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
