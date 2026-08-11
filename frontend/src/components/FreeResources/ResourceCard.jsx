import { motion } from "framer-motion";
import { Link } from "react-router";
import { 
  FiDownload, 
  FiBookOpen, 
  FiFileText, 
  FiMessageSquare, 
  FiTrendingUp, 
  FiPlayCircle, 
  FiMusic, 
  FiExternalLink, 
  FiEye 
} from "react-icons/fi";
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

const getFileTypeDetails = (fileType) => {
  const type = (fileType || "").toUpperCase();
  if (type.includes("VIDEO") || type.includes("MP4") || type.includes("WEBM")) {
    return {
      badgeClass: "bg-purple-50 text-purple-700 border border-purple-200",
      ctaIcon: <FiPlayCircle className="w-3.5 h-3.5" />,
      statIcon: <FiEye className="w-3.5 h-3.5 text-slate-400" />,
      statUnit: "views",
    };
  }
  if (type.includes("AUDIO") || type.includes("MP3") || type.includes("WAV")) {
    return {
      badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
      ctaIcon: <FiMusic className="w-3.5 h-3.5" />,
      statIcon: <FiMusic className="w-3.5 h-3.5 text-slate-400" />,
      statUnit: "plays",
    };
  }
  if (type.includes("LINK") || type.includes("URL")) {
    return {
      badgeClass: "bg-blue-50 text-blue-700 border border-blue-200",
      ctaIcon: <FiExternalLink className="w-3.5 h-3.5" />,
      statIcon: <FiExternalLink className="w-3.5 h-3.5 text-slate-400" />,
      statUnit: "visits",
    };
  }
  if (type.includes("DOCX") || type.includes("WORD") || type.includes("XLSX") || type.includes("PPTX")) {
    return {
      badgeClass: "bg-indigo-50 text-indigo-700 border border-indigo-200",
      ctaIcon: <FiDownload className="w-3.5 h-3.5" />,
      statIcon: <FiDownload className="w-3.5 h-3.5 text-slate-400" />,
      statUnit: "downloads",
    };
  }
  return {
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    ctaIcon: <FiDownload className="w-3.5 h-3.5" />,
    statIcon: <FiDownload className="w-3.5 h-3.5 text-slate-400" />,
    statUnit: "downloads",
  };
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

  const fileDetails = getFileTypeDetails(fileType);

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
        <div className="aspect-[4/3] w-full overflow-hidden relative bg-slate-900 flex items-center justify-center p-3">
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover filter blur-md opacity-30 scale-110 pointer-events-none"
            aria-hidden="true"
          />
          <img
            src={imageUrl}
            alt={title}
            className="relative max-h-full max-w-full object-contain rounded-lg shadow-md z-1 transition-transform duration-300 hover:scale-[1.02]"
            loading="lazy"
          />
          {category && (
            <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[#000f38] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl shadow flex items-center gap-1.5 z-10 border border-slate-100">
              {getCategoryIcon(category)}
              {category}
            </span>
          )}
        </div>

        {/* Card Content */}
        <div className="p-6">
          <div className="flex gap-2 mb-3">
            {fileType && (
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${fileDetails.badgeClass}`}>
                {fileType}
              </span>
            )}
            {size && (
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
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
              {fileDetails.statIcon}
              {downloadCount.toLocaleString()} {fileDetails.statUnit}
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
              {fileDetails.ctaIcon}
            </button>
          ) : (
            <Link
              to={link}
              className="inline-flex items-center gap-1.5 bg-cta-btn hover:bg-red-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-md shadow-red-500/10 hover:shadow-red-500/25 transition-all"
            >
              {ctaText}
              {fileDetails.ctaIcon}
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  );
}
