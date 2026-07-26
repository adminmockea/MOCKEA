import { motion } from "framer-motion";
import { 
    PiMagnifyingGlassFill, 
    PiNotePencilFill, 
    PiMicrophoneStageFill, 
    PiArrowRightBold, 
    PiUserCircleFill, 
    PiXCircleFill, 
    PiClockFill 
} from "react-icons/pi";
import { parseSpeakingSubmission, parseWritingSubmission, calculateIeltsBand } from "../../../../utils/gradingUtils";

const SkillLabSubmissionsTable = ({
    submissions,
    filter,
    setFilter,
    selectedSubmission,
    setSelectedSubmission,
    user,
    reviewData,
    setReviewData,
    submitting,
    handleReviewSubmit
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
        >
            {!selectedSubmission && (
                <div className="flex items-center gap-4 bg-white p-4 rounded-4xl border border-base-300 shadow-sm w-fit">
                    <select 
                        className="select select-sm border-none focus:ring-0 font-black text-[10px] uppercase tracking-widest"
                        value={filter.status}
                        onChange={(e) => setFilter({...filter, status: e.target.value})}
                    >
                        <option value="pending">Pending Review</option>
                        <option value="reviewed">Already Reviewed</option>
                    </select>
                    <div className="w-px h-6 bg-base-300" />
                    <select 
                        className="select select-sm border-none focus:ring-0 font-black text-[10px] uppercase tracking-widest"
                        value={filter.testType}
                        onChange={(e) => setFilter({...filter, testType: e.target.value})}
                    >
                        <option value="">All Skills</option>
                        <option value="writing">Writing</option>
                        <option value="speaking">Speaking</option>
                    </select>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* List Side */}
                {!selectedSubmission && (
                    <div className="lg:col-span-12 space-y-4 h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar pr-2">
                        {submissions.length === 0 ? (
                            <div className="card bg-white border border-base-300 p-20 flex flex-col items-center justify-center text-center space-y-4 rounded-[3rem]">
                                <PiMagnifyingGlassFill className="text-6xl text-base-content/10" />
                                <h3 className="text-xl font-black opacity-30 uppercase tracking-tighter">No Lab Submissions</h3>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                                {submissions.map((sub) => {
                                    const isLocked = sub.lockedBy && new Date(sub.lockExpiresAt) > new Date();
                                    const currentUserEmail = user?.email || localStorage.getItem('user_email');
                                    const isLockedByMe = sub.lockedByEmail === currentUserEmail;
                                    const currentlyLockedByOther = isLocked && !isLockedByMe;

                                    return (
                                        <div 
                                            key={sub._id}
                                            onClick={() => !currentlyLockedByOther && setSelectedSubmission(sub)}
                                            className={`card p-6 border transition-all cursor-pointer group relative overflow-hidden ${
                                                selectedSubmission?._id === sub._id 
                                                ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/20 rounded-[2.5rem]' 
                                                : currentlyLockedByOther
                                                ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed rounded-4xl'
                                                : 'bg-white border-base-300 hover:border-primary/50 rounded-4xl'
                                            }`}
                                        >
                                            {currentlyLockedByOther && (
                                                <div className="absolute top-2 right-4 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                    <PiClockFill className="animate-pulse" /> Locked by {sub.lockedByName || sub.lockedByEmail?.split('@')[0]}
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${selectedSubmission?._id === sub._id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                                                        {sub.testType === 'writing' ? <PiNotePencilFill /> : <PiMicrophoneStageFill />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black leading-tight text-sm uppercase tracking-tight">{sub.userName}</h4>
                                                        <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${selectedSubmission?._id === sub._id ? 'text-white/60' : 'text-slate-400'}`}>
                                                            {sub.title}
                                                        </p>
                                                    </div>
                                                </div>
                                                {!currentlyLockedByOther && (
                                                    <PiArrowRightBold className={`opacity-0 group-hover:opacity-100 transition-all ${selectedSubmission?._id === sub._id ? 'text-white' : 'text-primary'}`} />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Evaluation Side */}
                {selectedSubmission && (
                    <motion.div 
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="lg:col-span-12 space-y-8"
                    >
                        <div className="card bg-white border border-base-300 rounded-[3.5rem] shadow-sm overflow-hidden flex flex-col h-[calc(100vh-100px)]">
                            <div className="px-10 py-6 border-b border-base-200 bg-base-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <PiUserCircleFill className="text-4xl text-primary" />
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight">{selectedSubmission.userName}</h3>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedSubmission.userEmail}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedSubmission(null)} 
                                    className="btn btn-ghost btn-sm rounded-xl font-black uppercase text-[10px] flex items-center gap-1.5 hover:bg-rose-50 hover:text-rose-600 transition-colors px-3 py-1.5"
                                >
                                    <PiXCircleFill className="text-lg" /> Back to List
                                </button>
                            </div>
                            
                            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                                {/* Left Pane: Student Submission Content */}
                                <div className="flex-1 overflow-y-auto p-10 border-r border-base-200 custom-scrollbar space-y-6">
                                    <div className="flex items-center justify-between border-b pb-4 mb-4">
                                        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Student Submission</h5>
                                        <span className="badge badge-primary font-black text-[9px] uppercase tracking-wider">{selectedSubmission.testType}</span>
                                    </div>
                                    
                                    {selectedSubmission.testType === 'speaking' ? (
                                        <div className="space-y-6">
                                            {parseSpeakingSubmission(selectedSubmission.content).map((part, partIdx) => (
                                                <div key={partIdx} className="space-y-3 col-span-full">
                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-1 mt-2">{part.title}</h5>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {part.items.map((item, itemIdx) => (
                                                            <div key={itemIdx} className="p-4 bg-base-50 border border-base-200 rounded-2xl space-y-2 shadow-inner">
                                                                <span className="badge badge-primary font-black text-[8px] uppercase tracking-wider">{item.label}</span>
                                                                <p className="text-xs font-bold text-slate-700 leading-tight">{item.question}</p>
                                                                {item.audioUrl ? (
                                                                    <audio controls src={item.audioUrl} className="w-full h-8 mt-2" />
                                                                ) : (
                                                                    <p className="text-[10px] text-slate-400 italic">No audio recorded for this question</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {(() => {
                                                const parsed = parseWritingSubmission(selectedSubmission.content);
                                                if (parsed.task2) {
                                                    return (
                                                        <div className="space-y-6">
                                                            <div className="p-6 bg-base-50 border border-base-200 rounded-3xl space-y-2">
                                                                <span className="badge badge-primary font-black text-[9px] uppercase tracking-wider">Task 1 Answer</span>
                                                                <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">{parsed.task1}</p>
                                                            </div>
                                                            <div className="p-6 bg-base-50 border border-base-200 rounded-3xl space-y-2">
                                                                <span className="badge badge-secondary font-black text-[9px] uppercase tracking-wider">Task 2 Answer</span>
                                                                <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">{parsed.task2}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div className="p-6 bg-base-50 border border-base-200 rounded-3xl">
                                                        <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedSubmission.content}</p>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>

                                {/* Right Pane: Evaluation Form */}
                                <div className="w-full md:w-[450px] bg-slate-50/50 p-8 overflow-y-auto custom-scrollbar flex flex-col justify-between">
                                    <form onSubmit={handleReviewSubmit} className="space-y-6">
                                        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Instructor Evaluation</h5>

                                        {selectedSubmission.testType === 'writing' ? (
                                            <div className="space-y-6">
                                                {/* Task 1 Rubrics */}
                                                <div className="p-4 bg-white border border-base-200 rounded-2xl space-y-3 shadow-xs">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-xs">Task 1 Rubrics</span>
                                                        <span className="badge badge-sm badge-outline font-black">{calculateIeltsBand([reviewData.task1?.criteria?.ta, reviewData.task1?.criteria?.cc, reviewData.task1?.criteria?.lr, reviewData.task1?.criteria?.gra]).toFixed(1)}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                        {[['ta', 'Task Achievement'], ['cc', 'Coherence & Cohesion'], ['lr', 'Lexical Resource'], ['gra', 'Grammar Range']].map(([key, label]) => (
                                                            <div key={key}>
                                                                <label className="block text-slate-400 font-bold mb-1">{label}</label>
                                                                <select
                                                                    className="select select-xs select-bordered w-full font-mono font-bold"
                                                                    value={reviewData.task1?.criteria?.[key] || ""}
                                                                    onChange={(e) => setReviewData({
                                                                        ...reviewData,
                                                                        task1: {
                                                                            ...reviewData.task1,
                                                                            criteria: { ...reviewData.task1?.criteria, [key]: e.target.value }
                                                                        }
                                                                    })}
                                                                >
                                                                    <option value="">Band</option>
                                                                    {[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map(b => (
                                                                        <option key={b} value={b}>{b}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <textarea
                                                        className="textarea textarea-xs textarea-bordered w-full"
                                                        placeholder="Task 1 feedback..."
                                                        value={reviewData.task1?.feedback || ""}
                                                        onChange={(e) => setReviewData({
                                                            ...reviewData,
                                                            task1: { ...reviewData.task1, feedback: e.target.value }
                                                        })}
                                                    />
                                                </div>

                                                {/* Task 2 Rubrics */}
                                                <div className="p-4 bg-white border border-base-200 rounded-2xl space-y-3 shadow-xs">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-xs">Task 2 Rubrics</span>
                                                        <span className="badge badge-sm badge-outline font-black">{calculateIeltsBand([reviewData.task2?.criteria?.tr, reviewData.task2?.criteria?.cc, reviewData.task2?.criteria?.lr, reviewData.task2?.criteria?.gra]).toFixed(1)}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                        {[['tr', 'Task Response'], ['cc', 'Coherence & Cohesion'], ['lr', 'Lexical Resource'], ['gra', 'Grammar Range']].map(([key, label]) => (
                                                            <div key={key}>
                                                                <label className="block text-slate-400 font-bold mb-1">{label}</label>
                                                                <select
                                                                    className="select select-xs select-bordered w-full font-mono font-bold"
                                                                    value={reviewData.task2?.criteria?.[key] || ""}
                                                                    onChange={(e) => setReviewData({
                                                                        ...reviewData,
                                                                        task2: {
                                                                            ...reviewData.task2,
                                                                            criteria: { ...reviewData.task2?.criteria, [key]: e.target.value }
                                                                        }
                                                                    })}
                                                                >
                                                                    <option value="">Band</option>
                                                                    {[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map(b => (
                                                                        <option key={b} value={b}>{b}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <textarea
                                                        className="textarea textarea-xs textarea-bordered w-full"
                                                        placeholder="Task 2 feedback..."
                                                        value={reviewData.task2?.feedback || ""}
                                                        onChange={(e) => setReviewData({
                                                            ...reviewData,
                                                            task2: { ...reviewData.task2, feedback: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="form-control">
                                                    <label className="label text-[10px] font-black uppercase text-slate-400">Score (%)</label>
                                                    <input 
                                                        type="number"
                                                        max="100"
                                                        min="0"
                                                        className="input input-bordered rounded-xl font-bold"
                                                        value={reviewData.score}
                                                        onChange={(e) => setReviewData({...reviewData, score: e.target.value})}
                                                        placeholder="e.g. 85"
                                                        required
                                                    />
                                                </div>
                                                <div className="form-control">
                                                    <label className="label text-[10px] font-black uppercase text-slate-400">Band Score (0 - 9.0)</label>
                                                    <input 
                                                        type="text"
                                                        className="input input-bordered rounded-xl font-bold"
                                                        value={reviewData.bandScore}
                                                        onChange={(e) => setReviewData({...reviewData, bandScore: e.target.value})}
                                                        placeholder="e.g. 7.5"
                                                    />
                                                </div>
                                                <div className="form-control">
                                                    <label className="label text-[10px] font-black uppercase text-slate-400">Detailed Feedback</label>
                                                    <textarea 
                                                        className="textarea textarea-bordered h-32 rounded-xl text-sm"
                                                        value={reviewData.feedback}
                                                        onChange={(e) => setReviewData({...reviewData, feedback: e.target.value})}
                                                        placeholder="Write feedback..."
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <button 
                                            type="submit" 
                                            disabled={submitting}
                                            className="btn btn-primary w-full rounded-2xl font-black text-xs uppercase tracking-widest py-4 shadow-lg shadow-primary/20"
                                        >
                                            {submitting ? "Submitting..." : "Submit Evaluation"}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default SkillLabSubmissionsTable;
