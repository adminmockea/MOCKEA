import { forwardRef, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const ITEMS = [
  {
    title: "From 5.5 to 7.5 in 2 weeks!",
    quote:
      "The practice material was exactly like the real exam. Mockea's feedback system helped me identify my weak spots in writing instantly.",
    name: "Priya S.",
    band: "7.5"
  },
  {
    title: "From 6.0 to 8.0 in 3 weeks!",
    quote:
      "I struggled with speaking for months. The live mock interviews on Mockea gave me the confidence I needed to ace the speaking part.",
    name: "Arjun K.",
    band: "8.0"
  },
  {
    title: "From 5.5 to 7.5 in 3 weeks!",
    quote:
      "I would highly recommend Mockea to everyone who wants to score high and achieve their dreams of studying abroad.",
    name: "Diana G.",
    band: "7.5"
  },
];

function TestimonialCard({ title, quote, name,band }) {
  return (
    <article
      className=" mx-auto h-full w-full max-w-[320px] rounded-2xl bg-primary px-6 pb-8 pt-10 shadow-lg sm:max-w-[300px] sm:rounded-3xl"
      aria-label={`Testimonial from ${name}`}
    >
      <h3 className="text-left text-xl font-bold leading-snug text-white">
        &ldquo;{title}&rdquo;
      </h3>
      <p className="mt-4 text-left text-sm italic leading-relaxed text-gray-200/90">
        &ldquo;{quote}&rdquo;
      </p>
      <p className="mt-6 text-left text-sm text-white">— {name}</p>
      <span className="text-left text-sm text-white font-bold">Band {band}</span>
    </article>
  );
}

export const Testimonials = forwardRef((props, ref) => {
  const slides = useMemo(() => [...ITEMS, ...ITEMS], []);

  return (
    <div
      ref={ref}
      className="rounded-3xl border border-gray-200/80 bg-white px-4 py-10 shadow-sm sm:px-8 sm:py-12"
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 text-center sm:mb-12">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#001f3f] sm:text-3xl md:text-4xl">
            Testimonials &amp; Success Stories
          </h2>
        </header>

        <div className="testimonials-swiper-wrap pt-2">
          <Swiper
            className="testimonials-swiper pb-10!"
            modules={[Autoplay, Pagination]}
            spaceBetween={24}
            slidesPerView={1}
            loop
            loopAdditionalSlides={2}
            speed={1000}
            autoplay={{
              delay: 200,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{ clickable: true }}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 28 },
              1024: { slidesPerView: 3, spaceBetween: 32 },
            }}
          >
            {slides.map((item, i) => (
              <SwiperSlide key={`${item.name}-${i}`} className="h-auto! py-2">
                <div className="flex h-full justify-center px-1 sm:px-0">
                  <TestimonialCard {...item} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
});

Testimonials.displayName = "Testimonials";

export default Testimonials;
