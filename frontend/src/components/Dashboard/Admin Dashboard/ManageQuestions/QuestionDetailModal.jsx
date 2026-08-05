import { useNavigate } from "react-router";
import { PiBookOpen, PiEar, PiCheckCircle, PiInfo } from "react-icons/pi";
import AdminModal from "../../../Common/AdminModal";

const QuestionDetailModal = ({ selectedQuestion, setSelectedQuestion, navigate: propNavigate, handleBulkAction, selectedIds, setSelectedIds, bulkMutation }) => {
    const navigateHook = useNavigate();
    const navigate = propNavigate || navigateHook;
    return (
        <>
            {/* Questions Preview Modal */}
            <AdminModal
                isOpen={!!selectedQuestion}
                onClose={() => setSelectedQuestion(null)}
                title={selectedQuestion?.title || ""}
                subtitle={selectedQuestion ? `Previewing Question Set V${selectedQuestion.version || 1}` : ""}
                maxWidth="max-w-4xl"
                footer={
                    selectedQuestion && (
                        <>
                            <button 
                                onClick={() => setSelectedQuestion(null)}
                                className="btn btn-ghost rounded-2xl px-6 font-bold"
                            >
                                Close
                            </button>
                            <button 
                                onClick={() => {
                                    setSelectedQuestion(null);
                                    navigate(`/dashboard/admin/edit-questions/${selectedQuestion._id}`);
                                }}
                                className="btn btn-primary rounded-2xl gap-2 px-6 font-bold"
                            >
                                Edit Question Set
                            </button>
                        </>
                    )
                }
            >
                {selectedQuestion && (
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-2 pb-4 border-b border-base-200">
                            <span className="badge badge-sm font-semibold capitalize bg-slate-100 text-slate-700 border-none px-2.5 py-3">
                                Type: {selectedQuestion.testType}
                            </span>
                            <span className="badge badge-sm font-semibold bg-indigo-50 text-indigo-700 border-none px-2.5 py-3">
                                Exam: {selectedQuestion.examType || "IELTS"}
                            </span>
                            <span className={`badge badge-sm font-bold border-none px-2.5 py-3 ${
                                selectedQuestion.forPlanType === 'premium' 
                                    ? 'bg-accent/15 text-accent-content' 
                                    : 'bg-base-200 text-base-content/75'
                            }`}>
                                Plan: {selectedQuestion.forPlanType}
                            </span>
                            <span className={`badge badge-sm font-bold border-none px-2.5 py-3 ${
                                selectedQuestion.isPublic 
                                    ? 'bg-green-50 text-green-700' 
                                    : 'bg-red-50 text-red-700'
                            }`}>
                                {selectedQuestion.isPublic ? "Guest Practice Allowed" : "Registered Users Only"}
                            </span>
                        </div>

                        {/* Modal Body */}
                        <div className="space-y-6 pt-2">
                            {/* Global Instructions */}
                            {selectedQuestion.instructions && (
                                <div className="bg-slate-50 border-l-4 border-primary p-4 rounded-r-2xl text-sm italic text-slate-700">
                                    <span className="font-bold not-italic block text-xs uppercase tracking-wider text-primary mb-1">Global Instructions</span>
                                    {selectedQuestion.instructions}
                                </div>
                            )}

                            {/* Section Material based on testType */}
                            {selectedQuestion.testType === "reading" && selectedQuestion.passage && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-base-content/50">Reading Passage</h3>
                                    <div 
                                        className="prose max-w-none max-h-80 overflow-y-auto bg-slate-50 border border-slate-200/60 p-6 rounded-2xl text-sm font-serif leading-relaxed text-slate-800 shadow-inner"
                                        dangerouslySetInnerHTML={{ __html: selectedQuestion.passage }} 
                                    />
                                </div>
                            )}

                            {selectedQuestion.testType === "listening" && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-base-content/50">Listening Test Content</h3>
                                    {selectedQuestion.audioUrl ? (
                                        <div className="bg-indigo-50/40 border border-indigo-100/60 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl shrink-0">
                                                    <PiEar />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-slate-800">Audio Track Player</div>
                                                    <a href={selectedQuestion.audioUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline line-clamp-1 break-all">{selectedQuestion.audioUrl}</a>
                                                </div>
                                            </div>
                                            <audio src={selectedQuestion.audioUrl} controls className="w-full md:max-w-md" />
                                        </div>
                                    ) : (
                                        <div className="text-sm text-error bg-error/10 p-3 rounded-xl font-semibold">No audio URL specified.</div>
                                    )}
                                    
                                    {selectedQuestion.passage && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/40">Gapped Notes Context</h4>
                                            <div 
                                                className="prose max-w-none max-h-60 overflow-y-auto bg-slate-50 border border-slate-200/60 p-6 rounded-2xl text-sm font-serif shadow-inner"
                                                dangerouslySetInnerHTML={{ __html: selectedQuestion.passage }} 
                                            />
                                        </div>
                                    )}

                                    {selectedQuestion.images && selectedQuestion.images.length > 0 && selectedQuestion.images.some(img => img) && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/40">Reference Images (Map / Diagram)</h4>
                                            <div className="flex flex-wrap gap-4">
                                                {selectedQuestion.images.map((img, i) => img && (
                                                    <div key={i} className="border border-base-300 rounded-2xl p-2 bg-white max-w-sm">
                                                        <img src={img} alt={`Reference map/diagram ${i+1}`} className="rounded-xl max-h-48 object-contain" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedQuestion.testType === "writing" && selectedQuestion.passage && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-base-content/50">Writing Prompts</h3>
                                    <div 
                                        className="prose max-w-none max-h-96 overflow-y-auto bg-slate-50 border border-slate-200/60 p-6 rounded-2xl text-sm text-slate-800 shadow-inner"
                                        dangerouslySetInnerHTML={{ __html: selectedQuestion.passage }} 
                                    />
                                    {selectedQuestion.images && selectedQuestion.images.length > 0 && selectedQuestion.images.some(img => img) && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/40">Task 1 Diagrams</h4>
                                            <div className="flex flex-wrap gap-4">
                                                {selectedQuestion.images.map((img, i) => img && (
                                                    <div key={i} className="border border-base-300 rounded-2xl p-2 bg-white max-w-sm">
                                                        <img src={img} alt={`Writing task diagram ${i+1}`} className="rounded-xl max-h-48 object-contain" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedQuestion.testType === "speaking" && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-base-content/50">Speaking Outline</h3>
                                    {selectedQuestion.speakingPrompt && (
                                        <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Part 2 Cue Card Prompt</h4>
                                            <p className="text-sm whitespace-pre-line text-slate-800 font-medium leading-relaxed">{selectedQuestion.speakingPrompt}</p>
                                        </div>
                                    )}
                                    {selectedQuestion.speakingPart1Questions && selectedQuestion.speakingPart1Questions.length > 0 && selectedQuestion.speakingPart1Questions.some(q => q.trim()) && (
                                        <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Part 1 Introduction Questions</h4>
                                            <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-800 font-medium">
                                                {selectedQuestion.speakingPart1Questions.map((item, idx) => item && (
                                                    <li key={idx} className="leading-relaxed">{item}</li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                    {selectedQuestion.speakingPart3Questions && selectedQuestion.speakingPart3Questions.length > 0 && selectedQuestion.speakingPart3Questions.some(q => q.trim()) && (
                                        <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Part 3 Discussion Questions</h4>
                                            <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-800 font-medium">
                                                {selectedQuestion.speakingPart3Questions.map((item, idx) => item && (
                                                    <li key={idx} className="leading-relaxed">{item}</li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Sub-Questions list */}
                            {selectedQuestion.testType !== "speaking" && selectedQuestion.testType !== "writing" && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-base-content/50">
                                        Sub-Questions ({selectedQuestion.questions?.length || 0})
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedQuestion.questions && selectedQuestion.questions.length > 0 ? (
                                            selectedQuestion.questions.map((subQ, idx) => (
                                                <div key={subQ.id || idx} className="p-5 bg-white border border-base-200 rounded-2xl shadow-sm hover:border-base-300 transition-colors">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex-1 space-y-3">
                                                            <div className="font-semibold text-slate-800 text-sm">{subQ.question || "(No question text)"}</div>
                                                            
                                                            {/* MCQ Options */}
                                                            {subQ.options && subQ.options.length > 0 && subQ.options.some(opt => opt) && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-1">
                                                                    {subQ.options.map((opt, optIdx) => opt && (
                                                                        <div key={optIdx} className="text-xs bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-600 flex items-center gap-2">
                                                                            <span className="font-bold text-primary">{String.fromCharCode(65 + optIdx)}.</span>
                                                                            <span>{opt}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Matching pairs */}
                                                            {subQ.matchingPairs && subQ.matchingPairs.length > 0 && subQ.matchingPairs.some(p => p.key || p.value) && (
                                                                <div className="space-y-1.5 pl-1">
                                                                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Matching Items</div>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                        {subQ.matchingPairs.map((pair, pairIdx) => (pair.key || pair.value) && (
                                                                            <div key={pairIdx} className="text-xs bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-600 flex items-center justify-between">
                                                                                <span>{pair.key}</span>
                                                                                <span className="text-primary font-bold">⇄</span>
                                                                                <span>{pair.value}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Sub-question diagram/map */}
                                                            {subQ.imageUrl && (
                                                                <div className="border border-base-300 rounded-xl p-2 bg-white max-w-xs mt-2">
                                                                    <img src={subQ.imageUrl} alt={`Question diagram`} className="rounded-lg max-h-32 object-contain" />
                                                                </div>
                                                            )}

                                                            {/* Correct Answer */}
                                                            <div className="flex items-center gap-2 text-xs text-success bg-success/10 w-fit px-3 py-1.5 rounded-xl font-bold">
                                                                <PiCheckCircle className="text-sm shrink-0" />
                                                                <span>Correct Answer:</span>
                                                                <span className="underline decoration-wavy">{subQ.correctAnswer || "(None)"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-base-content/40 italic p-4 text-center">No sub-questions found.</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Speaking/Writing instructions */}
                            {(selectedQuestion.testType === "speaking" || selectedQuestion.testType === "writing") && (
                                <div className="alert bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 p-4">
                                    <PiInfo className="text-amber-600 text-lg shrink-0 mt-0.5" />
                                    <div className="text-xs text-amber-800">
                                        <div className="font-bold">Evaluation Mode: Manual Instructor Evaluation</div>
                                        <div>Students submit complete essays or spoken audio files for this module. These submissions are routed to the Instructor Dashboard for review and manual grading.</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </AdminModal>

            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-bounce-short">
                    <span className="text-xs font-bold whitespace-nowrap">
                        {selectedIds.length} item{selectedIds.length > 1 ? "s" : ""} selected
                    </span>
                    <div className="flex items-center gap-2 border-l border-slate-700 pl-6">
                        <button
                            type="button"
                            onClick={() => handleBulkAction("update-status", true)}
                            disabled={bulkMutation?.isPending}
                            className="btn btn-xs btn-success rounded-lg font-bold text-white px-3 h-7 min-h-0"
                        >
                            Activate
                        </button>
                        <button
                            type="button"
                            onClick={() => handleBulkAction("update-status", false)}
                            disabled={bulkMutation?.isPending}
                            className="btn btn-xs btn-warning rounded-lg font-bold text-slate-900 px-3 h-7 min-h-0"
                        >
                            Disable
                        </button>
                        <div className="dropdown dropdown-top dropdown-end">
                            <button
                                tabIndex={0}
                                role="button"
                                disabled={bulkMutation?.isPending}
                                className="btn btn-xs btn-outline border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg font-bold px-3 h-7 min-h-0"
                            >
                                Change Plan
                            </button>
                            <ul
                                tabIndex={0}
                                className="dropdown-content menu p-2 shadow-xl bg-slate-800 border border-slate-700 text-white rounded-xl w-36 mb-2 space-y-1"
                            >
                                <li>
                                    <button 
                                        type="button"
                                        onClick={() => handleBulkAction("update-plan", "free")}
                                        className="btn btn-xs btn-ghost text-left text-xs text-white justify-start"
                                    >
                                        Free
                                    </button>
                                </li>
                                <li>
                                    <button 
                                        type="button"
                                        onClick={() => handleBulkAction("update-plan", "standard")}
                                        className="btn btn-xs btn-ghost text-left text-xs text-white justify-start"
                                    >
                                        Standard
                                    </button>
                                </li>
                                <li>
                                    <button 
                                        type="button"
                                        onClick={() => handleBulkAction("update-plan", "premium")}
                                        className="btn btn-xs btn-ghost text-left text-xs text-white justify-start"
                                    >
                                        Premium
                                    </button>
                                </li>
                            </ul>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleBulkAction("delete")}
                            disabled={bulkMutation?.isPending}
                            className="btn btn-xs btn-error rounded-lg font-bold text-white px-3 h-7 min-h-0"
                        >
                            Delete
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedIds([])}
                            disabled={bulkMutation?.isPending}
                            className="btn btn-xs btn-ghost text-slate-400 hover:text-white rounded-lg font-bold px-2 ml-2 h-7 min-h-0"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default QuestionDetailModal;
