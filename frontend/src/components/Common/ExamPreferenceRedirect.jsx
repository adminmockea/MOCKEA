import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router";
import useAuth from "../../hooks/useAuth";
import useUserProfile from "../../hooks/useUserProfile";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import Loader from "../Loader/Loader";
import { motion } from "framer-motion";
import { PiBookOpenTextFill, PiGlobeHemisphereEastFill, PiArrowRightBold } from "react-icons/pi";
import { FiCheck, FiPlay } from "react-icons/fi";
import { toast } from "react-toastify";
import useAxios from "../../hooks/useAxios";

const Testimonials = lazy(() => import("../Home/Testimonials").then(m => ({ default: m.Testimonials })));
const FreeResources = lazy(() => import("../Home/FreeResources").then(m => ({ default: m.FreeResources })));

export default function ExamPreferenceRedirect() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading: authLoading } = useAuth();
    const { userData, isLoading: profileLoading } = useUserProfile();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const axiosPublic = useAxios();

    const { data: publicConfig } = useQuery({
        queryKey: ['public-settings'],
        queryFn: async () => {
            const res = await axiosPublic.get('/settings/public');
            return res.data;
        },
        staleTime: 1000 * 60 * 5,
    });

    const handleWatchDemoClick = () => {
        const isEnabled = publicConfig?.watchDemoEnabled !== false;
        let url = publicConfig?.watchDemoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

        if (!isEnabled || !url.trim()) {
            toast.info('Demo video is currently disabled or unavailable.');
            return;
        }

        url = url.trim();
        if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
            url = `https://${url}`;
        }

        if (url.startsWith('/')) {
            window.location.href = url;
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const queryParams = new URLSearchParams(location.search);
    const forceSelect = queryParams.get("select") === "true" || queryParams.get("change") === "true";

    useEffect(() => {
        if (authLoading || forceSelect) return;

        // If authenticated and profile loaded
        if (user) {
            if (!profileLoading && userData) {
                const preference = userData.targetExam || "IELTS";
                if (preference === "PTE") {
                    navigate("/pte", { replace: true });
                } else {
                    navigate("/ielts", { replace: true });
                }
            }
            return;
        }

        // If guest, check localStorage
        const storedPref = localStorage.getItem("prefetched_exam");
        if (storedPref) {
            if (storedPref === "PTE") {
                navigate("/pte", { replace: true });
            } else {
                navigate("/ielts", { replace: true });
            }
        }
    }, [user, authLoading, userData, profileLoading, navigate, forceSelect]);

    // Handle user selection
    const handleSelectTrack = async (track) => {
        localStorage.setItem("prefetched_exam", track);
        
        if (user && userData?._id) {
            try {
                await axiosSecure.patch(`/user/${userData._id}/exam-preference`, { targetExam: track });
                queryClient.invalidateQueries({ queryKey: ["user-profile", user?.email] });
                toast.success(`Preferred track updated to ${track}!`);
            } catch (err) {
                console.error("Failed to update database preference:", err);
                toast.error("Failed to save preference to your profile");
            }
        }

        if (track === "PTE") {
            navigate("/pte");
        } else {
            navigate("/ielts");
        }
    };

    if (authLoading || (user && profileLoading)) {
        return <Loader />;
    }

    return (
        <div className="w-full bg-[#FAF9F6] text-slate-900 font-sans relative overflow-x-hidden">
            {/* 1. Choose Prep Track Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 flex flex-col items-center">
                <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm"
                    >
                        <span className="text-xs font-bold tracking-wider text-slate-600 uppercase">Welcome to MOCKEA</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight"
                    >
                        Choose Your <span className="text-cta-btn">Preparation Track</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto"
                    >
                        Select your target exam. We will customize your dashboard, mock tests, and practice rooms to match.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="pt-3 flex justify-center"
                    >
                        <button 
                            onClick={handleWatchDemoClick}
                            className="px-6 py-3 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold rounded-xl shadow-xs transition-all hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <FiPlay className="text-cta-btn fill-cta-btn" /> Watch Demo
                        </button>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
                    {/* IELTS Option Hover Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        onClick={() => handleSelectTrack("IELTS")}
                        className="group relative h-[380px] w-full rounded-[2.5rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-200"
                    >
                        {/* Front Face (Red CTA Color) */}
                        <div className="absolute inset-0 bg-cta-btn p-10 flex flex-col justify-between text-white transition-transform duration-500 group-hover:-translate-y-full">
                            <div className="space-y-6">
                                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white">
                                    <PiBookOpenTextFill size={32} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight text-white mb-2">IELTS Academic</h2>
                                    <p className="text-white/80 text-sm leading-relaxed">
                                        Simulate complete IELTS general and academic mock exams. Master writing, speaking, listening, and reading with native examiner band scoring.
                                    </p>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-white/20 flex items-center justify-between text-sm font-bold text-white">
                                Explore IELTS Prep <PiArrowRightBold size={16} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </div>

                        {/* Back Face / Hover Related Info */}
                        <div className="absolute inset-0 bg-white p-10 flex flex-col justify-between text-slate-800 transition-transform duration-500 translate-y-full group-hover:translate-y-0">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black tracking-tight text-slate-900 border-b pb-3 border-slate-100 flex items-center justify-between">
                                    <span>IELTS Features</span>
                                    <span className="text-xs text-cta-btn font-extrabold uppercase">Full Access</span>
                                </h3>
                                <ul className="space-y-3">
                                    {[
                                        "4 Core Modules (Listening, Reading, Writing, Speaking)",
                                        "Computer-delivered simulated exam interface",
                                        "Instant AI Writing & Speaking scoring diagnostics",
                                        "Native examiner templates & detailed guidelines"
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                                            <FiCheck className="text-cta-btn w-5 h-5 shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="pt-4 flex items-center justify-between text-sm font-bold text-cta-btn">
                                Select Track &amp; Begin <PiArrowRightBold size={16} />
                            </div>
                        </div>
                    </motion.div>

                    {/* PTE Option Hover Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        onClick={() => handleSelectTrack("PTE")}
                        className="group relative h-[380px] w-full rounded-[2.5rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-200"
                    >
                        {/* Front Face (Red CTA Color) */}
                        <div className="absolute inset-0 bg-cta-btn p-10 flex flex-col justify-between text-white transition-transform duration-500 group-hover:-translate-y-full">
                            <div className="space-y-6">
                                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white">
                                    <PiGlobeHemisphereEastFill size={32} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight text-white mb-2">PTE Academic</h2>
                                    <p className="text-white/80 text-sm leading-relaxed">
                                        Experience Pearson PTE Academic layouts. Practice Read Aloud, Describe Image, and Fill in the Blanks with instant automated scoring feedback.
                                    </p>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-white/20 flex items-center justify-between text-sm font-bold text-white">
                                Explore PTE Prep <PiArrowRightBold size={16} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </div>

                        {/* Back Face / Hover Related Info */}
                        <div className="absolute inset-0 bg-white p-10 flex flex-col justify-between text-slate-800 transition-transform duration-500 translate-y-full group-hover:translate-y-0">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black tracking-tight text-slate-900 border-b pb-3 border-slate-100 flex items-center justify-between">
                                    <span>PTE Features</span>
                                    <span className="text-xs text-cta-btn font-extrabold uppercase">Full Access</span>
                                </h3>
                                <ul className="space-y-3">
                                    {[
                                        "Simulated Pearson PTE layout environment",
                                        "Integrated mic controls for Read Aloud practice",
                                        "Automated scoring for speaking, reading & writing",
                                        "Detailed templates & diagnostic analytics breakdown"
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                                            <FiCheck className="text-cta-btn w-5 h-5 shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="pt-4 flex items-center justify-between text-sm font-bold text-cta-btn">
                                Select Track &amp; Begin <PiArrowRightBold size={16} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 2. Testimonials Section */}
            <section className="py-16 bg-[#FAF9F6] border-t border-slate-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Suspense fallback={<div className="h-40 w-full animate-pulse bg-slate-100 rounded-3xl" />}>
                        <Testimonials />
                    </Suspense>
                </div>
            </section>

            {/* 3. Free Pricing Cards (Hover Cards) */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 flex flex-col items-center">
                <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                        Get Started with Our <span className="text-cta-btn">Free Plan</span>
                    </h2>
                    <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto">
                        No credit card required. Experience premium practice engine tasks completely free.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
                    {/* IELTS Free pricing card */}
                    <div 
                        onClick={() => {
                            localStorage.setItem("temp_exam", "IELTS");
                            navigate("/pricing");
                        }}
                        className="group relative h-[320px] w-full rounded-[2rem] overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-500 border border-slate-200"
                    >
                        {/* Front face */}
                        <div className="absolute inset-0 bg-white p-8 flex flex-col justify-between transition-transform duration-500 group-hover:-translate-y-full border-t-8 border-cta-btn">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Category: Free</span>
                                <h3 className="text-2xl font-black text-slate-900 mt-1">IELTS Free Prep</h3>
                                <p className="text-slate-500 text-sm mt-2">Perfect way to try out Mockea's advanced IELTS simulation features.</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-slate-900">$0</span>
                                <span className="text-sm font-semibold text-slate-400">/ forever</span>
                            </div>
                            <button className="w-full py-3 bg-slate-100 group-hover:bg-cta-btn group-hover:text-white transition-colors text-slate-700 text-sm font-bold rounded-xl flex items-center justify-center gap-1.5">
                                View Details &amp; Plan <PiArrowRightBold />
                            </button>
                        </div>
                        {/* Hover info face */}
                        <div className="absolute inset-0 bg-slate-50 p-8 flex flex-col justify-between transition-transform duration-500 translate-y-full group-hover:translate-y-0">
                            <div>
                                <h4 className="text-lg font-black text-slate-900 border-b pb-2 border-slate-200">IELTS Free Package Includes</h4>
                                <ul className="space-y-2.5 mt-4">
                                    {[
                                        "1 full-length simulated mock exam",
                                        "10 practice room questions total",
                                        "Basic score estimation & band analytics report",
                                        "Lifetime access to vocabulary E-book guide"
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-center gap-2 text-xs text-slate-600">
                                            <FiCheck className="text-cta-btn w-4 h-4 shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="text-xs font-extrabold text-cta-btn flex items-center gap-1.5 self-end">
                                Start IELTS Free Plan <PiArrowRightBold />
                            </div>
                        </div>
                    </div>

                    {/* PTE Free pricing card */}
                    <div 
                        onClick={() => {
                            localStorage.setItem("temp_exam", "PTE");
                            navigate("/pricing");
                        }}
                        className="group relative h-[320px] w-full rounded-[2rem] overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-500 border border-slate-200"
                    >
                        {/* Front face */}
                        <div className="absolute inset-0 bg-white p-8 flex flex-col justify-between transition-transform duration-500 group-hover:-translate-y-full border-t-8 border-cta-btn">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Category: Free</span>
                                <h3 className="text-2xl font-black text-slate-900 mt-1">PTE Free Prep</h3>
                                <p className="text-slate-500 text-sm mt-2">Experience premium automated PTE scoring and interface layouts.</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-slate-900">$0</span>
                                <span className="text-sm font-semibold text-slate-400">/ forever</span>
                            </div>
                            <button className="w-full py-3 bg-slate-100 group-hover:bg-cta-btn group-hover:text-white transition-colors text-slate-700 text-sm font-bold rounded-xl flex items-center justify-center gap-1.5">
                                View Details &amp; Plan <PiArrowRightBold />
                            </button>
                        </div>
                        {/* Hover info face */}
                        <div className="absolute inset-0 bg-slate-50 p-8 flex flex-col justify-between transition-transform duration-500 translate-y-full group-hover:translate-y-0">
                            <div>
                                <h4 className="text-lg font-black text-slate-900 border-b pb-2 border-slate-200">PTE Free Package Includes</h4>
                                <ul className="space-y-2.5 mt-4">
                                    {[
                                        "1 full-length simulated mock exam",
                                        "15 speaking & writing practice tasks",
                                        "Real-time scoring diagnostics (first 5 submissions)",
                                        "Comprehensive templates & exam strategy keys"
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-center gap-2 text-xs text-slate-600">
                                            <FiCheck className="text-cta-btn w-4 h-4 shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="text-xs font-extrabold text-cta-btn flex items-center gap-1.5 self-end">
                                Start PTE Free Plan <PiArrowRightBold />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Free Resources Section (Moved after Pricing) */}
            <section className="py-16 bg-white border-t border-b border-slate-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Suspense fallback={<div className="h-40 w-full animate-pulse bg-slate-100 rounded-3xl" />}>
                        <FreeResources />
                    </Suspense>
                </div>
            </section>
        </div>
    );
}
