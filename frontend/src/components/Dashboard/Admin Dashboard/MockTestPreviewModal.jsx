import React from "react";
import { 
    PiX, 
    PiClock, 
    PiFiles, 
    PiTrophy, 
    PiBookOpen, 
    PiHeadphones, 
    PiPencilSimple, 
    PiMicrophone,
    PiCheckCircle,
    PiLockKey
} from "react-icons/pi";
import { DEFAULT_MOCK_TEST_DURATION_MINUTES } from "../../../constants";

const SECTION_ICONS = {
    reading: <PiBookOpen className="text-blue-500" />,
    listening: <PiHeadphones className="text-purple-500" />,
    writing: <PiPencilSimple className="text-amber-500" />,
    speaking: <PiMicrophone className="text-emerald-500" />
};

const MockTestPreviewModal = ({ test, onClose }) => {
    if (!test) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-base-200">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-base-100 to-base-200 border-b border-base-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary text-2xl">
                            <PiFiles />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-base-content" title={test.title}>{test.title}</h2>
                                <span className={`badge badge-sm font-semibold uppercase ${
                                    test.isPublic ? "badge-success text-white" : "badge-warning"
                                }`}>
                                    {test.isPublic ? "Published" : "Draft"}
                                </span>
                            </div>
                            <p className="text-xs text-base-content/60 mt-0.5">
                                {test.description || "No description provided for this mock test."}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="btn btn-circle btn-ghost btn-sm text-base-content/60 hover:text-base-content"
                        aria-label="Close modal"
                    >
                        <PiX className="text-lg" />
                    </button>
                </div>

                {/* Body Details */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {/* Stat Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-base-100 border border-base-200 flex items-center gap-3">
                            <PiClock className="text-2xl text-primary" />
                            <div>
                                <span className="text-[10px] font-bold text-base-content/40 uppercase">Total Time</span>
                                <p className="font-bold text-sm">{test.totalDuration || DEFAULT_MOCK_TEST_DURATION_MINUTES} Mins</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-base-100 border border-base-200 flex items-center gap-3">
                            <PiLockKey className="text-2xl text-accent" />
                            <div>
                                <span className="text-[10px] font-bold text-base-content/40 uppercase">Plan Access</span>
                                <p className="font-bold text-sm capitalize">{test.planType || "Free"}</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-base-100 border border-base-200 flex items-center gap-3">
                            <PiTrophy className="text-2xl text-warning" />
                            <div>
                                <span className="text-[10px] font-bold text-base-content/40 uppercase">Exam Type</span>
                                <p className="font-bold text-sm">{test.examType || "IELTS"}</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-base-100 border border-base-200 flex items-center gap-3">
                            <PiCheckCircle className="text-2xl text-success" />
                            <div>
                                <span className="text-[10px] font-bold text-base-content/40 uppercase">Total Attempts</span>
                                <p className="font-bold text-sm">{test.attemptsCount || 0} Students</p>
                            </div>
                        </div>
                    </div>

                    {/* Module Breakdowns */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-sm text-base-content/70 uppercase tracking-wider">
                            Modules & Question Breakdown
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {['reading', 'listening', 'writing', 'speaking'].map((moduleKey) => {
                                const sectionQuestions = test.sections?.[moduleKey] || [];
                                const count = sectionQuestions.length;
                                return (
                                    <div key={moduleKey} className="p-4 rounded-2xl border border-base-200 bg-white shadow-xs">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2 font-bold text-base capitalize">
                                                {SECTION_ICONS[moduleKey]}
                                                <span>{moduleKey}</span>
                                            </div>
                                            <span className="badge badge-primary badge-outline text-xs font-bold">
                                                {count} {count === 1 ? 'Question Set' : 'Question Sets'}
                                            </span>
                                        </div>

                                        {count > 0 ? (
                                            <ul className="space-y-1.5 text-xs text-base-content/70">
                                                {sectionQuestions.map((q, idx) => (
                                                    <li key={q._id || idx} className="truncate flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0" />
                                                        <span className="font-medium text-base-content truncate" title={q.title || `Question Set #${idx + 1}`}>
                                                            {q.title || `Question Set #${idx + 1}`}
                                                        </span>
                                                        {q.subType && (
                                                            <span className="ml-auto text-[10px] bg-base-200 px-2 py-0.5 rounded-md font-semibold text-base-content/60">
                                                                {q.subType}
                                                            </span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-xs text-base-content/40 italic">
                                                No question sets attached.
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-base-100 border-t border-base-200 flex justify-end">
                    <button 
                        onClick={onClose} 
                        className="btn btn-primary rounded-xl px-6"
                    >
                        Close Preview
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MockTestPreviewModal;
