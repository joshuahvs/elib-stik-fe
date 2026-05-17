"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";

type InsightItem = {
  id: string;
  title: string;
  imageUrl?: string | null;
  meta?: string | null;
  href: string;
  label?: string | null;
};

export default function ArticlesSlider({ items }: { items: InsightItem[] }) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <Swiper
      modules={[Navigation]}
      navigation
      spaceBetween={30}
      slidesPerView={3}
      breakpoints={{
        640: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      }}
    >
      {safeItems.map((item) => (
        <SwiperSlide key={item.id}>
          <Link
            href={item.href}
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-[0_18px_50px_-35px_rgba(15,7,2,0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_35px_80px_-45px_rgba(15,7,2,0.7)]"
          >
            <div className="relative h-56 w-full overflow-hidden">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  alt={item.title}
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-slate-200 via-slate-100 to-white" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute left-4 right-4 bottom-4 flex flex-wrap items-center gap-2 text-xs">
                {item.label ? (
                  <span className="rounded-full bg-white/90 px-3 py-1 font-semibold text-[#2A170C]">
                    {item.label}
                  </span>
                ) : null}
                {item.meta ? (
                  <span className="rounded-full bg-black/40 px-3 py-1 text-white/80">
                    {item.meta}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-[#6b3a22] transition line-clamp-2">
                {item.title}
              </h3>
              <div className="mt-4 text-xs text-slate-400">
                Baca selengkapnya
              </div>
            </div>
          </Link>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
