import { motion } from "framer-motion";
import { Link } from "react-router";
import { FiDownload, FiBookOpen, FiFileText, FiMessageSquare, FiTrendingUp } from "react-icons/fi";
import { getFileUrl } from "../../utils/apiConfig";

const getCategoryIcon = (category) => {
  switch (category) {
    case "Vocabulary":
      return <FiBookOpen className="w-4 h-4 text-blue-500" />;
    case "Writing Guide":
      return <FiFileText className="w-4 h-4 text-purple-500" />;
    case "Speaking Templates":
      return <FiMessageSquare className="w-4 h-4 text-green-500" />;
    default:
      return <FiTrendingUp className="w-4 h-4 text-orange-500" />;
  }
};

export default function ResourceCard({ item, onDownload }) {
  const title = item.title;
  const description = item.description || "";
  const imageUrl = getFileUrl(item.imageUrl || item.image);
  const ctaText = item.ctaText || item.cta || "Download";
  const link = getFileUrl(item.link || item.href || "#");
  const category = item.category;
  const fileType = item.fileType;
  const size = item.size;
  const downloadCount = item.downloadCount;

  const handleClick = (e) => {
    if (onDownload) {
      e.preventDefault();
      onDownload(item);
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        y: -8, 
        transition: { duration: 0.2 } 
      }}
      className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md flex flex-col justify-between"
    >
      <div>
        {/* Cover Photo */}
        <div className="aspect-[4/3] w-full overflow-hidden relative bg-slate-100">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover scale-105 hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
          {category && (
            <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-[#000f38] text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow flex items-center gap-1.5 z-10 border border-slate-100">
              {getCategoryIcon(category)}
              {category}
            </span>
          )}
        </div>

        {/* Card Content */}
        <div className="p-6">
          <div className="flex gap-2 mb-3">
            {fileType && (
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                {fileType}
              </span>
            )}
            {size && (
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                {size}
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-extrabold text-slate-900 leading-tight mb-2">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Card Actions & Stats */}
      <div className="p-6 pt-0 border-t border-slate-100/50 mt-auto">
        <div className="flex items-center justify-between mt-4">
          {downloadCount !== undefined ? (
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <FiDownload className="w-3.5 h-3.5 text-slate-300" />
              {downloadCount.toLocaleString()} downloads
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-400">
              Free Prep Material
            </span>
          )}

          {onDownload ? (
            <button
              onClick={handleClick}
              className="inline-flex items-center gap-1.5 bg-cta-btn hover:bg-red-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-md shadow-red-500/10 hover:shadow-red-500/25 transition-all"
            >
              {ctaText}
              <FiDownload className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              to={link}
              className="inline-flex items-center gap-1.5 bg-cta-btn hover:bg-red-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-md shadow-red-500/10 hover:shadow-red-500/25 transition-all"
            >
              {ctaText}
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  );
}
