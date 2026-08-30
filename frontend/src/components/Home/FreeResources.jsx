import { forwardRef } from "react";
import { Link } from "react-router";
import { FiArrowRight } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAxios from "../../hooks/useAxios";
import ResourceCard from "../FreeResources/ResourceCard";
import { getFileUrl } from "../../utils/apiConfig";

const DEFAULT_RESOURCES = [
  {
    _id: "default-1",
    title: "Free Vocabulary E-book",
    ctaText: "Free E-book",
    link: "/free-resources",
    imageUrl:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
    description: "Curated vocabulary lists and flashcards for IELTS and PTE prep.",
    category: "Vocabulary",
    fileType: "PDF",
  },
  {
    _id: "default-2",
    title: "10 Tips for Writing Task 2",
    ctaText: "Free Tip Guide",
    link: "/free-resources",
    imageUrl:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
    description: "Proven strategies and structures to score high in essay writing.",
    category: "Writing Guide",
    fileType: "PDF",
  },
  {
    _id: "default-3",
    title: "Blog: Article Book Ebook",
    ctaText: "Free Blog Article",
    link: "/free-resources",
    imageUrl:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
    description: "Essential tips, study guides, and test day strategies.",
    category: "General",
    fileType: "PDF",
  },
];

export const FreeResources = forwardRef((props, ref) => {
  const axiosPublic = useAxios();
  const queryClient = useQueryClient();

  const currentExam = (localStorage.getItem("temp_exam") || localStorage.getItem("prefetched_exam") || "").toUpperCase();

  // Fetch Resources from Backend API
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const res = await axiosPublic.get("/resources");
      return res.data.resources || [];
    },
  });

  // Download mutation to increment download count
  const downloadMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axiosPublic.post(`/resources/${id}/download`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });

  const handleDownload = (resource) => {
    if (resource._id && !resource._id.startsWith("default-")) {
      downloadMutation.mutate(resource._id);
    }
    const targetUrl = getFileUrl(resource.link);
    if (resource.link && resource.link !== "/free-resources" && resource.link !== "#") {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = "/free-resources";
    }
  };

  // Filter resources based on current exam track (PTE vs IELTS) and slice top 3 for home section
  const filteredResources = resources.filter((res) => {
    if (res.isFeaturedOnRegister) return false;
    if (currentExam && res.examType && res.examType !== "Both" && res.examType !== currentExam) {
      return false;
    }
    return true;
  });

  const displayResources = filteredResources.length > 0 ? filteredResources.slice(0, 3) : DEFAULT_RESOURCES;

  return (
    <section id="freeResources" className="w-full rounded-3xl bg-white px-4 py-12 sm:px-6 md:py-16 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center md:mb-12">
          <h2 className="text-title-gray text-3xl font-bold tracking-tight md:text-4xl">
            Free Resources
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-[#6C757D]">
            {currentExam === "PTE"
              ? "Quick links for PTE prep assets, study materials, and helpful guides."
              : "Quick links for IELTS prep assets and helpful blog resources."}
          </p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-3xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div
            ref={ref}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8"
          >
            {displayResources.map((item) => (
              <ResourceCard key={item._id || item.title} item={item} onDownload={handleDownload} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center md:mt-12">
          <Link
            to="/free-resources"
            className="inline-flex items-center gap-2.5 rounded-2xl bg-cta-btn hover:bg-hover-btn text-white text-sm font-extrabold px-8 py-3.5 shadow-xl shadow-cta-btn/15 hover:shadow-hover-btn/25 transition-all duration-300 hover:scale-[1.02] active:scale-98"
          >
            <span>Explore All Free Resources</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
});

FreeResources.displayName = "FreeResources";

export default FreeResources;
