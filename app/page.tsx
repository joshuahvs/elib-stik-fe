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

        <Navbar />

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


      {/* IMAGE + GREY SECTION */}
      <div className="bg-[#e7e3df] pt-0 pb-32 flex justify-center">

        <img
          src={data.image_url}
          className="
            w-[1100px]
            -mt-32
            rounded-lg
            shadow-2xl
          "
        />

      </div>

    </main>
  );
}