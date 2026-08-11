import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiSearch, FiBookOpen } from 'react-icons/fi';
import useAxios from '../../hooks/useAxios';
import Loader from '../Loader/Loader';
import Error from '../Common/Error';
import ResourceCard from './ResourceCard';
import { useLocation } from 'react-router';
import { API_BASE_URL, getFileUrl } from '../../utils/apiConfig';

const CATEGORIES = [
  "All",
  "Vocabulary",
  "Writing Guide",
  "Writing Task 1",
  "Writing Task 2",
  "Speaking Templates",
  "Speaking Part 1",
  "Speaking Part 2",
  "Speaking Part 3",
  "Reading Guide",
  "Reading Part 1",
  "Reading Part 2",
  "Reading Part 3",
  "Listening Guide",
  "Listening Part 1",
  "Listening Part 2",
  "Listening Part 3",
  "Listening Part 4",
  "Study Tips",
  "General",
];

export default function FreeResourcesPage() {
  const axiosPublic = useAxios();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const location = useLocation();
  const isPte = (localStorage.getItem("temp_exam") || localStorage.getItem("prefetched_exam")) === "PTE";

  // Fetch Resources from Backend API
  const { data: resources = [], isLoading, isError } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const res = await axiosPublic.get('/resources');
      return res.data.resources;
    }
  });

  // Increment Download Count Mutation
  const downloadMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axiosPublic.post(`/resources/${id}/download`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    }
  });

  const handleDownload = (resource) => {
    downloadMutation.mutate(resource._id);
    const link = getFileUrl(resource.link);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  // Filter Resources based on Search and Category (and exclude registration featured resources)
  const filteredResources = resources.filter(res => {
    if (res.isFeaturedOnRegister) return false;
    const term = searchTerm.toLowerCase();
    const matchesSearch = res.title.toLowerCase().includes(term) || 
                          res.description.toLowerCase().includes(term) ||
                          (res.category && res.category.toLowerCase().includes(term));
    const matchesCategory = selectedCategory === "All" || res.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) return <Loader />;
  if (isError) return <Error />;

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-16 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        {/* Visual decoration blobs */}
        <div className={`absolute top-0 right-1/4 w-96 h-96 rounded-full filter blur-3xl -z-10 ${isPte ? "bg-blue-100/20" : "bg-purple-100/30"}`} />
        <div className={`absolute bottom-10 left-10 w-96 h-96 rounded-full filter blur-3xl -z-10 ${isPte ? "bg-teal-100/10" : "bg-red-100/20"}`} />

        {/* 1. Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full mb-4 border ${
              isPte 
                ? "text-blue-600 bg-blue-50 border-blue-100" 
                : "text-cta-btn bg-red-50 border-red-100"
            }`}
          >
            <FiBookOpen className={`w-3.5 h-3.5 fill-current animate-pulse ${isPte ? "text-blue-600" : "text-cta-btn"}`} />
            Study materials & guides
          </motion.span>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black text-[#000f38] tracking-tight mb-4"
          >
            Unlock Free Prep Resources
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600"
          >
            {isPte
              ? "Get highly curated vocab sheets, template cards, and exam strategies created by certified PTE training experts. Access instantly to maximize your score."
              : "Get highly curated vocab sheets, template cards, and exam strategies created by native IELTS instructors. Access instantly to maximize your band score."
            }
          </motion.p>
        </div>

        {/* 2. Search & Category Filters */}
        <div className="max-w-4xl mx-auto mb-12 flex flex-col gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:max-w-md">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search resource titles or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-opacity-20 transition-all text-slate-800 shadow-sm ${
                isPte ? "focus:ring-blue-500/20 focus:border-blue-500" : "focus:ring-cta-btn/20 focus:border-cta-btn"
              }`}
            />
          </div>

          {/* Category Pill Filters */}
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none justify-start md:justify-end">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2.5 rounded-full text-xs font-black tracking-wide uppercase whitespace-nowrap transition-all duration-300 cursor-pointer ${
                  selectedCategory === category
                    ? "bg-[#000f38] text-white shadow-md"
                    : "bg-white text-slate-500 hover:text-slate-800 border border-slate-200 shadow-sm"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Resources Grid */}
        <AnimatePresence mode="popLayout">
          {filteredResources.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-20 bg-white border border-slate-200 rounded-3xl max-w-4xl mx-auto shadow-sm"
            >
              <FiBookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-extrabold text-slate-800 text-xl">No resources found</h3>
              <p className="text-slate-500 mt-1">Try relaxing your search terms or checking another category pill.</p>
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
            >
              {filteredResources.map((item) => (
                <ResourceCard 
                  key={item._id} 
                  item={item} 
                  onDownload={handleDownload} 
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. Complete Guided Prep CTA */}
        <div className="mt-24 bg-[#000f38] rounded-4xl p-8 md:p-12 text-white max-w-5xl mx-auto shadow-2xl relative overflow-hidden">
          {/* Decorative gradients */}
          <div className={`absolute top-0 right-0 w-80 h-80 rounded-full filter blur-3xl -z-10 ${isPte ? "bg-blue-500/10" : "bg-red-500/10"}`} />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl -z-10" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="max-w-xl">
              <h2 className="text-3xl font-black tracking-tight mb-3">Want Complete Guided Preparation?</h2>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                {isPte
                  ? "Take full-length simulated PTE mock tests, unlock instant detailed AI diagnostics, and receive feedback and score updates mapped directly to Pearson global standards."
                  : "Take full-length simulated IELTS mock tests, unlock instant detailed AI diagnostics, and receive personalized reviews and band-score corrections from certified native tutors."
                }
              </p>
            </div>
            <a
              href="/pricing"
              className={`inline-flex items-center gap-2 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl transition-all whitespace-nowrap ${
                isPte 
                  ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 hover:scale-[1.02] active:scale-98" 
                  : "bg-cta-btn hover:bg-red-600 shadow-red-500/20 hover:scale-[1.02] active:scale-98"
              }`}
            >
              See Premium Plans
              <FiDownload className="w-4 h-4 rotate-270" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
