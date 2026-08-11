import { useEffect, useState } from "react";
import { FiBookOpen, FiDownload, FiCheckCircle, FiStar } from "react-icons/fi";
import useAxios from "../../hooks/useAxios";
import { getFileUrl } from "../../utils/apiConfig";

export default function FreeBookRegisterCard({ claimBook, setClaimBook, onBookLoaded }) {
  const axiosPublic = useAxios();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchFeaturedBook = async () => {
      try {
        const res = await axiosPublic.get("/resources/featured-book");
        if (isMounted && res.data?.success) {
          setBook(res.data.featuredBook);
          if (onBookLoaded) onBookLoaded(res.data.featuredBook);
        }
      } catch (err) {
        console.error("Failed to load featured book:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchFeaturedBook();
    return () => { isMounted = false; };
  }, [axiosPublic, onBookLoaded]);

  if (loading) {
    return (
      <div className="bg-slate-900 text-white p-5 rounded-2xl animate-pulse mb-6 flex items-center gap-4">
        <div className="w-16 h-20 bg-slate-800 rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-800 rounded w-3/4"></div>
          <div className="h-3 bg-slate-800 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const defaultTitle = book?.title || "Ultimate PTE & IELTS Academic Masterclass 2026";
  const defaultDesc = book?.description || "150+ Pages of certified vocabulary lists, high-scoring speaking templates, AI essay scoring formulas, and practice tips.";
  const coverImg = getFileUrl(book?.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80");

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#000f38] via-[#0b194d] to-[#1a2766] p-4 sm:p-5 text-white shadow-xl border border-blue-500/20 mb-5">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header Tag */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
          <FiStar className="w-3.5 h-3.5 text-amber-400 animate-pulse fill-amber-400/40" />
          Free Registration Gift
        </span>
        <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm">
          <FiDownload className="w-3 h-3 text-emerald-400" />
          {book?.fileType || "PDF"} • {book?.size || "Free Download"}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Book Cover Preview */}
        <div className="relative group shrink-0 w-24 sm:w-28 aspect-[3/4] rounded-xl overflow-hidden shadow-lg border border-white/20 bg-slate-950 flex items-center justify-center p-1">
          <img
            src={coverImg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover filter blur-sm opacity-40 pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={coverImg}
            alt={defaultTitle}
            className="relative max-h-full max-w-full object-contain rounded-md z-1 group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-2 pointer-events-none" />
          <span className="absolute bottom-1 left-1 right-1 text-[9px] font-extrabold text-center bg-blue-600/90 text-white py-0.5 rounded uppercase tracking-wider backdrop-blur-xs z-10">
            Free PDF
          </span>
        </div>

        {/* Info & Highlights */}
        <div className="flex-1 text-center sm:text-left">
          <h4 className="text-base font-extrabold text-white leading-tight mb-1">
            {defaultTitle}
          </h4>
          <p className="text-xs text-slate-300 line-clamp-2 mb-2 leading-relaxed">
            {defaultDesc}
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-200 font-medium mb-3">
            <li className="flex items-center gap-1.5 justify-center sm:justify-start">
              <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>500+ Academic Vocab</span>
            </li>
            <li className="flex items-center gap-1.5 justify-center sm:justify-start">
              <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>High-Score Templates</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Claim Checkbox Option */}
      <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2.5">
        <input
          id="claimBookToggle"
          type="checkbox"
          checked={claimBook}
          onChange={(e) => setClaimBook(e.target.checked)}
          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer accent-blue-500"
        />
        <label htmlFor="claimBookToggle" className="text-xs font-bold text-amber-200 cursor-pointer flex items-center gap-1.5">
          <FiBookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Claim & auto-download this E-Book instantly upon registration</span>
        </label>
      </div>
    </div>
  );
}
