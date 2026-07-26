import { PiBookOpen, PiEar, PiPencilLine, PiMicrophoneStage } from "react-icons/pi";
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

const QuestionsTable = ({
    filteredQuestions,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    handleToggleStatus,
    handleDelete,
    setSelectedQuestion,
    navigate
}) => {
    return (
        <div className="overflow-x-auto p-4">
            <table className="table table-md w-full">
                <thead>
                    <tr className="bg-slate-50 border-b border-base-200 text-slate-500 text-xs font-black uppercase tracking-wider">
                        <th className="py-4 pl-6 rounded-l-2xl w-12">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-xs checkbox-primary cursor-pointer"
                                checked={filteredQuestions.length > 0 && selectedIds.length === filteredQuestions.length}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                            />
                        </th>
                        <th className="py-4">Question Set</th>
                        <th className="py-4">Section</th>
                        <th className="py-4">Exam</th>
                        <th className="py-4">Questions</th>
                        <th className="py-4">Plan Type</th>
                        <th className="py-4">Status</th>
                        <th className="py-4">Guest Access</th>
                        <th className="py-4">Version</th>
                        <th className="py-4">Created Date</th>
                        <th className="py-4 pr-6 text-right rounded-r-2xl">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-base-100">
                    {filteredQuestions.map((q) => (
                        <tr key={q._id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="py-4 pl-6 w-12">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-xs checkbox-primary cursor-pointer"
                                    checked={selectedIds.includes(q._id)}
                                    onChange={() => handleSelectRow(q._id)}
                                />
                            </td>
                            <td className="py-4 font-bold text-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-base-100 text-lg">
                                        {getIcon(q.testType)}
                                    </div>
                                    <span 
                                        className="line-clamp-1 max-w-[200px]" 
                                        onMouseEnter={(e) => handleShowTitleIfClipped(e, q.title)}
                                    >
                                        {q.title}
                                    </span>
                                </div>
                            </td>
                            <td className="py-4">
                                <span className="capitalize text-xs font-bold text-slate-600">{q.testType}</span>
                            </td>
                            <td className="py-4">
                                <span className={`badge badge-sm font-bold border-none ${
                                    q.examType === 'IELTS' ? 'bg-blue-50 text-blue-700' :
                                    q.examType === 'PTE' ? 'bg-green-50 text-green-700' :
                                    'bg-amber-50 text-amber-700'
                                }`}>{q.examType || 'IELTS'}</span>
                            </td>
                            <td className="py-4 font-bold text-slate-600">
                                {q.questions?.length || 0} Qs
                            </td>
                            <td className="py-4">
                                <span className={`badge badge-sm font-black border-none uppercase text-[9px] px-2.5 ${
                                    q.forPlanType === 'premium' ? 'bg-accent/15 text-accent-content' : 'bg-base-200 text-base-content/60'
                                }`}>{q.forPlanType}</span>
                            </td>
                            <td className="py-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-xs toggle-primary animate-none cursor-pointer"
                                        checked={q.isActive !== false}
                                        onChange={() => handleToggleStatus(q._id, q.isActive !== false)}
                                        title="Toggle Active Status"
                                    />
                                    <span className={`badge badge-xs font-bold border-none ${
                                        q.isActive !== false ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                        {q.isActive !== false ? 'Active' : 'Disabled'}
                                    </span>
                                </div>
                            </td>
                            <td className="py-4">
                                <span className={`badge badge-sm font-semibold border-none text-xs ${
                                    q.isPublic ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>{q.isPublic ? "Allowed" : "Restricted"}</span>
                            </td>
                            <td className="py-4 font-bold text-slate-500">
                                V{q.version || 1}
                            </td>
                            <td className="py-4 text-xs text-base-content/50">
                                {new Date(q.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 pr-6 text-right">
                                <HoverActions
                                    onView={() => setSelectedQuestion(q)}
                                    onEdit={() => navigate(`/dashboard/admin/edit-questions/${q._id}`)}
                                    onDelete={() => handleDelete(q._id)}
                                    viewTooltip="See Questions"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default QuestionsTable;
