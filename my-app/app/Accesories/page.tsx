
import Link from "next/link";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import { GET } from "../api/Ecom/route";

const Accesories = async () => {
  const data = await GET(`/api/Ecom`);
  const datas = await data.json();

  // id 5 se start (index 4 se)
  const filteredData = datas.slice(72,100);

  return (
    <div>
      <Navbar />

      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredData.map((item: any, index: number) => (
            <Link
              key={item.id || index}
              href={`/WorldPic/${item.id}`}
              className="group relative block overflow-hidden bg-white"
            >
              {/* Image */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Discount Badge */}
                <span className="absolute right-3 top-3 rounded bg-[#c41e3a] px-2 py-1 text-[10px] font-semibold tracking-wide text-white">
                  {item.oldPrice && item.price
                    ? `${Math.round(
                        ((item.oldPrice - item.price) / item.oldPrice) * 100
                      )}% OFF`
                    : "50% OFF"}
                </span>
              </div>

              {/* Content */}
              <div className="pt-4">
                <h3 className="text-[12px] font-medium uppercase tracking-wide text-gray-900">
                  {item.name}
                </h3>

                <p className="mt-1 text-[11px] tracking-wide text-gray-500">
                  WEST
                </p>

                <div className="mt-2 flex items-center gap-2">
                  {item.oldPrice && (
                    <span className="text-[13px] text-gray-400 line-through">
                      Rs.{item.oldPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="text-[13px] font-medium text-[#c41e3a]">
                    Rs.{item.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Accesories;