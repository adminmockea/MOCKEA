import { useEffect, useRef, lazy, Suspense } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PteHowItWorks } from "./PteHowItWorks";
import { PteTaskCards } from "./PteTaskCards";
import { Pricing } from "../components/Home/Pricing";
import { FreeResources } from "../components/Home/FreeResources";

const Testimonials = lazy(() => import("../components/Home/Testimonials").then(m => ({ default: m.Testimonials })));

gsap.registerPlugin(ScrollTrigger);

export const PteLandingStack = () => {
    const cardsRef = useRef(null);
    const testimonialsRef = useRef(null);
    const resourcesRef = useRef(null);

    useEffect(() => {
        // task cards animation
        if (cardsRef.current) {
             gsap.fromTo(
               cardsRef.current.children,
               { opacity: 0, y: 50 },
               {
                 opacity: 1,
                 y: 0,
                 duration: 0.6,
                 stagger: 0.2,
                 ease: "power3.out",
                 scrollTrigger: {
                   trigger: cardsRef.current,
                   start: "top 85%",
                 },
               },
             );
        }

        // Testimonials animation
        if (testimonialsRef.current) {
            gsap.fromTo(
                testimonialsRef.current.children,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.2,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: testimonialsRef.current,
                        start: 'top 85%',
                    },
                }
            );
        }

        // Resources animation
        if (resourcesRef.current) {
            gsap.fromTo(
                resourcesRef.current.children,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.2,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: resourcesRef.current,
                        start: 'top 85%',
                    },
                }
            );
        }
    }, []);

    return (
        <div className="space-y-16 py-12">
            <PteHowItWorks />
            
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
                <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-[#001529] md:mb-14 md:text-4xl">
                    Why Choose MOCKEA for PTE?
                </h2>
                <PteTaskCards ref={cardsRef} />
            </div>

            {/* Testimonials */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
                <Suspense fallback={<div className="min-h-[250px] animate-pulse bg-slate-100/50 rounded-3xl" />}>
                    <Testimonials ref={testimonialsRef} />
                </Suspense>
            </div>

            {/* Free Resources */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
                <FreeResources ref={resourcesRef} />
            </div>

            {/* Shared Pricing Component */}
            <Pricing />
        </div>
    );
};

export default PteLandingStack;
