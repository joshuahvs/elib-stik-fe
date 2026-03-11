import Navbar from "./components/Navbar";
import MasaAktifCardClient from "./components/MasaAktifCardClient";
//Swiper for Articles
import ArticlesSlider from "./components/ArticlesSlider";

async function getLanding() {
  const res = await fetch("http://localhost:8080/landing", {
    cache: "no-store",
  });

  return res.json();
}

async function getArticles() {
  const res = await fetch("http://localhost:8080/articles", {
    cache: "no-store",
  });

  return res.json();
}

async function getAnnouncements() {
  const res = await fetch("http://localhost:8080/announcements", {
    cache: "no-store",
  });

  return res.json();
}

export default async function Home() {
  const data = await getLanding();
  const articles = await getArticles();
  const announcements = await getAnnouncements();
  return (
    <main>

      {/* HERO */}
      <section className="bg-[#4b200f] text-white pb-40">
        <div className="max-w-7xl mx-auto pt-24 px-8 grid grid-cols-2 gap-16">

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


      {/* IMAGE + MASA AKTIF */}
      <section className="bg-[#e7e3df] pb-32 flex flex-col items-center">

        <img
          src={data.image_url}
          className="w-[1200px] -mt-32 rounded-lg shadow-2xl"
        />

        <div className="w-[1200px] mt-10">
          <MasaAktifCardClient />
        </div>

      </section>


      {/* ANNOUNCEMENTS (dummy from backend) */}
      <section className="bg-white py-20">

        <div className="max-w-7xl mx-auto px-8">

          <h2 className="text-3xl font-bold mb-10 text-gray-800">
            Pengumuman
          </h2>

          <div className="grid grid-cols-3 gap-10">

            {announcements.map((item:any) => (

              <div
                key={item.id}
                className="
                bg-white
                border-l-4 border-[#4b200f]
                rounded-xl
                p-6
                shadow-sm
                hover:shadow-lg
                transition
                "
              >

                <div className="flex items-start justify-between mb-3">

                  <h3 className="font-semibold text-lg text-gray-800">
                    {item.title}
                  </h3>

                  <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">
                    Pengumuman
                  </span>

                </div>

                <p className="text-gray-600 text-sm">
                  {item.content}
                </p>

                <p className="text-xs text-gray-400 mt-4">
                  {item.date}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* ARTIKEL (dynamic from backend) */}
      <section className="bg-gray-50 py-20">

        <div className="max-w-7xl mx-auto px-8">

          <h2 className="text-3xl font-bold mb-10 text-gray-800">
            Artikel & Blog
          </h2>

          <ArticlesSlider articles={articles} />

        </div>

      </section>
</main>
);
}