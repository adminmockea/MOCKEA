import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
    PiGraduationCap, 
    PiMagnifyingGlass, 
    PiStarFill, 
    PiBriefcase, 
    PiEnvelope,
    PiSpinner
} from "react-icons/pi";
import { motion, AnimatePresence } from "framer-motion";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import CardSkeleton from "../../Common/Skeleton/CardSkeleton";

const TrainerLibrary = () => {
    const axiosSecure = useAxiosSecure();
    const [searchQuery, setSearchQuery] = useState("");
    const [specialtyFilter, setSpecialtyFilter] = useState("All");

    const { data: result = {}, isLoading } = useQuery({
        queryKey: ["trainers"],
        queryFn: async () => {
            const res = await axiosSecure.get("/trainers");
            return res.data;
        }
    });

    const trainersList = result.trainers || [];

    // Extract unique specialties for filtering
    const specialties = ["All", ...new Set(trainersList.map(t => t.specialty))];

    // Filter logic
    const filteredTrainers = trainersList.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              t.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              t.bio.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSpecialty = specialtyFilter === "All" || t.specialty === specialtyFilter;
        return matchesSearch && matchesSpecialty;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const cardVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    return (
        <div className="space-y-12 pb-24 max-w-7xl mx-auto">
            {/* Header Banner */}
            <motion.section 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[3.5rem] bg-linear-to-br from-primary to-indigo-700 p-12 lg:p-16 text-white shadow-2xl shadow-primary/30"
            >
                <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white border border-white/20 backdrop-blur-md">
                        <PiGraduationCap className="text-indigo-400" /> Professional Mentorship
                    </div>
                    <div className="max-w-2xl">
                        <h1 className="text-4xl lg:text-6xl font-black tracking-tighter leading-[0.9]">
                            MOCKEA <span className="text-yellow-300 italic">Expert Trainers</span>
                        </h1>
                        <p className="mt-6 text-base lg:text-lg text-white/80 font-medium leading-relaxed">
                            Connect with certified IELTS examiners and world-class specialists. Accelerate your practice with personalized guidance and comprehensive feedback.
                        </p>
                    </div>
                </div>

                <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-primary-focus/20 blur-3xl" />
            </motion.section>

            {/* Filters and Search Bar */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-6 rounded-[2.5rem] border border-base-200 shadow-sm">
                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <PiMagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-base-content/40 text-lg" />
                    <input 
                        type="text"
                        placeholder="Search trainers, specialties..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input input-bordered w-full pl-12 rounded-2xl h-14 bg-base-50/50 border-base-200 focus:border-primary font-bold placeholder:text-base-content/30"
                    />
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
                    {specialties.map(spec => (
                        <button
                            key={spec}
                            onClick={() => setSpecialtyFilter(spec)}
                            className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                                specialtyFilter === spec 
                                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                : "bg-base-100 border border-base-200 hover:bg-base-200 text-base-content/60"
                            }`}
                        >
                            {spec}
                        </button>
                    ))}
                </div>
            </div>

            {/* Trainers Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <CardSkeleton count={3} />
                </div>
            ) : filteredTrainers.length === 0 ? (
                <div className="card bg-white p-16 text-center border border-base-200 rounded-[3rem] shadow-sm space-y-4">
                    <div className="w-20 h-20 bg-base-100 text-base-content/30 rounded-full flex items-center justify-center mx-auto text-3xl">
                        <PiMagnifyingGlass />
                    </div>
                    <h3 className="text-2xl font-black">No Trainers Found</h3>
                    <p className="text-base-content/50 max-w-sm mx-auto">We couldn't find any trainers matching your search query. Try broadening your keywords!</p>
                </div>
            ) : (
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredTrainers.map((t) => (
                            <motion.div 
                                layout
                                key={t._id}
                                variants={cardVariants}
                                whileHover={{ y: -8 }}
                                className="card bg-white p-8 rounded-[3rem] border border-base-200 shadow-sm hover:shadow-2xl hover:border-primary/30 transition-all flex flex-col justify-between h-full"
                            >
                                <div className="space-y-6">
                                    {/* Header Row */}
                                    <div className="flex items-center gap-4">
                                        <div className="avatar placeholder">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 border border-indigo-100 text-primary flex items-center justify-center font-black text-2xl shadow-inner">
                                                {t.imageUrl ? (
                                                    <img src={t.imageUrl} alt={t.name} className="object-cover" />
                                                ) : (
                                                    <span>{t.name.charAt(0)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-extrabold tracking-tight">{t.name}</h3>
                                            <span className="badge badge-primary px-3 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest mt-1">
                                                {t.specialty}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-px bg-base-100" />

                                    {/* Bio */}
                                    <p className="text-sm text-base-content/75 leading-relaxed font-medium">
                                        {t.bio}
                                    </p>
                                </div>

                                {/* Footer details */}
                                <div className="mt-8 space-y-4">
                                    <div className="flex flex-wrap gap-4 items-center justify-between text-[11px] font-black uppercase tracking-widest text-base-content/40">
                                        <div className="flex items-center gap-1.5"><PiBriefcase className="w-4 h-4 text-primary/60" /> {t.experience}</div>
                                        <div className="flex items-center gap-1"><PiStarFill className="w-4 h-4 text-amber-400" /> {t.rating?.toFixed(1) || "5.0"}</div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 border-t border-base-100 text-xs font-bold text-base-content/50">
                                        <PiEnvelope className="w-4 h-4 text-primary/40" />
                                        <span className="truncate">{t.email}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
};

export default TrainerLibrary;
