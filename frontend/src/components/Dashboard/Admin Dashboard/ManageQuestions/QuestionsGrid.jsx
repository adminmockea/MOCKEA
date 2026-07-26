import { PiBookOpen, PiEar, PiPencilLine, PiMicrophoneStage, PiSquaresFour } from "react-icons/pi";
import HoverActions from "../../../Common/HoverActions";

const getIcon = (type) => {
    switch(type) {
        case 'reading': return <PiBookOpen className="text-blue-500" />;
        case 'listening': return <PiEar className="text-purple-500" />;
        case 'writing': return <PiPencilLine className="text-orange-500" />;
        case 'speaking': return <PiMicrophoneStage className="text-green-500" />;
        default: return <PiBookOpen />;
    }
};

const handleShowTitleIfClipped = (e, title) => {
    const el = e.currentTarget;
    if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) {
        el.setAttribute("title", title);
    } else {
        el.removeAttribute("title");
    }
};

const QuestionsGrid = ({
    filteredQuestions,
    selectedIds,
    handleSelectRow,
    handleToggleStatus,
    handleDelete,
    setSelectedQuestion,
    navigate
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuestions.map((q) => (
                <div key={q._id} className="card bg-white border border-base-300 shadow-sm p-6 hover:shadow-md transition-shadow group relative">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-xs checkbox-primary cursor-pointer mr-1"
                                checked={selectedIds.includes(q._id)}
                                onChange={() => handleSelectRow(q._id)}
                            />
                            <div className="p-3 rounded-2xl bg-base-100 text-2xl">
                                {getIcon(q.testType)}
                            </div>
                            <div className="min-w-0">
                                <h3 
                                    className="font-bold text-sm leading-snug line-clamp-2"
                                    onMouseEnter={(e) => handleShowTitleIfClipped(e, q.title)}
                                >
                                    {q.title}
                                </h3>
                                <p className="text-xs uppercase tracking-widest text-base-content/50 font-semibold">{q.testType}</p>
                            </div>
                        </div>
                        <HoverActions
                            onEdit={() => navigate(`/dashboard/admin/edit-questions/${q._id}`)}
                            onDelete={() => handleDelete(q._id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                    </div>
                    
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-base-200 pt-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                                <span className="badge badge-outline badge-xs px-2 font-semibold">{q.questions?.length || 0} Qs</span>
                                <span className={`badge badge-xs px-2 font-bold ${q.forPlanType === 'premium' ? 'badge-accent' : 'badge-ghost'}`}>{q.forPlanType}</span>
                                <span 
                                    onClick={() => handleToggleStatus(q._id, q.isActive !== false)}
                                    className={`badge badge-xs font-bold cursor-pointer select-none transition-all hover:scale-105 active:scale-95 ${
                                        q.isActive !== false ? 'badge-success text-white' : 'bg-red-50 text-red-700 border-none'
                                    }`}
                                    title="Click to toggle status"
                                >
                                    {q.isActive !== false ? 'Active' : 'Disabled'}
                                </span>
                            </div>
                            <span className="text-[9px] text-base-content/40">Created {new Date(q.createdAt).toLocaleDateString()}</span>
                        </div>
                        <button 
                            onClick={() => setSelectedQuestion(q)}
                            className="btn btn-primary btn-sm rounded-xl gap-1 font-bold shadow-sm hover:shadow transition-all text-xs px-3"
                        >
                            <PiSquaresFour className="text-sm" /> See Qs
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default QuestionsGrid;
