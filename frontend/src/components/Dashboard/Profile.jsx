import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAuth from "../../hooks/useAuth";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import Loader from "../Loader/Loader";
import { toast } from "react-toastify";
import { 
    PiUserCircleFill, 
    PiEnvelopeSimpleFill, 
    PiCrownFill, 
    PiShieldCheckFill,
    PiCalendarBlankFill,
    PiIdentificationCardFill,
    PiPencilFill,
    PiStarFill,
    PiLightningFill,
    PiSparkleFill,
    PiBuildingsFill,
    PiPhoneFill,
    PiMapPinFill,
    PiCheckCircleFill
} from "react-icons/pi";
import { Link } from "react-router";

const PLAN_CONFIG = {
    free: {
        name: "Free Tier",
        color: "bg-white/5 border-white/10 text-white/60",
        icon: null,
        benefits: [
            "Free Listening and Reading Test Access",
            "Basic Performance Tracking"
        ],
        buttonText: "Upgrade to Elite Premium",
        buttonColor: "btn-warning"
    },
    standard: {
        name: "Standard",
        color: "bg-indigo-500/20 border-indigo-500/40 text-indigo-300",
        icon: <PiStarFill />,
        benefits: [
            "30 Full Mock Tests Monthly",
            "AI Writing Feedback",
            "Extended Test Access",
            "Advanced Analytics"
        ],
        buttonText: "Upgrade to Elite Premium",
        buttonColor: "btn-primary"
    },
    premium: {
        name: "Elite Premium",
        color: "bg-amber-500/20 border-amber-500/40 text-amber-300",
        icon: <PiCrownFill />,
        benefits: [
            "Unlimited Full Mock Tests",
            "AI-Powered Writing Evaluation",
            "Speaking Test Priority Access",
            "Detailed Growth Analytics"
        ],
        buttonText: "Plan Active",
        buttonColor: "btn-disabled"
    },
    admin: {
        name: "Administrator",
        color: "bg-red-500/20 border-red-500/40 text-red-300",
        icon: <PiLightningFill />,
        benefits: [
            "Full System Access",
            "User Management Rights",
            "Content Moderation",
            "System Performance Metrics"
        ],
        buttonText: "Admin Access",
        buttonColor: "btn-error"
    },
    instructor: {
        name: "Official Instructor",
        color: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
        icon: <PiPencilFill />,
        benefits: [
            "Review All Student Submissions",
            "Grade Writing & Speaking Labs",
            "Professional Feedback Tools",
            "Manage Student Progress"
        ],
        buttonText: "Instructor Panel",
        buttonColor: "btn-success"
    }
};

