import { PiUserCircleFill, PiXCircleFill } from "react-icons/pi";
import { parseSpeakingSubmission, parseWritingSubmission, calculateIeltsBand } from "../../../../../utils/gradingUtils";
import { parseFeedback } from "../../../../../utils/parseFeedback";

const GradingModalContainer = ({
    mockEvalDetail,
    setMockEvalDetail,
    mockReviewData,
    setMockReviewData,
    isEditingMockGrade,
    setIsEditingMockGrade,
    handleMockReviewSubmit,
    submitting
}) => {
    if (!mockEvalDetail) return null;

    const ieltsScoreOptions = ["0", "1.0", "1.5", "2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"];
    const isWriting = mockEvalDetail.sectionType === 'writing';

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-fade-in">
            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col w-full h-full max-w-7xl overflow-hidden">
                {/* Modal Header */}
                <div className="px-10 py-6 border-b border-base-200 bg-base-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <PiUserCircleFill className="text-4xl text-primary" />
                        <div>
                            <h3 className="text-xl font-black tracking-tight">{mockEvalDetail.result.userId?.name || "Student"}</h3>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{mockEvalDetail.result.userId?.email}</p>
                        </div>
                        <div className="w-px h-6 bg-base-300 mx-2" />
                        <div>
                            <h4 className="text-sm font-bold text-slate-600">{mockEvalDetail.result.testId?.title}</h4>
                            <span className="badge badge-primary font-black text-[8px] uppercase tracking-wider mt-0.5">{mockEvalDetail.sectionType}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setMockEvalDetail(null)} 
                        className="btn btn-ghost btn-sm rounded-xl font-black uppercase text-[10px] flex items-center gap-1.5 hover:bg-rose-50 hover:text-rose-600 transition-colors px-3 py-1.5"
                    >
                        <PiXCircleFill className="text-lg" /> Close
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Left Pane: Student Submission & Questions */}
                    <div className="flex-1 overflow-y-auto p-10 border-r border-base-200 custom-scrollbar space-y-6">
                        {isWriting ? (() => {
                            const writingQuestionData = mockEvalDetail.result.testId?.sections?.writing?.[0];
                            const writingAnswer = mockEvalDetail.section.answers.find(ans => 
                                ans.questionId === writingQuestionData?._id?.toString() ||
                                ans.questionId === writingQuestionData?.id ||
                                (ans.userAnswer && ans.userAnswer.includes("--- TASK 1"))
                            );
                            const { task1, task2 } = parseWritingSubmission(writingAnswer?.userAnswer);
                            
                            return (
                                <div className="space-y-6">
                                    {/* Question Prompt */}
                                    <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4">
                                        <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Question Prompt</h6>
                                        {writingQuestionData?.passage ? (
                                            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-medium text-sm" dangerouslySetInnerHTML={{ __html: writingQuestionData.passage }} />
                                        ) : (
                                            <p className="text-slate-400 italic text-sm">No writing prompt found in test data.</p>
                                        )}
                                        {writingQuestionData?.images?.filter(img => img && img.trim() !== "").length > 0 && (
                                            <div className="mt-4 grid gap-4">
                                                {writingQuestionData.images.filter(img => img && img.trim() !== "").map((img, i) => (
                                                    <div key={i} className="rounded-xl overflow-hidden border border-slate-100 p-1 bg-white max-w-md">
                                                        <img src={img} alt={`Writing Task Diagram ${i + 1}`} className="w-full h-auto object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Student Responses */}
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <h6 className="text-[10px] font-black uppercase tracking-widest text-primary">Student Task 1 Response</h6>
                                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-base leading-relaxed text-slate-700 whitespace-pre-wrap font-medium shadow-inner">
                                                {task1 || <span className="text-slate-400 italic text-sm">No Task 1 response submitted.</span>}
                                            </div>
                                            {task1 && (
                                                <div className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    Words: {task1.trim() ? task1.trim().split(/\s+/).length : 0} / 150 Target
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <h6 className="text-[10px] font-black uppercase tracking-widest text-primary">Student Task 2 Response</h6>
                                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-base leading-relaxed text-slate-700 whitespace-pre-wrap font-medium shadow-inner">
                                                {task2 || <span className="text-slate-400 italic text-sm">No Task 2 response submitted.</span>}
                                            </div>
                                            {task2 && (
                                                <div className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    Words: {task2.trim() ? task2.trim().split(/\s+/).length : 0} / 250 Target
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })() : (() => {
                            const speakingQuestionData = mockEvalDetail.result.testId?.sections?.speaking?.[0];
                            const speakingAnswer = mockEvalDetail.section.answers.find(ans => 
                                ans.questionId === speakingQuestionData?._id?.toString() ||
                                ans.questionId === speakingQuestionData?.id ||
                                (ans.userAnswer && (ans.userAnswer.includes("--- Part ") || ans.userAnswer.includes("Answer:")))
                            );
                            
                            const parsedSpeakingParts = parseSpeakingSubmission(speakingAnswer?.userAnswer);
                            
                            const aligned = (() => {
                                const findAudio = (partTitle, qText, qIndex) => {
                                    const part = parsedSpeakingParts.find(p => p.title.toLowerCase().includes(partTitle.toLowerCase()));
                                    if (!part) return null;
                                    const match = part.items.find(item => {
                                        const cleanItemQ = item.question.toLowerCase().replace(/[^a-z0-9]/g, "");
                                        const cleanTargetQ = (qText || "").split("\n")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
                                        return cleanItemQ === cleanTargetQ || item.label.includes((qIndex + 1).toString());
                                    });
                                    return match?.audioUrl || null;
                                };
                                return {
                                    part1: (speakingQuestionData?.speakingPart1Questions || []).map((q, idx) => ({
                                        question: q,
                                        audioUrl: findAudio("Part 1", q, idx)
                                    })),
                                    part2: {
                                        question: speakingQuestionData?.speakingPrompt || "Describe a historical building you have visited.",
                                        audioUrl: findAudio("Part 2", speakingQuestionData?.speakingPrompt || "", 0)
                                    },
                                    part3: (speakingQuestionData?.speakingPart3Questions || []).map((q, idx) => ({
                                        question: q,
                                        audioUrl: findAudio("Part 3", q, idx)
                                    }))
                                };
                            })();

                            const hasConfiguredQuestions = (speakingQuestionData?.speakingPart1Questions?.length > 0 || speakingQuestionData?.speakingPrompt || speakingQuestionData?.speakingPart3Questions?.length > 0);

                            if (!hasConfiguredQuestions && parsedSpeakingParts.length > 0) {
                                return (
                                    <div className="space-y-6">
                                        {parsedSpeakingParts.map((part, partIdx) => (
                                            <div key={partIdx} className="space-y-3 col-span-full">
                                                <h5 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-1 mt-2">{part.title}</h5>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {part.items.map((item, itemIdx) => (
                                                        <div key={itemIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-inner">
                                                            <span className="badge badge-primary font-black text-[8px] uppercase tracking-wider">{item.label}</span>
                                                            <p className="text-xs font-bold text-slate-700 leading-tight">{item.question}</p>
                                                            {item.audioUrl ? (
                                                                <audio src={item.audioUrl} controls className="w-full rounded-lg mt-2" />
                                                            ) : (
                                                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic pt-1">No recording uploaded</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-6">
                                    {/* Part 1 */}
                                    <div className="space-y-3">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-1 mt-2">Part 1: Interview</h5>
                                        {aligned.part1.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-4">
                                                {aligned.part1.map((item, idx) => (
                                                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-inner">
                                                        <span className="badge badge-primary font-black text-[8px] uppercase tracking-wider">Question {idx + 1}</span>
                                                        <p className="text-xs font-bold text-slate-700 leading-tight">{item.question}</p>
                                                        {item.audioUrl ? (
                                                            <audio src={item.audioUrl} controls className="w-full rounded-lg mt-2" />
                                                        ) : (
                                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic pt-1">No recording uploaded</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs font-bold text-slate-400 italic">No Part 1 questions configured.</p>
                                        )}
                                    </div>

                                    {/* Part 2 */}
                                    <div className="space-y-3">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-1 mt-2">Part 2: Cue Card Prompt</h5>
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-inner">
                                            <span className="badge badge-primary font-black text-[8px] uppercase tracking-wider">Cue Card Topic</span>
                                            <p className="text-xs font-bold text-slate-700 leading-tight whitespace-pre-wrap">{aligned.part2.question}</p>
                                            {aligned.part2.audioUrl ? (
                                                <audio src={aligned.part2.audioUrl} controls className="w-full rounded-lg mt-2" />
                                            ) : (
                                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic pt-1">No recording uploaded</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Part 3 */}
                                    <div className="space-y-3">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-1 mt-2">Part 3: Discussion</h5>
                                        {aligned.part3.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-4">
                                                {aligned.part3.map((item, idx) => (
                                                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shadow-inner">
                                                        <span className="badge badge-primary font-black text-[8px] uppercase tracking-wider">Discussion Q{idx + 1}</span>
                                                        <p className="text-xs font-bold text-slate-700 leading-tight">{item.question}</p>
                                                        {item.audioUrl ? (
                                                            <audio src={item.audioUrl} controls className="w-full rounded-lg mt-2" />
                                                        ) : (
                                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic pt-1">No recording uploaded</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs font-bold text-slate-400 italic">No Part 3 questions configured.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Right Pane: Evaluation Form / Results */}
                    <div className="w-full md:w-96 overflow-y-auto p-10 bg-base-50/50 custom-scrollbar flex flex-col justify-between border-t md:border-t-0 md:border-l border-base-200">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-4 mb-4">
                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Evaluation &amp; Feedback</h5>
                            </div>

                            {!mockEvalDetail.isGraded || isEditingMockGrade ? (
                                <form onSubmit={handleMockReviewSubmit} className="space-y-6">
                                    <div className="space-y-3">
                                        <h6 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Detailed Criteria Scores</h6>
                                        <div className="grid grid-cols-2 gap-3">
                                            {isWriting ? (
                                                <div className="col-span-2 space-y-6">
                                                    {/* Task 1 */}
                                                    <div className="border border-slate-200 p-4 rounded-2xl bg-white space-y-4">
                                                        <div className="flex items-center justify-between border-b pb-2">
                                                            <h6 className="text-[10px] font-black uppercase tracking-widest text-primary">Task 1: Academic/General</h6>
                                                            {(() => {
                                                                const c = mockReviewData.task1.criteria || {};
                                                                const list = [c.ta, c.cc, c.lr, c.gra];
                                                                const hasAll = list.length === 4 && list.every(s => s !== "");
                                                                return (
                                                                    <span className="badge badge-sm font-black text-xs">
                                                                        Band: {hasAll ? calculateIeltsBand(list).toFixed(1) : "—"}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {["ta", "cc", "lr", "gra"].map((field) => {
                                                                const label = field === "ta" ? "Task Achievement (TA)" : field === "cc" ? "Coherence (CC)" : field === "lr" ? "Lexical Resource (LR)" : "Grammar (GRA)";
                                                                return (
                                                                    <div key={field} className="space-y-1">
                                                                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</label>
                                                                        <select 
                                                                            className="select select-bordered select-sm w-full rounded-xl font-black focus:border-primary text-xs h-10"
                                                                            value={mockReviewData.task1.criteria?.[field] || ""}
                                                                            onChange={(e) => setMockReviewData({
                                                                                ...mockReviewData,
                                                                                task1: {
                                                                                    ...mockReviewData.task1,
                                                                                    criteria: { ...mockReviewData.task1.criteria, [field]: e.target.value }
                                                                                }
                                                                            })}
                                                                        >
                                                                            <option value="">Score</option>
                                                                            {ieltsScoreOptions.map(val => <option key={val} value={val}>{val}</option>)}
                                                                        </select>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Task 1 Feedback</label>
                                                            <textarea 
                                                                className="textarea textarea-bordered textarea-sm w-full rounded-xl focus:border-primary text-xs font-semibold"
                                                                placeholder="Task 1 comments..."
                                                                value={mockReviewData.task1.feedback || ""}
                                                                onChange={(e) => setMockReviewData({
                                                                    ...mockReviewData,
                                                                    task1: { ...mockReviewData.task1, feedback: e.target.value }
                                                                })}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Task 2 */}
                                                    <div className="border border-slate-200 p-4 rounded-2xl bg-white space-y-4">
                                                        <div className="flex items-center justify-between border-b pb-2">
                                                            <h6 className="text-[10px] font-black uppercase tracking-widest text-primary">Task 2: Essay writing</h6>
                                                            {(() => {
                                                                const c = mockReviewData.task2.criteria || {};
                                                                const list = [c.tr, c.cc, c.lr, c.gra];
                                                                const hasAll = list.length === 4 && list.every(s => s !== "");
                                                                return (
                                                                    <span className="badge badge-sm font-black text-xs">
                                                                        Band: {hasAll ? calculateIeltsBand(list).toFixed(1) : "—"}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {["tr", "cc", "lr", "gra"].map((field) => {
                                                                const label = field === "tr" ? "Task Response (TR)" : field === "cc" ? "Coherence (CC)" : field === "lr" ? "Lexical Resource (LR)" : "Grammar (GRA)";
                                                                return (
                                                                    <div key={field} className="space-y-1">
                                                                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</label>
                                                                        <select 
                                                                            className="select select-bordered select-sm w-full rounded-xl font-black focus:border-primary text-xs h-10"
                                                                            value={mockReviewData.task2.criteria?.[field] || ""}
                                                                            onChange={(e) => setMockReviewData({
                                                                                ...mockReviewData,
                                                                                task2: {
                                                                                    ...mockReviewData.task2,
                                                                                    criteria: { ...mockReviewData.task2.criteria, [field]: e.target.value }
                                                                                }
                                                                            })}
                                                                        >
                                                                            <option value="">Score</option>
                                                                            {ieltsScoreOptions.map(val => <option key={val} value={val}>{val}</option>)}
                                                                        </select>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Task 2 Feedback</label>
                                                            <textarea 
                                                                className="textarea textarea-bordered textarea-sm w-full rounded-xl focus:border-primary text-xs font-semibold"
                                                                placeholder="Task 2 comments..."
                                                                value={mockReviewData.task2.feedback || ""}
                                                                onChange={(e) => setMockReviewData({
                                                                    ...mockReviewData,
                                                                    task2: { ...mockReviewData.task2, feedback: e.target.value }
                                                                })}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Overall */}
                                                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Calculated Overall Band:</span>
                                                        <span className="text-xl font-black text-primary">
                                                            {(() => {
                                                                const c1 = mockReviewData.task1.criteria || {};
                                                                const c2 = mockReviewData.task2.criteria || {};
                                                                const l1 = [c1.ta, c1.cc, c1.lr, c1.gra];
                                                                const l2 = [c2.tr, c2.cc, c2.lr, c2.gra];
                                                                const h1 = l1.every(s => s !== "");
                                                                const h2 = l2.every(s => s !== "");
                                                                if (h1 && h2) {
                                                                    const t1 = calculateIeltsBand(l1);
                                                                    const t2 = calculateIeltsBand(l2);
                                                                    return calculateIeltsBand([t1, t2, t2]).toFixed(1);
                                                                }
                                                                return "—";
                                                            })()}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Overall Professional Comments</label>
                                                        <textarea 
                                                            className="textarea textarea-bordered w-full rounded-2xl h-32 font-medium focus:border-primary text-sm leading-relaxed"
                                                            placeholder="Provide overall constructive advice..."
                                                            value={mockReviewData.comments}
                                                            onChange={(e) => setMockReviewData({...mockReviewData, comments: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {["fc", "lr", "gra", "pr"].map((field) => {
                                                        const label = field === "fc" ? "Fluency & Coherence" : field === "lr" ? "Lexical Resource" : field === "gra" ? "Grammar Accuracy" : "Pronunciation";
                                                        return (
                                                            <div key={field} className="space-y-1">
                                                                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</label>
                                                                <select 
                                                                    className="select select-bordered select-sm w-full rounded-xl font-black focus:border-primary text-xs h-10"
                                                                    value={mockReviewData.criteria?.[field] || ""}
                                                                    onChange={(e) => setMockReviewData({
                                                                        ...mockReviewData,
                                                                        criteria: { ...mockReviewData.criteria, [field]: e.target.value }
                                                                    })}
                                                                >
                                                                    <option value="">Score</option>
                                                                    {ieltsScoreOptions.map(val => <option key={val} value={val}>{val}</option>)}
                                                                </select>
                                                            </div>
                                                        );
                                                    })}
                                                    <div className="col-span-2 space-y-2 pt-2">
                                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Overall Speaking Feedback</label>
                                                        <textarea 
                                                            className="textarea textarea-bordered w-full rounded-2xl h-36 font-medium focus:border-primary text-sm leading-relaxed"
                                                            placeholder="Provide feedback on pronunciation, vocabulary, fluency..."
                                                            value={mockReviewData.feedback}
                                                            onChange={(e) => setMockReviewData({...mockReviewData, feedback: e.target.value})}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={submitting}
                                        className="btn btn-primary btn-block rounded-xl h-14 font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/25 mt-4"
                                    >
                                        {submitting ? <span className="loading loading-spinner" /> : "Save Evaluation"}
                                    </button>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    {/* Graded View */}
                                    <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Assigned Score</span>
                                            <span className="text-3xl font-black text-emerald-600">{mockEvalDetail.section?.score}</span>
                                        </div>
                                        {mockEvalDetail.section?.feedback && (() => {
                                            const parsed = parseFeedback(mockEvalDetail.section.feedback);
                                            return (
                                                <div className="space-y-2 pt-2 border-t border-emerald-200">
                                                    <h6 className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Instructor Remarks</h6>
                                                    <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{parsed.comments || mockEvalDetail.section.feedback}</p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <button
                                        onClick={() => setIsEditingMockGrade(true)}
                                        className="btn btn-outline btn-block rounded-xl font-black uppercase tracking-widest text-xs"
                                    >
                                        Edit Grade & Feedback
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GradingModalContainer;
