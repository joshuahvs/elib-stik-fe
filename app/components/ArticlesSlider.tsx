"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";

export default function ArticlesSlider({ articles }: any) {
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
      {articles.map((item: any) => (
        <SwiperSlide key={item.id}>
          <Link
            href={`/articles/${item.id}`}
            className="group block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
          >
            <img
              src={item.url_sampul}
              className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
              alt={item.judul}
            />
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-2 group-hover:text-[#512F16] transition">
                {item.judul}
              </h3>
              <p className="text-xs text-gray-400">
                {item.tahun_terbit}
              </p>
            </div>
          </Link>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
