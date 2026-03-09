import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <main>

      {/* HERO SECTION */}
      <div className="bg-[#4b200f] text-white pb-40">

        <Navbar />

        <section className="max-w-7xl mx-auto pt-24 px-8">

          <div className="grid grid-cols-2 gap-16 items-start">

            {/* LEFT */}
            <div>

              {/* LOGO POLRI */}
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/d/dd/Insignia_of_the_Indonesian_National_Police.svg"
                className="w-16 mb-6"
              />

              <h1 className="text-6xl font-bold mb-3">
                E-LIBRARY
              </h1>

              <h2 className="text-4xl font-semibold">
                Sekolah Tinggi Ilmu Kepolisian
              </h2>

            </div>


            {/* RIGHT */}
            <div className="text-sm leading-relaxed">

              <h3 className="text-xl font-semibold mb-3">
                Visi & Misi
              </h3>

              <p className="font-semibold mb-1">Visi</p>

              <p className="mb-4">
                Terwujudnya Civitas Akademika STIK-PTIK gemar membaca dan
                menulis serta pelayanan prima perpustakaan secara digital
                sesuai standar internasional.
              </p>

              <p className="font-semibold mb-1">Misi</p>

              <ol className="list-decimal ml-5 space-y-1">
                <li>Memberikan pelayanan prima kepada Civitas Akademika.</li>
                <li>Memperkaya khasanah referensi perpustakaan.</li>
                <li>Membina seluruh perpustakaan yang ada di lingkungan Polri.</li>
                <li>Mengoptimalkan sistem perpustakaan sesuai standar internasional.</li>
              </ol>

            </div>

          </div>

        </section>

      </div>


      {/* SECTION BAWAH (warna abu/beige) */}
      <div className="bg-[#e7e5e4] pt-0 pb-20 flex justify-center">

        <img
          src="https://library.stik-ptik.ac.id/assets/images/slider/1.png"
          className="w-[1100px] -mt-24 rounded-lg shadow-2xl"
        />

      </div>

    </main>
  );
}