const Profile = () => {
    const { user: authUser } = useAuth();
    const axiosSecure = useAxiosSecure();
    const queryClient = useQueryClient();

    const { data: userData, isLoading } = useQuery({
        queryKey: ["user-profile", authUser?.email],
        queryFn: async () => {
            const { data } = await axiosSecure.get(`/user/${authUser?.email}`);
            return data?.user || null;
        },
        enabled: !!authUser?.email
    });

    const mutation = useMutation({
        mutationFn: async (targetExam) => {
            const { data } = await axiosSecure.patch(`/user/${userData?._id}/exam-preference`, { targetExam });
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["user-profile", authUser?.email] });
            toast.success(`Target exam preference updated to ${data?.user?.targetExam}!`);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to update exam preference");
        }
    });

    if (isLoading) return <Loader />;

    const name = userData?.name || authUser?.displayName || authUser?.email?.split('@')[0] || 'Student';
    const rawPlan = (userData?.role === 'admin' ? 'admin' : (userData?.role === 'instructor' ? 'instructor' : (userData?.plan || 'free'))).toLowerCase();
    const config = PLAN_CONFIG[rawPlan] || PLAN_CONFIG.free;

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
            className="max-w-4xl mx-auto space-y-10 pb-20"
        >
            {/* --- DIGITAL ID CARD --- */}
            <motion.section 
                variants={item}
                className="relative overflow-hidden rounded-[3.5rem] bg-linear-to-br from-indigo-900 to-slate-900 p-12 text-white shadow-2xl"
            >
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-white/10 backdrop-blur-xl border-4 border-white/20 flex items-center justify-center text-6xl shadow-2xl">
                            {authUser?.photoURL ? (
                                <img src={authUser.photoURL} alt={name} className="w-full h-full object-cover rounded-[2.5rem]" />
                            ) : (
                                <PiUserCircleFill className="text-white/40" />
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-primary p-2 rounded-xl shadow-lg">
                            <PiPencilFill className="text-xs" />
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="text-center md:text-left space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border border-white/10">
                            <PiIdentificationCardFill /> Digital {userData?.role || 'Student'} ID
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black tracking-tighter capitalize">{name}</h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-white/60">
                                <PiEnvelopeSimpleFill className="text-primary" /> {userData?.email || authUser?.email}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-white/60">
                                <PiCalendarBlankFill className="text-primary" /> Joined {new Date(userData?.createdAt || authUser?.metadata?.creationTime).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    {/* Plan Badge */}
                    <div className="md:ml-auto text-center md:text-right">
                        <div className={`px-6 py-4 rounded-4xl border backdrop-blur-md shadow-xl ${config.color}`}>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Current Tier</div>
                            <div className="text-2xl font-black flex items-center justify-center md:justify-end gap-2">
                                {config.icon}
                                {config.name}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
            </motion.section>

            {/* --- ACCOUNT DETAILS --- */}
            <div className="grid gap-8 md:grid-cols-2">
                <motion.section variants={item} className="card bg-white border border-base-300 p-10 rounded-[3rem] shadow-sm">
                    <h2 className="text-xl font-black tracking-tight mb-8 flex items-center gap-3">
                        <PiShieldCheckFill className="text-primary text-2xl" />
                        Account Security
                    </h2>
                    <div className="space-y-6">
                        <div className="p-5 bg-base-100 rounded-3xl border border-base-200">
                            <div className="text-[10px] font-black uppercase tracking-widest text-base-content/40 mb-1">Auth Provider</div>
                            <div className="font-bold capitalize">{authUser?.providerData?.[0]?.providerId?.split('.')[0] || 'Firebase'}</div>
                        </div>
                        <div className="p-5 bg-base-100 rounded-3xl border border-base-200">
                            <div className="text-[10px] font-black uppercase tracking-widest text-base-content/40 mb-1">Account Status</div>
                            <div className="flex items-center gap-2 font-bold text-success">
                                <PiShieldCheckFill /> {userData?.isBanned ? 'Restricted' : 'Verified Security Status'}
                            </div>
                        </div>
                        <div className="p-5 bg-base-100 rounded-3xl border border-base-200">
                            <div className="text-[10px] font-black uppercase tracking-widest text-base-content/40 mb-1">Target Exam Preference</div>
                            {mutation.isPending ? (
                                <span className="loading loading-spinner loading-xs mt-1"></span>
                            ) : (
                                <select
                                    value={userData?.targetExam || "IELTS"}
                                    onChange={(e) => mutation.mutate(e.target.value)}
                                    className="w-full bg-transparent font-bold text-sm outline-none focus:ring-0 cursor-pointer pt-1"
                                >
                                    <option value="IELTS">IELTS Preparation</option>
                                    <option value="PTE">PTE Academic Preparation</option>
                                    {(userData?.role === "admin" || userData?.role === "instructor") && (
                                        <option value="BOTH">Both IELTS & PTE Programs</option>
                                    )}
                                </select>
                            )}
                        </div>

                        {/* Institution Affiliation Card */}
                        <div className="p-6 bg-gradient-to-br from-indigo-50/70 to-slate-50 rounded-3xl border border-indigo-100 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <PiBuildingsFill className="text-xl text-primary" />
                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                        Institutional Profile
                                    </span>
                                </div>
                                {userData?.institution ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                        <PiCheckCircleFill className="text-xs" /> Active Affiliate
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2.5 py-0.5 rounded-full border border-slate-200">
                                        B2C Independent
                                    </span>
                                )}
                            </div>

                            {userData?.institution ? (
                                <div className="space-y-3 pt-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100/60 pb-3">
                                        <div>
                                            <h4 className="text-base font-black text-slate-900 leading-tight">
                                                {userData.institution.name}
                                            </h4>
                                            <p className="text-xs font-medium text-slate-500 mt-0.5">
                                                Evaluations scoped to certified institute evaluators.
                                            </p>
                                        </div>
                                        <div className="shrink-0">
                                            <span className="px-3 py-1.5 rounded-xl bg-primary text-white font-mono font-black text-xs shadow-md shadow-primary/20 tracking-wider">
                                                {userData.institution.code}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 font-medium">
                                        {userData.institution.contactEmail && (
                                            <div className="flex items-center gap-2">
                                                <PiEnvelopeSimpleFill className="text-indigo-500 text-sm shrink-0" />
                                                <span className="truncate">{userData.institution.contactEmail}</span>
                                            </div>
                                        )}
                                        {userData.institution.contactPhone && (
                                            <div className="flex items-center gap-2">
                                                <PiPhoneFill className="text-indigo-500 text-sm shrink-0" />
                                                <span>{userData.institution.contactPhone}</span>
                                            </div>
                                        )}
                                        {userData.institution.address && (
                                            <div className="flex items-center gap-2 sm:col-span-2">
                                                <PiMapPinFill className="text-indigo-500 text-sm shrink-0" />
                                                <span className="truncate">{userData.institution.address}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 pt-1">
                                    <p className="text-xs font-medium text-slate-500">
                                        You are registered as an independent student. Enter your academy code below to link your account.
                                    </p>
                                    <form
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            const code = e.target.instCode.value.trim();
                                            if (!code) return;
                                            try {
                                                const res = await axiosSecure.patch("/user/join-institution", { institutionCode: code });
                                                if (res.data.success) {
                                                    toast.success(res.data.message);
                                                    queryClient.invalidateQueries(["user-profile", authUser?.email]);
                                                }
                                            } catch (err) {
                                                toast.error(err.response?.data?.message || "Failed to join institution");
                                            }
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        <input
                                            name="instCode"
                                            type="text"
                                            required
                                            placeholder="Enter Code (e.g. OXFORD2026)"
                                            className="input input-sm border-slate-300 font-mono uppercase font-bold text-xs grow focus:ring-2 focus:ring-primary rounded-xl"
                                        />
                                        <button type="submit" className="btn btn-sm btn-primary text-xs font-bold px-4 rounded-xl shadow-md">
                                            Join Institute
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.section>

                <motion.section variants={item} className="card bg-white border border-base-300 p-10 rounded-[3rem] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 text-primary/5 text-9xl">
                        <PiSparkleFill />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-xl font-black tracking-tight mb-8 flex items-center gap-3">
                            {config.icon || <PiCrownFill className="text-amber-500 text-2xl" />}
                            {config.name} Benefits
                        </h2>
                        <ul className="space-y-4 mb-10">
                            {config.benefits.map((benefit, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-sm font-bold text-base-content/60">
                                    <PiShieldCheckFill className="text-success text-lg" />
                                    {benefit}
                                </li>
                            ))}
                        </ul>
                        {rawPlan !== 'premium' && rawPlan !== 'admin' && (
                            <Link to={rawPlan === 'instructor' ? '/dashboard' : '/pricing'} className={`btn ${config.buttonColor} btn-block rounded-2xl h-14 font-black shadow-xl shadow-warning/20`}>
                                {config.buttonText}
                            </Link>
                        )}
                    </div>
                </motion.section>
            </div>

            <motion.section variants={item} className="p-8 text-center bg-primary/5 rounded-[2.5rem] border border-primary/10">
                <p className="text-xs font-bold text-primary/60 italic leading-relaxed">
                    "Your MOCKEA profile is your official gateway to IELTS excellence. Keep your details updated to receive the most accurate performance insights."
                </p>
            </motion.section>
        </motion.div>
    );
};

export default Profile;
