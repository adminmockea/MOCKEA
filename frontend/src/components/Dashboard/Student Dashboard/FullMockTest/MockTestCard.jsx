import { 
    PiBookOpenFill, 
    PiEarFill, 
    PiPencilLineFill, 
    PiMicrophoneStageFill,
    PiPlayCircleFill,
    PiUsersBold,
    PiLockKeyFill,
    PiClockFill,
    PiArrowRightBold
} from "react-icons/pi";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { DEFAULT_MOCK_TEST_DURATION_MINUTES } from "../../../../constants";

const MockTestCard = ({ test, index, userPlan = "free", userRole = "student", isStandardLimitReached = false, onStart, onMouseEnter }) => {
    const isAdminOrInstructor = userRole === "admin" || userRole === "instructor";
    const planHierarchy = { free: 0, standard: 1, premium: 2 };
    const isTierLocked = !isAdminOrInstructor && (planHierarchy[userPlan] < planHierarchy[test.planType || "free"]);
    const isLocked = isTierLocked || isStandardLimitReached || isAdminOrInstructor;

    const handleStartClick = () => {
        if (isAdminOrInstructor) {
            toast.error("Access Denied: Admins and Instructors are not permitted to take mock tests.");
            return;
        }
        if (isTierLocked) {
            toast.error(`This is a ${test.planType} test. Please upgrade your plan to access it!`);
            return;
        }
        if (isStandardLimitReached) {
            toast.warning(`Daily limit reached: Standard plan users are limited to 1 mock test per day. Upgrade to Premium for unlimited access!`);
            return;
        }
        onStart();
    };

    const sectionIcons = [
        { type: 'listening', icon: <PiEarFill />, color: 'text-emerald-500' },
        { type: 'reading', icon: <PiBookOpenFill />, color: 'text-blue-500' },
        { type: 'writing', icon: <PiPencilLineFill />, color: 'text-purple-500' },
        { type: 'speaking', icon: <PiMicrophoneStageFill />, color: 'text-orange-500' },
    ];

    return (
        <motion.div 
            whileHover={{ y: -8 }}
            onMouseEnter={onMouseEnter}
            className="group relative flex flex-col rounded-[3rem] bg-white border border-base-300 p-10 shadow-sm transition-all hover:shadow-2xl hover:border-primary/30"
        >
            {/* Status Badge */}
            <div className="absolute top-8 right-8 flex items-center gap-2">
                {isAdminOrInstructor && (
                    <div className="px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl border flex items-center gap-1.5 shadow-sm bg-red-500/10 text-red-600 border-red-500/20">
                        <PiLockKeyFill className="w-3 h-3" />
                        Staff Blocked
                    </div>
                )}
                {isStandardLimitReached && !isAdminOrInstructor && (
                    <div className="px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl border flex items-center gap-1.5 shadow-sm bg-orange-500/10 text-orange-600 border-orange-500/20">
                        <PiLockKeyFill className="w-3 h-3" />
                        Limit Reached
                    </div>
                )}
                {test.planType !== 'free' && !isStandardLimitReached && !isAdminOrInstructor && (
                    <div className={`px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl border flex items-center gap-1.5 shadow-sm ${
                        test.planType === 'premium' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-primary/10 text-primary border-primary/20"
                    }`}>
                        {isLocked ? <PiLockKeyFill className="w-3 h-3" /> : <PiPlayCircleFill className="w-3 h-3" />}
                        {test.planType}
                    </div>
                )}
            </div>

            <div className="flex flex-col h-full space-y-10">
                {/* Main Info */}
                <div className="flex items-start gap-6">
                    <div className="text-8xl font-black text-primary/5 select-none leading-none -mt-4 -ml-4 absolute group-hover:text-primary/10 transition-colors">
                        {index < 10 ? `0${index}` : index}
                    </div>
                    <div className="relative z-10 pt-2 space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-8 rounded-full bg-primary/20" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-base-content/30">Official Mock Module</p>
                        </div>
                        <h3 className="text-3xl font-black tracking-tighter group-hover:text-primary transition-colors" title={test.title || `Mock Assessment ${index}`}>
                            {test.title || `Mock Assessment ${index}`}
                        </h3>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-base-content/40 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><PiClockFill className="text-primary/50" /> {test.totalDuration || DEFAULT_MOCK_TEST_DURATION_MINUTES} Minutes</span>
                            <span className="flex items-center gap-1.5"><PiUsersBold className="text-primary/50" /> Live Environment</span>
                        </div>
                    </div>
                </div>

                {/* Section Visualization */}
                <div className="flex items-center gap-6 p-6 rounded-[2rem] bg-base-100/50 border border-base-200">
                    <div className="flex -space-x-3">
                        {sectionIcons.map((s, i) => (
                            <div 
                                key={i}
                                className={`w-12 h-12 rounded-2xl bg-white border border-base-200 flex items-center justify-center text-xl shadow-sm transition-transform hover:z-20 hover:scale-110 ${s.color}`}
                            >
                                {s.icon}
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-base-content/30 leading-none mb-1">Coverage</span>
                        <span className="text-xs font-bold text-base-content/60">Reading, Listening, Writing, Speaking</span>
                    </div>
                </div>

                {/* Footer Action */}
                <button 
                    onClick={handleStartClick}
                    className={`btn w-full rounded-[1.8rem] h-16 text-sm font-black uppercase tracking-[0.2em] gap-4 border-none shadow-xl transition-all ${
                        isLocked 
                        ? "bg-base-200 text-base-content/30 cursor-not-allowed" 
                        : "bg-slate-900 text-white hover:bg-primary shadow-slate-900/10 hover:shadow-primary/30"
                    }`}
                >
                    {isLocked ? (
                        <>
                            <PiLockKeyFill className="w-5 h-5 opacity-40" />
                            {isAdminOrInstructor ? "Staff Locked" : (isStandardLimitReached ? "Daily Limit Reached" : "Locked Module")}
                        </>
                    ) : (
                        <>
                            Enter Assessment Lab
                            <PiArrowRightBold className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
};

export default MockTestCard;
