import { forwardRef } from "react";
import ResourceCard from "../FreeResources/ResourceCard";

const RESOURCES = [
  {
    title: "Free Vocabulary E-book",
    cta: "Free E-book",
    href: "/free-resources",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
    alt: "Open book and tablet on a desk",
  },
  {
    title: "10 Tips for Writing Task 2",
    cta: "Free Tip Guide",
    href: "/free-resources",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
    alt: "Hand holding a fountain pen over paper",
  },
  {
    title: "Blog: Article Book Ebook",
    cta: "Free Blog Article",
    href: "/free-resources",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
    alt: "Laptop on a desk with notebook and coffee",
  },
];

export const FreeResources = forwardRef((props, ref) => {
  return (
    <section id="freeResources" className="w-full rounded-3xl bg-white px-4 py-12 sm:px-6 md:py-16 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center md:mb-12">
          <h2 className="text-title-gray text-3xl font-bold tracking-tight md:text-4xl">
            Free Resources
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-[#6C757D]">
            Quick links for IELTS prep assets and helpful blog resources.
          </p>
        </header>

        <div
          ref={ref}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8"
        >
          {RESOURCES.map((item) => (
            <ResourceCard key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
});

FreeResources.displayName = "FreeResources";

export default FreeResources;
