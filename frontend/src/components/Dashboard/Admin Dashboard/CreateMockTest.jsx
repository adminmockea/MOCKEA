import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { 
    PiFiles, 
    PiBookOpen, 
    PiEar, 
    PiPencilLine, 
    PiMicrophoneStage,
    PiPlus,
    PiCheckCircle
} from "react-icons/pi";
import { useNavigate, useParams } from "react-router";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import { DEFAULT_MOCK_TEST_DURATION_MINUTES } from "../../../constants";

const EXAM_COLORS = {
    IELTS: "badge-primary",
    PTE: "badge-success",
    BOTH: "badge-warning",
};

const CreateMockTest = () => {
    const { id } = useParams();
    const axiosSecure = useAxiosSecure();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        planType: "free",
        examType: "IELTS",
        isPublic: false,
        totalDuration: DEFAULT_MOCK_TEST_DURATION_MINUTES,
        sections: {
            reading: [],
            listening: [],
            writing: [],
            speaking: []
        }
    });

    const { data: testData, isLoading: isTestLoading } = useQuery({
        queryKey: ["admin-mock-test-detail", id],
        queryFn: async () => {
            const res = await axiosSecure.get(`/mock-tests/${id}`);
            return res.data.test;
        },
        enabled: !!id
    });

    useEffect(() => {
        if (testData) {
            setFormData({
                title: testData.title || "",
                description: testData.description || "",
                planType: testData.planType || "free",
                examType: testData.examType || "IELTS",
                isPublic: !!testData.isPublic,
                totalDuration: testData.totalDuration || DEFAULT_MOCK_TEST_DURATION_MINUTES,
                sections: {
                    reading: testData.sections?.reading?.map(q => q._id || q.id || q) || [],
                    listening: testData.sections?.listening?.map(q => q._id || q.id || q) || [],
                    writing: testData.sections?.writing?.map(q => q._id || q.id || q) || [],
                    speaking: testData.sections?.speaking?.map(q => q._id || q.id || q) || []
                }
            });
        }
    }, [testData]);

    const { data: questions = [] } = useQuery({
        queryKey: ["admin-questions-for-bundle"],
        queryFn: async () => {
            const res = await axiosSecure.get("/questions");
            return res.data.questions ?? [];
        }
    });

    const mutation = useMutation({
        mutationFn: (data) => {
            if (id) {
                return axiosSecure.put(`/mock-tests/${id}`, data);
            }
            return axiosSecure.post("/mock-tests/create", data);
        },
        onSuccess: () => {
            toast.success(id ? "Mock Test updated successfully!" : "Mock Test created successfully!");
            queryClient.invalidateQueries({ queryKey: ["admin-mock-tests"] });
            queryClient.invalidateQueries({ queryKey: ["admin-mock-test-detail", id] });
            navigate("/dashboard/admin/manage-mock-tests");
        }
    });

    const toggleQuestion = (type, id) => {
        const current = formData.sections[type];
        const exists = current.includes(id);
        
        setFormData({
            ...formData,
            sections: {
                ...formData.sections,
                [type]: exists ? current.filter(qId => qId !== id) : [...current, id]
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    const [mockUsageFilter, setMockUsageFilter] = useState("all"); // "all", "unused", "in_mock"

    const sectionIcons = {
        reading: <PiBookOpen />,
        listening: <PiEar />,
        writing: <PiPencilLine />,
        speaking: <PiMicrophoneStage />
    };

    // Filter questions matching the selected examType and mock usage filter
    const filteredQuestions = (type) => {
        return questions.filter(q => {
            if (q.testType !== type) return false;
            
            // Exam type filter
            const matchesExam = formData.examType === "BOTH" || (q.examType === formData.examType || q.examType === "BOTH");
            if (!matchesExam) return false;

            // Mock usage filter
            const hasMockTests = q.usedInMockTests && q.usedInMockTests.length > 0;
            if (mockUsageFilter === "unused" && hasMockTests) return false;
            if (mockUsageFilter === "in_mock" && !hasMockTests) return false;

            return true;
        });
    };

    const handleShowTitleIfClipped = (e, title) => {
        const el = e.currentTarget;
        if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) {
            el.setAttribute("title", title);
        } else {
            el.removeAttribute("title");
        }
    };

    if (id && isTestLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
            <header className="flex flex-col gap-2">
                <p className="text-sm uppercase tracking-[0.3em] text-primary font-semibold">Admin Panel</p>
                <h1 className="text-3xl font-bold flex items-center gap-2"><PiFiles className="text-primary" /> {id ? "Edit Full Mock Test" : "Create Full Mock Test"}</h1>
                <p className="text-base-content/60">Bundle multiple question sets into a complete mock exam. Questions are filtered by exam program.</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Details */}
                <div className="card bg-white border border-base-300 shadow-sm p-6 grid md:grid-cols-3 gap-6">
                    <div className="form-control md:col-span-1">
                        <label className="label"><span className="label-text font-bold">Test Title</span></label>
                        <input 
                            type="text" 
                            className="input input-bordered rounded-2xl" 
                            placeholder="e.g. Full Mock Test #1"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required
                        />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text font-bold">Exam Program</span></label>
                        <select 
                            className="select select-bordered rounded-2xl font-bold"
                            value={formData.examType}
                            onChange={(e) => {
                                // Reset sections when exam type changes to prevent mis-bundling
                                setFormData({
                                    ...formData,
                                    examType: e.target.value,
                                    sections: { reading: [], listening: [], writing: [], speaking: [] }
                                });
                            }}
                        >
                            <option value="IELTS">🎓 IELTS</option>
                            <option value="PTE">📘 PTE Academic</option>
                            <option value="BOTH">🌐 Both (IELTS &amp; PTE)</option>
                        </select>
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text font-bold">Plan Type</span></label>
                        <select 
                            className="select select-bordered rounded-2xl"
                            value={formData.planType}
                            onChange={(e) => setFormData({...formData, planType: e.target.value})}
                        >
                            <option value="free">Free</option>
                            <option value="standard">Standard</option>
                            <option value="premium">Premium</option>
                        </select>
                    </div>
                    <div className="form-control md:col-span-2">
                        <label className="label"><span className="label-text font-bold">Total Duration (Minutes)</span></label>
                        <input 
                            type="number" 
                            className="input input-bordered rounded-2xl" 
                            value={formData.totalDuration}
                            onChange={(e) => setFormData({...formData, totalDuration: parseInt(e.target.value)})}
                        />
                    </div>
                    <div className="form-control flex flex-col justify-end">
                        <label className="label cursor-pointer gap-3 justify-start">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-primary"
                                checked={formData.isPublic}
                                onChange={e => setFormData({ ...formData, isPublic: e.target.checked })}
                            />
                            <span className="label-text font-semibold">Public (guest practice)</span>
                        </label>
                    </div>
                </div>

                {/* Exam type & Mock Filter banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border text-sm font-semibold bg-white border-base-300 shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">{formData.examType === 'IELTS' ? '🎓' : formData.examType === 'PTE' ? '📘' : '🌐'}</span>
                        <span>Showing questions for: <strong>{formData.examType === 'BOTH' ? 'All Exams (IELTS + PTE)' : formData.examType}</strong>. Switching exam type clears your selection.</span>
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-auto bg-base-200 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setMockUsageFilter("all")}
                            className={`btn btn-xs rounded-lg font-bold border-none ${mockUsageFilter === "all" ? "bg-white text-primary shadow-sm" : "btn-ghost text-base-content/60"}`}
                        >
                            All
                        </button>
                        <button
                            type="button"
                            onClick={() => setMockUsageFilter("unused")}
                            className={`btn btn-xs rounded-lg font-bold border-none ${mockUsageFilter === "unused" ? "bg-white text-primary shadow-sm" : "btn-ghost text-base-content/60"}`}
                        >
                            Unused Only
                        </button>
                        <button
                            type="button"
                            onClick={() => setMockUsageFilter("in_mock")}
                            className={`btn btn-xs rounded-lg font-bold border-none ${mockUsageFilter === "in_mock" ? "bg-white text-primary shadow-sm" : "btn-ghost text-base-content/60"}`}
                        >
                            📌 In Mock Tests
                        </button>
                    </div>
                </div>

                {/* Section Bundler */}
                <div className="space-y-6">
                    {['reading', 'listening', 'writing', 'speaking'].map((type) => {
                        const sectionQs = filteredQuestions(type);
                        return (
                            <div key={type} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold flex items-center gap-2 capitalize">
                                        <span className="p-2 rounded-xl bg-base-200">{sectionIcons[type]}</span>
                                        Select {type} Content
                                    </h3>
                                    {formData.sections[type].length > 0 && (
                                        <span className="badge badge-primary badge-sm px-3 py-2 font-black">
                                            {formData.sections[type].length} selected
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {sectionQs.map((q) => {
                                        const isSelected = formData.sections[type].includes(q._id);
                                        const mockList = q.usedInMockTests || [];
                                        const inMockTest = mockList.length > 0;
                                        const mockNames = mockList.map(m => m.title).join(", ");

                                        return (
                                            <div 
                                                key={q._id}
                                                onClick={() => toggleQuestion(type, q._id)}
                                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                                    isSelected
                                                    ? "border-primary bg-primary/5 shadow-inner"
                                                    : inMockTest
                                                    ? "border-amber-300/80 bg-amber-50/40 hover:border-amber-400"
                                                    : "border-base-300 bg-white hover:border-primary/40"
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between gap-2">
                                                        <span 
                                                            className="font-semibold text-sm line-clamp-1 flex-1"
                                                            onMouseEnter={(e) => handleShowTitleIfClipped(e, q.title)}
                                                        >
                                                            {q.title}
                                                        </span>
                                                        {isSelected && <PiCheckCircle className="text-primary flex-shrink-0 text-lg" />}
                                                    </div>

                                                    {inMockTest && (
                                                        <div className="mt-2 min-w-0 max-w-full">
                                                            <span 
                                                                className="badge badge-warning badge-xs gap-1 font-bold py-2 px-2.5 rounded-lg border-none bg-amber-100 text-amber-900 inline-flex items-center max-w-full min-w-0"
                                                                title={`Already in Mock Test(s): ${mockNames}`}
                                                            >
                                                                <span className="truncate flex-1 min-w-0">📌 In Mock Test: {mockList[0]?.title}</span>
                                                                {mockList.length > 1 && <span className="opacity-80 font-black flex-shrink-0">+{mockList.length - 1}</span>}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-base-200/60">
                                                    <p className="text-[10px] text-base-content/50 font-medium">{q.questions?.length || 0} Questions</p>
                                                    <span className={`badge badge-xs font-black ${EXAM_COLORS[q.examType] || 'badge-ghost'}`}>{q.examType}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {sectionQs.length === 0 && (
                                        <div className="col-span-full py-8 text-center text-sm text-base-content/40 border-2 border-dashed border-base-300 rounded-2xl">
                                            No {type} questions match the selected filter for <strong>{formData.examType}</strong>.
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end pt-8">
                    <button 
                        type="submit" 
                        className="btn btn-primary btn-lg rounded-2xl px-12 gap-3 shadow-lg shadow-primary/20"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? <span className="loading loading-spinner" /> : (id ? <PiCheckCircle className="w-6 h-6" /> : <PiPlus className="w-6 h-6" />)}
                        {id ? "Save Mock Test" : "Create Mock Test"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateMockTest;
