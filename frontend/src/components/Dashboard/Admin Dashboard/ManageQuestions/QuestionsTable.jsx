import { useNavigate } from "react-router";
import { PiBookOpen, PiEar, PiPencilLine, PiMicrophoneStage, PiCaretUp, PiCaretDown } from "react-icons/pi";
import HoverActions from "../../../Common/HoverActions";
import { getSetCategory, getCategoryBadgeStyle } from "../../../../utils/questionCategoryUtils";

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

const SortIcon = ({ field, sortField, sortDirection }) => {
    if (sortField !== field) {
        return <span className="text-slate-300 group-hover:text-slate-500 transition-colors text-[11px] font-bold">↕</span>;
    }
    return sortDirection === "asc" ? (
        <PiCaretUp className="text-primary text-xs font-black" />
    ) : (
        <PiCaretDown className="text-primary text-xs font-black" />
    );
};

const QuestionsTable = ({
    filteredQuestions,
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    handleToggleStatus,
    handleDelete,
    setSelectedQuestion,
    navigate: propNavigate,
    sortField,
    sortDirection,
    handleSort,
    filterType,
    setFilterType,
    filterSubCategory,
    setFilterSubCategory
}) => {
    const navigateHook = useNavigate();
    const navigate = propNavigate || navigateHook;
    return (
        <div className="overflow-x-auto p-4">
            <table className="table table-md w-full">
                <thead>
                    <tr className="bg-slate-50 border-b border-base-200 text-slate-500 text-xs font-black uppercase tracking-wider select-none">
                        <th className="py-4 pl-6 rounded-l-2xl w-12">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-xs checkbox-primary cursor-pointer"
                                checked={filteredQuestions.length > 0 && selectedIds.length === filteredQuestions.length}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                            />
                        </th>
                        <th 
                            className="py-4 cursor-pointer hover:text-slate-800 transition-colors group"
                            onClick={() => handleSort && handleSort("title")}
                        >
                            <div className="flex items-center gap-1.5">
                                <span>Question Set</span>
                                <SortIcon field="title" sortField={sortField} sortDirection={sortDirection} />
                            </div>
                        </th>
                        <th 
                            className="py-4 cursor-pointer hover:text-slate-800 transition-colors group"
                            onClick={() => handleSort && handleSort("category")}
                        >
                            <div className="flex items-center gap-1.5">
                                <span>Category</span>
                                <SortIcon field="category" sortField={sortField} sortDirection={sortDirection} />
                            </div>
                        </th>
                        <th 
                            className="py-4 cursor-pointer hover:text-slate-800 transition-colors group"
                            onClick={() => handleSort && handleSort("subCategory")}
                        >
                            <div className="flex items-center gap-1.5">
                                <span>Sub Category</span>
                                <SortIcon field="subCategory" sortField={sortField} sortDirection={sortDirection} />
                            </div>
                        </th>
                        <th 
                            className="py-4 cursor-pointer hover:text-slate-800 transition-colors group"
                            onClick={() => handleSort && handleSort("exam")}
                        >
                            <div className="flex items-center gap-1.5">
                                <span>Exam</span>
                                <SortIcon field="exam" sortField={sortField} sortDirection={sortDirection} />
                            </div>
                        </th>
                        <th className="py-4">Time Limit</th>
                        <th 
                            className="py-4 cursor-pointer hover:text-slate-800 transition-colors group"
                            onClick={() => handleSort && handleSort("questionsCount")}
                        >
                            <div className="flex items-center gap-1.5">
                                <span>Questions</span>
                                <SortIcon field="questionsCount" sortField={sortField} sortDirection={sortDirection} />
                            </div>
                        </th>
                        <th className="py-4">Plan Type</th>
                        <th className="py-4">Status</th>
                        <th className="py-4">Guest Access</th>
                        <th className="py-4">Version</th>
                        <th 
                            className="py-4 cursor-pointer hover:text-slate-800 transition-colors group"
                            onClick={() => handleSort && handleSort("createdAt")}
                        >
                            <div className="flex items-center gap-1.5">
                                <span>Created Date</span>
                                <SortIcon field="createdAt" sortField={sortField} sortDirection={sortDirection} />
                            </div>
                        </th>
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
                                    <div className="p-2 rounded-xl bg-base-100 text-lg flex-shrink-0">
                                        {getIcon(q.testType)}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span 
                                            className="line-clamp-1 max-w-[220px]" 
                                            onMouseEnter={(e) => handleShowTitleIfClipped(e, q.title)}
                                        >
                                            {q.title}
                                        </span>
                                        {q.usedInMockTests && q.usedInMockTests.length > 0 && (
                                            <div className="min-w-0 max-w-[220px] mt-0.5">
                                                <span 
                                                    className="badge badge-warning text-[10px] gap-1 font-bold py-1 px-2 rounded-md border-none bg-amber-100 text-amber-900 inline-flex items-center max-w-full min-w-0"
                                                    title={`Assigned to Mock Test(s): ${q.usedInMockTests.map(m => m.title).join(", ")}`}
                                                >
                                                    <span className="truncate flex-1 min-w-0">📌 {q.usedInMockTests[0]?.title}</span>
                                                    {q.usedInMockTests.length > 1 && <span className="opacity-80 font-black flex-shrink-0">+{q.usedInMockTests.length - 1}</span>}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="py-4">
                                <span 
                                    className="capitalize text-xs font-bold text-slate-700 hover:text-primary hover:underline cursor-pointer"
                                    onClick={() => setFilterType && setFilterType(q.category || q.testType)}
                                    title={`Click to show only ${q.category || q.testType} questions`}
                                >
                                    {q.category || q.testType}
                                </span>
                            </td>
                            <td className="py-4">
                                {(() => {
                                    const subCat = q.subCategory || getSetCategory(q);
                                    return (
                                        <span 
                                            className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border truncate inline-block max-w-[180px] cursor-pointer hover:scale-105 transition-transform ${getCategoryBadgeStyle(subCat)}`} 
                                            title={`Click to show only "${subCat}" questions`}
                                            onClick={() => setFilterSubCategory && setFilterSubCategory(subCat)}
                                        >
                                            {subCat}
                                        </span>
                                    );
                                })()}
                            </td>
                            <td className="py-4">
                                <span className={`badge badge-sm font-bold border-none ${
                                    q.examType === 'IELTS' ? 'bg-blue-50 text-blue-700' :
                                    q.examType === 'PTE' ? 'bg-green-50 text-green-700' :
                                    'bg-amber-50 text-amber-700'
                                }`}>{q.examType || 'IELTS'}</span>
                            </td>
                            <td className="py-4 font-semibold text-xs text-slate-600">
                                {q.timeLimit ? `⏱️ ${q.timeLimit} mins` : (q.examType === 'PTE' ? '⏱️ 20 mins (Def)' : '⏱️ Standard')}
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
