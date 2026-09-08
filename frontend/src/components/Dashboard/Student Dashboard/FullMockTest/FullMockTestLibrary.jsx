import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
    PiBookOpenFill, 
    PiEarFill, 
    PiPencilLineFill, 
    PiMicrophoneStageFill,
    PiClockFill,
    PiCardsFill,
    PiSealCheckFill,
    PiCrownFill,
    PiSparkleFill
} from "react-icons/pi";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MockTestCard from "./MockTestCard";
import InstructionModal from "./InstructionModal";
import useAxiosSecure from "../../../../hooks/useAxiosSecure";
import useUserProfile from "../../../../hooks/useUserProfile";
import Loader from "../../../Loader/Loader";
import CardSkeleton from "../../../Common/Skeleton/CardSkeleton";

const FullMockTestLibrary = () => {
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();
    const [selectedTest, setSelectedTest] = useState(null);

    const handlePrefetch = (id) => {
        queryClient.prefetchQuery({
            queryKey: ["test-session", id],
            queryFn: async () => {
                const res = await axiosSecure.get(`/mock-tests/${id}`);
                return res.data.test;
            },
            staleTime: 5 * 60 * 1000,
        });
    };

    const { userData, isLoading: profileLoading } = useUserProfile();
    const userPlan = userData?.plan || "free";
    const userRole = userData?.role || "student";

    useEffect(() => {
        // Cleanup expired test caches older than 24 hours
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('test_cache_')) {
                try {
                    const cached = JSON.parse(localStorage.getItem(key));
                    if (cached && cached.timestamp) {
                        const ageInHours = (Date.now() - cached.timestamp) / (1000 * 60 * 60);
                        if (ageInHours > 24) {
                            localStorage.removeItem(key);
                        }
                    } else if (cached && !cached.timestamp) {
                        // Migrate pre-existing cache objects to expire in 24 hours
                        cached.timestamp = Date.now();
                        localStorage.setItem(key, JSON.stringify(cached));
                    }
                // eslint-disable-next-line no-unused-vars
                } catch (e) {
                    localStorage.removeItem(key); // Clear corrupted cache
                }
            }
        });
    }, []);

    const { data: mockTestData, isLoading: testsLoading } = useQuery({
        queryKey: ["full-mock-tests"],
        queryFn: async () => {
            const res = await axiosSecure.get("/mock-tests");
            return {
                tests: res.data.tests ?? [],
                todayMockTestTaken: res.data.todayMockTestTaken ?? false
            };
        }
    });

    const tests = mockTestData?.tests ?? [];
    const todayMockTestTaken = mockTestData?.todayMockTestTaken ?? false;

    if (profileLoading) {
        return <Loader />;
    }

    if (userRole !== "admin" && userRole !== "instructor" && userPlan === "free") {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="min-h-[80vh] flex items-center justify-center p-6"
            >
                <div className="relative overflow-hidden w-full max-w-2xl rounded-[3.5rem] bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 p-12 lg:p-16 text-center text-white shadow-2xl border border-white/10 animate-fade-in">
                    <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
                    <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

                    <div className="relative z-10 space-y-8">
                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-4xl text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-500/5">
                            <PiCrownFill />
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl lg:text-5xl font-black tracking-tight leading-none">
                                Unlock Mock Exams
                            </h2>
                            <p className="text-sm lg:text-base text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                                Experience realistic timed IELTS test simulations, complete integrity shielding, automated Reading/Listening scoring, and personal examiner grading.
                            </p>
                        </div>

                        <div className="pt-4">
                            <a 
                                href="/pricing"
                                className="btn btn-primary btn-lg rounded-[2rem] px-10 font-black uppercase tracking-widest text-xs h-16 shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
                            >
                                Upgrade Plan
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    const stats = [
        { label: "Available Modules", value: tests.length, icon: <PiCardsFill />, color: "bg-blue-500" },
        { label: "Practice Units", value: tests.length * 4, icon: <PiBookOpenFill />, color: "bg-purple-500" },
        { label: "Total Duration", value: (tests.reduce((acc, t) => acc + (t.totalDuration || 0), 0) / 60).toFixed(1) + "h", icon: <PiClockFill />, color: "bg-orange-500" },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="min-h-screen space-y-12 pb-24"
        >
            {/* --- IMMERSIVE HEADER --- */}
            <motion.section 
                variants={item}
                className="relative overflow-hidden rounded-[3.5rem] bg-linear-to-br from-primary to-indigo-700 p-12 lg:p-20 text-white shadow-2xl shadow-primary/30"
            >
                <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-white border border-white/20 backdrop-blur-md">
                        <PiSealCheckFill /> Standardized Testing
                    </div>
                    <div className="max-w-3xl">
                        <h1 className="text-4xl lg:text-7xl font-black tracking-tighter leading-[0.9]">
                            Full Mock Test <span className="text-yellow-300">Library</span>
                        </h1>
                        <p className="mt-6 text-lg lg:text-xl text-white/80 font-medium leading-relaxed max-w-2xl">
                            Simulate the actual IELTS environment. Four complete sections designed to test your endurance and precision.
                        </p>
                    </div>

                    {/* Section Pill Filters */}
                    <div className="flex flex-wrap gap-3 pt-6">
                        {[
                            { label: "Listening", time: "40m", icon: <PiEarFill />, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
                            { label: "Reading", time: "60m", icon: <PiBookOpenFill />, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
                            { label: "Writing", time: "60m", icon: <PiPencilLineFill />, color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
                            { label: "Speaking", time: "15m", icon: <PiMicrophoneStageFill />, color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
                        ].map((s) => (
                            <div key={s.label} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${s.color}`}>
                                {s.icon} <span>{s.label} · {s.time}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Floating Stats Bar In Header */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
                    {stats.map((s) => (
                        <div key={s.label} className="flex items-center gap-5 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                            <div className={`h-12 w-12 rounded-2xl ${s.color} flex items-center justify-center text-xl text-white shadow-lg`}>
                                {s.icon}
                            </div>
                            <div>
                                <div className="text-2xl font-black tracking-tighter">{s.value}</div>
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-primary-focus/20 blur-3xl" />
            </motion.section>

            {/* --- STANDARD TIER INFO BANNER --- */}
            {userRole !== "admin" && userRole !== "instructor" && userPlan === "standard" && (
                <motion.div 
                    variants={item}
                    className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/20 backdrop-blur-md shadow-sm"
                >
                    <div className="flex items-center gap-5">
                        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-2xl text-amber-500 border border-amber-500/20">
                            <PiSparkleFill />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight text-base-content">Standard Plan daily credit</h3>
                            <p className="text-sm text-base-content/60 font-medium">
                                You are allowed **1 full mock test per day**. Choose your assessment wisely!
                            </p>
                        </div>
                    </div>
                    {todayMockTestTaken && (
                        <div className="badge badge-error gap-2 font-black uppercase tracking-widest text-[10px] px-5 py-4 rounded-xl shadow-md">
                            Daily Limit Used
                        </div>
                    )}
                </motion.div>
            )}

            {/* --- FREE PRACTICE SECTION --- */}
            <motion.section variants={item} className="space-y-8">
                <div className="flex items-center justify-between px-4">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <PiSparkleFill className="text-emerald-500" />
                            Essential Practice
                        </h2>
                        <p className="text-xs font-bold text-base-content/30 uppercase tracking-widest mt-1">Foundation Level Modules</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {testsLoading ? (
                        <CardSkeleton count={2} />
                    ) : (
                        tests.filter(t => t.planType === 'free').map((test, index) => (
                            <MockTestCard 
                                key={test._id} 
                                test={test} 
                                index={index + 1} 
                                userPlan={userPlan}
                                userRole={userRole}
                                isStandardLimitReached={todayMockTestTaken && userPlan === 'standard' && userRole !== 'admin' && userRole !== 'instructor'}
                                onStart={() => setSelectedTest(test)} 
                                onMouseEnter={() => handlePrefetch(test._id)}
                            />
                        ))
                    )}
                </div>
            </motion.section>

            {/* --- PREMIUM SECTION --- */}
            {(testsLoading || tests.some(t => t.planType !== 'free')) && (
                <motion.section variants={item} className="space-y-8 pt-12">
                    <div className="flex items-center justify-between px-4">
                        <div>
                            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                <PiCrownFill className="text-yellow-500" />
                                Elite Modules
                            </h2>
                            <p className="text-xs font-bold text-base-content/30 uppercase tracking-widest mt-1">High-Impact Training Sessions</p>
                        </div>
                        <span className="badge badge-primary font-black uppercase tracking-widest text-[10px] px-4 py-4 rounded-xl shadow-lg shadow-primary/20">Members Only</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {testsLoading ? (
                            <CardSkeleton count={2} />
                        ) : (
                            tests.filter(t => t.planType !== 'free').map((test, index) => (
                                <MockTestCard 
                                    key={test._id} 
                                    test={test} 
                                    index={index + 1} 
                                    userPlan={userPlan}
                                    userRole={userRole}
                                    isStandardLimitReached={todayMockTestTaken && userPlan === 'standard' && userRole !== 'admin' && userRole !== 'instructor'}
                                    onStart={() => setSelectedTest(test)} 
                                    onMouseEnter={() => handlePrefetch(test._id)}
                                />
                            ))
                        )}
                    </div>
                </motion.section>
            )}

            {selectedTest && (
                <InstructionModal 
                    test={selectedTest} 
                    onClose={() => setSelectedTest(null)} 
                />
            )}
        </motion.div>
    );
};

export default FullMockTestLibrary;
