import { motion } from "framer-motion";
import { PiMagnifyingGlassFill, PiCalendar, PiClockFill, PiPencilLine, PiMicrophoneStage } from "react-icons/pi";

const MockTestSubmissionsTable = ({ loadingMock, results, user, handleOpenMockEval }) => {
    if (loadingMock) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-base-300 animate-pulse rounded-3xl" />
                ))}
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="card bg-white border border-base-300 p-20 flex flex-col items-center justify-center text-center space-y-4 rounded-[3rem]">
                <PiMagnifyingGlassFill className="text-6xl text-base-content/10" />
                <h3 className="text-xl font-black opacity-30 uppercase tracking-tighter">No Mock Tests to Grade</h3>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            {results.map((result) => (
                <div key={result._id} className="card bg-white border border-base-300 shadow-sm overflow-hidden hover:shadow-xl transition-all rounded-[2.5rem] group">
                    <div className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="avatar placeholder">
                                <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary font-black text-2xl group-hover:bg-primary group-hover:text-white transition-all">
                                    {result.userId?.name?.[0]}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-slate-800">{result.userId?.name}</h3>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{result.testId?.title}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-base-content/20 flex items-center gap-1">
                                        <PiCalendar /> {new Date(result.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            {(result.lockedBy && new Date(result.lockExpiresAt) > new Date() && result.lockedByEmail !== (user?.email || localStorage.getItem('user_email'))) && (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                                    <PiClockFill className="animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Locked by {result.lockedByName || result.lockedByEmail?.split('@')[0]}</span>
                                </div>
                            )}
                            {['writing', 'speaking'].map(type => {
                                const section = result.sectionResults?.find(s => s.sectionType === type);
                                if (!section) return null;

                                const currentUserEmail = user?.email || localStorage.getItem('user_email');
                                const isLockedByOther = result.lockedBy && new Date(result.lockExpiresAt) > new Date() && result.lockedByEmail !== currentUserEmail;

                                return (
                                    <div key={type} className={`flex items-center gap-5 p-5 rounded-4xl border transition-all ${
                                        section.isGraded ? "bg-emerald-50/50 border-emerald-500/20" : "bg-warning/5 border-warning/20 border-dashed"
                                    }`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${section.isGraded ? 'bg-emerald-500 text-white' : 'bg-warning/10 text-warning'}`}>
                                            {type === 'writing' ? <PiPencilLine /> : <PiMicrophoneStage />}
                                        </div>
                                        <div className="flex flex-col min-w-[120px]">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{type}</span>
                                            {section.isGraded ? (
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-lg font-black text-emerald-600">{section.score}</span>
                                                    <button
                                                        onClick={() => handleOpenMockEval(result._id, type, true)}
                                                        className="btn btn-xs rounded-xl btn-ghost text-slate-400 hover:text-primary hover:bg-slate-100 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider"
                                                        title="View Evaluation"
                                                    >
                                                        👁 Review
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <button
                                                        onClick={() => handleOpenMockEval(result._id, type, false)}
                                                        disabled={isLockedByOther}
                                                        className="btn btn-primary btn-sm rounded-xl px-4 font-black text-[10px] uppercase tracking-wider shadow-md shadow-primary/20"
                                                    >
                                                        Evaluate
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ))}
        </motion.div>
    );
};

export default MockTestSubmissionsTable;
