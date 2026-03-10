import Navbar from "./components/Navbar";

async function getLanding() {
  const res = await fetch("http://localhost:8080/landing", {
    cache: "no-store",
  });

  return res.json();
}

export default async function Home() {
  const data = await getLanding();

  return (
    <main>

      {/* HERO */}
      <div className="bg-[#4b200f] text-white pb-40">

        <section className="max-w-7xl mx-auto pt-24 px-8">
          <div className="grid grid-cols-2 gap-16 items-start">

            {/* LEFT */}
            <div>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/d/dd/Insignia_of_the_Indonesian_National_Police.svg"
                className="w-16 mb-6"
              />

              <h1 className="text-6xl font-bold mb-3">
                {data.title}
              </h1>

              <h2 className="text-3xl font-semibold">
                {data.subtitle}
              </h2>
            </div>

            {/* RIGHT */}
            <div>
              <h3 className="text-xl font-semibold mb-4">
                Visi & Misi
              </h3>

              <p className="mb-4 whitespace-pre-line">
                {data.vision}
              </p>

              <p className="whitespace-pre-line">
                {data.mission}
              </p>
            </div>

          </div>
        </section>
      </div>


      {/* IMAGE */}
      <div className="bg-[#e7e3df] pt-0 pb-32 flex justify-center">

        <img
          src={data.image_url}
          className="w-[1200px] -mt-32 rounded-lg shadow-2xl"
        />

      </div>


      {/* PENGUMUMAN */}
      <section className="bg-white py-20">

        <div className="max-w-7xl mx-auto px-8">

          <h2 className="text-3xl font-bold mb-10 text-gray-800">
            Pengumuman
          </h2>

          <div className="grid grid-cols-3 gap-8">

            <div className="border rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-2">
                Perubahan Jam Operasional
              </h3>
              <p className="text-gray-600 text-sm">
                Mulai tanggal 10 Mei 2026 perpustakaan buka
                pukul 08.00 – 18.00 WIB.
              </p>
              <p className="text-xs text-gray-400 mt-3">
                8 Mei 2026
              </p>
            </div>

            <div className="border rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-2">
                Workshop Literasi Digital
              </h3>
              <p className="text-gray-600 text-sm">
                Workshop penggunaan database jurnal internasional
                akan diadakan pada 15 Mei.
              </p>
              <p className="text-xs text-gray-400 mt-3">
                7 Mei 2026
              </p>
            </div>

            <div className="border rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-2">
                Penambahan Koleksi Baru
              </h3>
              <p className="text-gray-600 text-sm">
                Perpustakaan menambah 200 buku baru
                terkait keamanan siber.
              </p>
              <p className="text-xs text-gray-400 mt-3">
                5 Mei 2026
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* BLOG */}
      <section className="bg-gray-50 py-20">

        <div className="max-w-7xl mx-auto px-8">

          <h2 className="text-3xl font-bold mb-10 text-gray-800">
            Artikel & Blog
          </h2>

          <div className="grid grid-cols-3 gap-10">

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">

              <img
                src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f"
                className="h-48 w-full object-cover"
              />

              <div className="p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Pentingnya Literasi Digital
                </h3>

                <p className="text-sm text-gray-600 mb-4">
                  Literasi digital penting bagi mahasiswa
                  untuk mengakses informasi secara efektif.
                </p>

                <p className="text-xs text-gray-400">
                  6 Mei 2026
                </p>
              </div>

            </div>


            <div className="bg-white rounded-lg shadow-sm overflow-hidden">

              <img
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b"
                className="h-48 w-full object-cover"
              />

              <div className="p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Tips Mencari Referensi Akademik
                </h3>

                <p className="text-sm text-gray-600 mb-4">
                  Cara menemukan sumber referensi akademik
                  yang kredibel untuk penelitian.
                </p>

                <p className="text-xs text-gray-400">
                  4 Mei 2026
                </p>
              </div>

            </div>


            <div className="bg-white rounded-lg shadow-sm overflow-hidden">

              <img
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40"
                className="h-48 w-full object-cover"
              />

              <div className="p-6">
                <h3 className="font-semibold text-lg mb-2">
                  Peran Perpustakaan Digital
                </h3>

                <p className="text-sm text-gray-600 mb-4">
                  Perpustakaan digital membantu mahasiswa
                  mengakses sumber ilmu dari mana saja.
                </p>

                <p className="text-xs text-gray-400">
                  2 Mei 2026
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}