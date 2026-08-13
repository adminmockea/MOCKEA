import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { 
    PiFiles, 
    PiBookOpen, 
    PiEar, 
    PiPencilLine, 
    PiMicrophoneStage,
    PiPlus,
    PiCheckCircle,
    PiArrowLeft,
    PiArrowRight,
    PiMagnifyingGlass,
    PiTrash,
    PiGear,
    PiListChecks,
    PiSparkle,
    PiX,
    PiCheck,
    PiInfo,
    PiClock,
    PiGlobe,
    PiLockKey,
    PiShieldCheck
} from "react-icons/pi";
import { useNavigate, useParams } from "react-router";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import { DEFAULT_MOCK_TEST_DURATION_MINUTES } from "../../../constants";

const EXAM_COLORS = {
    IELTS: "bg-blue-100 text-blue-800 border-blue-200",
    PTE: "bg-emerald-100 text-emerald-800 border-emerald-200",
    BOTH: "bg-purple-100 text-purple-800 border-purple-200",
};

const WIZARD_STEPS = [
    { id: "overview", label: "General Settings", short: "Overview", icon: <PiGear /> },
    { id: "reading", label: "Reading Passages", short: "Reading", icon: <PiBookOpen /> },
    { id: "listening", label: "Listening Audio", short: "Listening", icon: <PiEar /> },
    { id: "writing", label: "Writing Tasks", short: "Writing", icon: <PiPencilLine /> },
    { id: "speaking", label: "Speaking Prompts", short: "Speaking", icon: <PiMicrophoneStage /> },
    { id: "review", label: "Review & Publish", short: "Review", icon: <PiListChecks /> },
    { id: "all", label: "All Sections View", short: "All Sections", icon: <PiFiles /> }
];

const CreateMockTest = () => {
    const { id } = useParams();
    const axiosSecure = useAxiosSecure();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Active wizard step index (0 = overview, 1 = reading, 2 = listening, 3 = writing, 4 = speaking, 5 = review)
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Per-section search query state
    const [searchQueries, setSearchQueries] = useState({
        reading: "",
        listening: "",
        writing: "",
        speaking: ""
    });

    const [mockUsageFilter, setMockUsageFilter] = useState("all"); // "all", "unused", "in_mock"

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

    const toggleQuestion = (type, qId) => {
        const current = formData.sections[type];
        const exists = current.includes(qId);
        
        setFormData({
            ...formData,
            sections: {
                ...formData.sections,
                [type]: exists ? current.filter(item => item !== qId) : [...current, qId]
            }
        });
    };

    const clearSectionSelection = (type) => {
        setFormData({
            ...formData,
            sections: {
                ...formData.sections,
                [type]: []
            }
        });
    };

    const selectAllUnusedInSection = (type) => {
        const unusedIds = filteredQuestions(type)
            .filter(q => (!q.usedInMockTests || q.usedInMockTests.length === 0))
            .map(q => q._id);
        
        const combined = Array.from(new Set([...formData.sections[type], ...unusedIds]));
        setFormData({
            ...formData,
            sections: {
                ...formData.sections,
                [type]: combined
            }
        });
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();

        if (!formData.title.trim()) {
            toast.error("Please enter a title for the mock test.");
            setCurrentStepIndex(0);
            return;
        }

        mutation.mutate(formData);
    };

    const sectionIcons = {
        reading: <PiBookOpen className="text-emerald-600" />,
        listening: <PiEar className="text-blue-600" />,
        writing: <PiPencilLine className="text-amber-600" />,
        speaking: <PiMicrophoneStage className="text-purple-600" />
    };

    const sectionTitles = {
        reading: "Reading Passages",
        listening: "Listening Audio Sets",
        writing: "Writing Tasks",
        speaking: "Speaking Prompts"
    };

    // Recommended section target counts
    const recommendedCounts = useMemo(() => {
        if (formData.examType === "IELTS") {
            return { reading: 3, listening: 4, writing: 1, speaking: 1 };
        }
        if (formData.examType === "PTE") {
            return { reading: 5, listening: 8, writing: 1, speaking: 5 };
        }
        return { reading: 3, listening: 4, writing: 1, speaking: 1 };
    }, [formData.examType]);

    // Calculate aggregated question metrics
    const totalQuestionsCount = useMemo(() => {
        let total = 0;
        const selectedIdsMap = {
            reading: new Set(formData.sections.reading),
            listening: new Set(formData.sections.listening),
            writing: new Set(formData.sections.writing),
            speaking: new Set(formData.sections.speaking),
        };

        questions.forEach(q => {
            if (selectedIdsMap[q.testType] && selectedIdsMap[q.testType].has(q._id)) {
                total += q.questions?.length || 1;
            }
        });
        return total;
    }, [formData.sections, questions]);

    const totalSelectedSets = useMemo(() => {
        return (
            formData.sections.reading.length +
            formData.sections.listening.length +
            formData.sections.writing.length +
            formData.sections.speaking.length
        );
    }, [formData.sections]);

    // Filter questions matching examType, mock usage, and section search query
    const filteredQuestions = (type) => {
        const query = (searchQueries[type] || "").toLowerCase().trim();
        return questions.filter(q => {
            if (q.testType !== type) return false;
            
            // Exam type filter
            const matchesExam = formData.examType === "BOTH" || (q.examType === formData.examType || q.examType === "BOTH");
            if (!matchesExam) return false;

            // Mock usage filter
            const hasMockTests = q.usedInMockTests && q.usedInMockTests.length > 0;
            if (mockUsageFilter === "unused" && hasMockTests) return false;
            if (mockUsageFilter === "in_mock" && !hasMockTests) return false;

            // Text search
            if (query) {
                const titleMatch = q.title?.toLowerCase().includes(query);
                const codeMatch = q.questionCode?.toLowerCase().includes(query);
                if (!titleMatch && !codeMatch) return false;
            }

            return true;
        });
    };

    if (id && isTestLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[450px] gap-3">
                <span className="loading loading-spinner loading-lg text-primary" />
                <p className="text-sm font-semibold text-slate-500">Loading Mock Test Details...</p>
            </div>
        );
    }

    const activeStepId = WIZARD_STEPS[currentStepIndex]?.id || "overview";

    // Dynamic list of modules to render based on current step
    const activeModuleTypes = activeStepId === "all"
        ? ['reading', 'listening', 'writing', 'speaking']
        : ['reading', 'listening', 'writing', 'speaking'].includes(activeStepId)
        ? [activeStepId]
        : [];

    return (
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* Top Breadcrumb & Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="space-y-1">
                    <button
                        type="button"
                        onClick={() => navigate("/dashboard/admin/manage-mock-tests")}
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-primary transition-colors mb-1"
                    >
                        <PiArrowLeft className="w-3.5 h-3.5" /> Back to Manage Mock Tests
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 text-2xl font-bold">
                            <PiFiles />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900">
                                {id ? "Edit Mock Test Bundle" : "Create New Mock Test"}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500">
                                Build complete exam packages by bundling reading, listening, writing, and speaking modules.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                    <button
                        type="button"
                        onClick={() => navigate("/dashboard/admin/manage-mock-tests")}
                        className="btn btn-ghost btn-sm rounded-xl font-bold text-slate-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={mutation.isPending}
                        className="btn btn-primary btn-md rounded-2xl px-6 gap-2 shadow-md font-bold"
                    >
                        {mutation.isPending ? (
                            <span className="loading loading-spinner loading-sm" />
                        ) : id ? (
                            <PiCheckCircle className="w-5 h-5" />
                        ) : (
                            <PiPlus className="w-5 h-5" />
                        )}
                        {id ? "Save Changes" : "Publish Mock Test"}
                    </button>
                </div>
            </div>

            {/* Step Wizard Progress Bar */}
            <div className="bg-white border border-slate-200 rounded-3xl p-3 shadow-sm overflow-x-auto scrollbar-none">
                <div className="flex items-center justify-between min-w-[760px] gap-2">
                    {WIZARD_STEPS.map((step, idx) => {
                        const isActive = currentStepIndex === idx;
                        const isPast = currentStepIndex > idx && step.id !== "all";
                        
                        let count = 0;
                        let target = 0;
                        if (step.id !== "overview" && step.id !== "review" && step.id !== "all") {
                            count = formData.sections[step.id]?.length || 0;
                            target = recommendedCounts[step.id] || 0;
                        }

                        return (
                            <button
                                key={step.id}
                                type="button"
                                onClick={() => setCurrentStepIndex(idx)}
                                className={`flex-1 flex items-center gap-2.5 p-3 rounded-2xl transition-all text-left relative ${
                                    isActive
                                        ? "bg-slate-900 text-white shadow-md"
                                        : isPast
                                        ? "bg-indigo-50/60 text-indigo-950 hover:bg-indigo-100/60"
                                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                }`}
                            >
                                <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                                    isActive
                                        ? "bg-white/20 text-white"
                                        : isPast
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-200 text-slate-600"
                                }`}>
                                    {isPast ? <PiCheck className="w-3.5 h-3.5" /> : idx + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-xs font-bold truncate flex items-center gap-1">
                                        <span>{step.short}</span>
                                    </div>
                                    {step.id !== "overview" && step.id !== "review" && step.id !== "all" ? (
                                        <div className={`text-[10px] font-semibold truncate ${isActive ? "text-slate-300" : "text-slate-400"}`}>
                                            {count} / {target} sets
                                        </div>
                                    ) : (
                                        <div className={`text-[10px] font-semibold truncate ${isActive ? "text-slate-300" : "text-slate-400"}`}>
                                            {step.id === "overview" ? "Basic Info" : step.id === "review" ? "Final Check" : "View All"}
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Form Layout (Workspace + Right Sticky Summary) */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Main Workspace (Left Column) */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-6">

                    {/* Step 1: General Settings (Renders on 'overview' or 'all') */}
                    {(activeStepId === "overview" || activeStepId === "all") && (
                        <div className="card bg-white border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 rounded-3xl">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 text-xl font-bold">
                                    <PiGear />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">General Test Configuration</h2>
                                    <p className="text-xs sm:text-sm text-slate-500">Define test title, program category, student access tier, and total duration.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-control md:col-span-2">
                                    <label className="label mb-1"><span className="label-text font-bold text-slate-800 text-sm">Test Title <span className="text-rose-500">*</span></span></label>
                                    <input 
                                        type="text" 
                                        className="input input-bordered rounded-2xl border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-semibold text-slate-900" 
                                        placeholder="e.g. IELTS Academic Full Practice Exam #4"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label mb-1"><span className="label-text font-bold text-slate-800 text-sm">Exam Program</span></label>
                                    <select 
                                        className="select select-bordered rounded-2xl border-slate-300 focus:border-indigo-600 font-bold text-slate-900"
                                        value={formData.examType}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData({
                                                ...formData,
                                                examType: val,
                                                sections: { reading: [], listening: [], writing: [], speaking: [] }
                                            });
                                            toast.info(`Switched exam program to ${val}. Question selections reset.`);
                                        }}
                                    >
                                        <option value="IELTS">🎓 IELTS Academic / General</option>
                                        <option value="PTE">📘 PTE Academic</option>
                                        <option value="BOTH">🌐 Both (IELTS &amp; PTE)</option>
                                    </select>
                                    <span className="text-[11px] text-slate-400 mt-1">Switching exam program clears existing module selections to maintain test integrity.</span>
                                </div>

                                <div className="form-control">
                                    <label className="label mb-1"><span className="label-text font-bold text-slate-800 text-sm">Subscription Plan Tier</span></label>
                                    <select 
                                        className="select select-bordered rounded-2xl border-slate-300 focus:border-indigo-600 font-semibold text-slate-900"
                                        value={formData.planType}
                                        onChange={(e) => setFormData({...formData, planType: e.target.value})}
                                    >
                                        <option value="free">🟢 Free Access (All Students)</option>
                                        <option value="standard">🔵 Standard Tier Only</option>
                                        <option value="premium">⭐ Premium Tier Only</option>
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label mb-1"><span className="label-text font-bold text-slate-800 text-sm">Total Duration (Minutes)</span></label>
                                    <div className="relative">
                                        <PiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input 
                                            type="number" 
                                            min="1"
                                            className="input input-bordered w-full pl-12 rounded-2xl border-slate-300 focus:border-indigo-600 font-bold text-slate-900" 
                                            value={formData.totalDuration}
                                            onChange={(e) => setFormData({...formData, totalDuration: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                </div>

                                <div className="form-control flex flex-col justify-center">
                                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                                        <div className="space-y-0.5">
                                            <span className="font-bold text-sm text-slate-900 block flex items-center gap-1.5">
                                                <PiGlobe className="text-indigo-600" /> Public Guest Access
                                            </span>
                                            <span className="text-xs text-slate-500 block">
                                                Allow unregistered guest users to practice this test without logging in.
                                            </span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary toggle-md"
                                            checked={formData.isPublic}
                                            onChange={e => setFormData({ ...formData, isPublic: e.target.checked })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section Modules (Reading, Listening, Writing, Speaking) */}
                    {activeModuleTypes.map((type) => {
                        const sectionQs = filteredQuestions(type);
                        const selectedCount = formData.sections[type].length;
                        const targetCount = recommendedCounts[type];
                        const searchQuery = searchQueries[type] || "";

                        return (
                            <div key={type} className="card bg-white border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 rounded-3xl">
                                
                                {/* Section Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-2xl shadow-xs">
                                            {sectionIcons[type]}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-extrabold text-slate-900 capitalize">
                                                Select {type} Question Sets
                                            </h2>
                                            <p className="text-xs sm:text-sm text-slate-500">
                                                Choose questions to include in the {type} section.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Section Counter Badge & Actions */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border ${
                                            selectedCount >= targetCount
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : selectedCount > 0
                                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                                : "bg-slate-100 text-slate-600 border-slate-200"
                                        }`}>
                                            <span className="w-2 h-2 rounded-full bg-current" />
                                            <span>{selectedCount} of {targetCount} recommended selected</span>
                                        </div>

                                        {selectedCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => clearSectionSelection(type)}
                                                className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 rounded-xl font-bold gap-1"
                                            >
                                                <PiTrash className="w-3.5 h-3.5" /> Clear ({selectedCount})
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => selectAllUnusedInSection(type)}
                                            className="btn btn-outline btn-sm rounded-xl font-bold gap-1 text-xs text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                                        >
                                            <PiSparkle className="w-3.5 h-3.5" /> Select Unused
                                        </button>
                                    </div>
                                </div>

                                {/* Search Bar & Filter Segment */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
                                    {/* Search Input */}
                                    <div className="relative w-full sm:w-80">
                                        <PiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQueries({ ...searchQueries, [type]: e.target.value })}
                                            placeholder={`Search ${type} question sets...`}
                                            className="input input-sm input-bordered w-full pl-10 pr-8 rounded-xl bg-white text-xs font-medium border-slate-300 focus:border-indigo-600"
                                        />
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setSearchQueries({ ...searchQueries, [type]: "" })}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                <PiX className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Filter Segmented Controls */}
                                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 w-full sm:w-auto justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setMockUsageFilter("all")}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                                mockUsageFilter === "all" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                                            }`}
                                        >
                                            All Sets
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMockUsageFilter("unused")}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                                mockUsageFilter === "unused" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                                            }`}
                                        >
                                            Unused Only
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMockUsageFilter("in_mock")}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                                mockUsageFilter === "in_mock" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                                            }`}
                                        >
                                            📌 In Mock Tests
                                        </button>
                                    </div>
                                </div>

                                {/* Questions Cards Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {sectionQs.map((q) => {
                                        const isSelected = formData.sections[type].includes(q._id);
                                        const selectedIndex = formData.sections[type].indexOf(q._id) + 1;
                                        const mockList = q.usedInMockTests || [];
                                        const inMockTest = mockList.length > 0;
                                        const mockNames = mockList.map(m => m.title).join(", ");

                                        return (
                                            <div 
                                                key={q._id}
                                                onClick={() => toggleQuestion(type, q._id)}
                                                className={`group p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between relative bg-white ${
                                                    isSelected
                                                        ? "border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-100"
                                                        : inMockTest
                                                        ? "border-amber-200 bg-amber-50/30 hover:border-amber-400 hover:shadow-md"
                                                        : "border-slate-200 hover:border-indigo-400 hover:shadow-md"
                                                }`}
                                            >
                                                <div className="space-y-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <h4 className="font-bold text-sm text-slate-900 line-clamp-2 flex-1 group-hover:text-indigo-600 transition-colors">
                                                            {q.title}
                                                        </h4>
                                                        
                                                        {isSelected ? (
                                                            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0 shadow-xs">
                                                                {selectedIndex}
                                                            </div>
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-indigo-500 flex-shrink-0" />
                                                        )}
                                                    </div>

                                                    {inMockTest && (
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-900 text-[11px] font-bold max-w-full" title={`Assigned to: ${mockNames}`}>
                                                            <span className="truncate">📌 In Mock: {mockList[0]?.title}</span>
                                                            {mockList.length > 1 && <span className="opacity-75 font-black">+{mockList.length - 1}</span>}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 text-xs font-semibold">
                                                    <span className="text-slate-500">
                                                        {q.questions?.length || 0} Questions
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${EXAM_COLORS[q.examType] || 'bg-slate-100 text-slate-700'}`}>
                                                        {q.examType}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {sectionQs.length === 0 && (
                                        <div className="col-span-full py-12 text-center space-y-2 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                                            <div className="text-4xl opacity-30 flex justify-center text-slate-400">
                                                {sectionIcons[type]}
                                            </div>
                                            <p className="text-sm font-bold text-slate-700">
                                                No {type} question sets match your criteria.
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Try clearing your search query or switching exam program from <strong>{formData.examType}</strong>.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Step 6: Review & Final Checklist (Renders on 'review' or 'all') */}
                    {(activeStepId === "review" || activeStepId === "all") && (
                        <div className="card bg-white border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 rounded-3xl">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 text-xl font-bold">
                                    <PiListChecks />
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-900">Review Test Summary &amp; Completeness</h2>
                                    <p className="text-xs sm:text-sm text-slate-500">Verify your mock test structure before publishing to students.</p>
                                </div>
                            </div>

                            {/* Exam Overview Summary Card */}
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Exam Program</span>
                                    <span className="text-sm font-black text-slate-900">{formData.examType}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Plan Tier</span>
                                    <span className="text-sm font-black text-slate-900 uppercase">{formData.planType}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Duration</span>
                                    <span className="text-sm font-black text-slate-900">{formData.totalDuration} Mins</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Guest Practice</span>
                                    <span className="text-sm font-black text-slate-900">{formData.isPublic ? "Allowed" : "Disabled"}</span>
                                </div>
                            </div>

                            {/* Section Compliance Diagnostics */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {['reading', 'listening', 'writing', 'speaking'].map(type => {
                                    const count = formData.sections[type].length;
                                    const target = recommendedCounts[type];
                                    const isComplete = count >= target;

                                    return (
                                        <div key={type} className={`p-4 rounded-2xl border flex items-center justify-between ${
                                            isComplete ? "bg-emerald-50/60 border-emerald-200" : count > 0 ? "bg-amber-50/60 border-amber-200" : "bg-slate-50 border-slate-200"
                                        }`}>
                                            <div className="flex items-center gap-3">
                                                <span className="p-2.5 rounded-xl bg-white shadow-xs">
                                                    {sectionIcons[type]}
                                                </span>
                                                <div>
                                                    <span className="font-bold text-sm capitalize block text-slate-900">{sectionTitles[type]}</span>
                                                    <span className="text-xs text-slate-500">{count} of {target} sets selected</span>
                                                </div>
                                            </div>

                                            {isComplete ? (
                                                <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1">
                                                    <PiCheck className="w-3.5 h-3.5" /> Optimal
                                                </span>
                                            ) : count > 0 ? (
                                                <span className="px-3 py-1 rounded-xl bg-amber-500 text-white font-bold text-xs inline-flex items-center gap-1">
                                                    Partial
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-xl bg-slate-200 text-slate-600 font-bold text-xs">
                                                    Empty
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
                                <PiShieldCheck className="text-indigo-600 w-6 h-6 flex-shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-indigo-950">Ready to Publish</h4>
                                    <p className="text-xs text-indigo-900/80">
                                        Submitting will instantly make this mock test available in the admin dashboard and student practice catalog under <strong>{formData.examType}</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Wizard Footer Navigation Controls */}
                    <div className="flex items-center justify-between pt-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                        <button
                            type="button"
                            disabled={currentStepIndex === 0}
                            onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
                            className="btn btn-outline btn-sm rounded-xl font-bold gap-2 text-slate-600 border-slate-300 hover:bg-slate-100 disabled:opacity-30"
                        >
                            <PiArrowLeft className="w-4 h-4" /> Previous Step
                        </button>

                        <div className="text-xs font-bold text-slate-400">
                            {activeStepId === "all" ? "Viewing All Sections" : `Step ${currentStepIndex + 1} of ${WIZARD_STEPS.length}`}
                        </div>

                        {currentStepIndex < WIZARD_STEPS.length - 1 && activeStepId !== "all" ? (
                            <button
                                type="button"
                                onClick={() => setCurrentStepIndex(prev => Math.min(WIZARD_STEPS.length - 1, prev + 1))}
                                className="btn btn-primary btn-sm rounded-xl font-bold gap-2 shadow-sm"
                            >
                                Next Step: {WIZARD_STEPS[currentStepIndex + 1].short} <PiArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={mutation.isPending}
                                className="btn btn-primary btn-sm rounded-xl font-bold gap-2 shadow-md"
                            >
                                {mutation.isPending ? <span className="loading loading-spinner loading-xs" /> : <PiCheckCircle className="w-4 h-4" />}
                                {id ? "Save Changes" : "Publish Mock Test"}
                            </button>
                        )}
                    </div>

                </div>

                {/* Right Sticky Live Summary Sidebar */}
                <div className="lg:col-span-4 xl:col-span-3 sticky top-6 space-y-4">
                    <div className="card bg-white border border-slate-200 shadow-sm p-5 rounded-3xl space-y-5">
                        
                        {/* Sidebar Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-extrabold text-sm flex items-center gap-2 text-slate-900">
                                <PiSparkle className="text-indigo-600" /> Test Summary
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs">
                                {formData.examType}
                            </span>
                        </div>

                        {/* Title Preview */}
                        <div className="space-y-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Test Title</span>
                            <p className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2">
                                {formData.title || <span className="italic text-slate-400">Untitled Mock Test</span>}
                            </p>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Selected Sets</span>
                                <span className="text-lg font-black text-indigo-600">{totalSelectedSets}</span>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Questions</span>
                                <span className="text-lg font-black text-indigo-600">{totalQuestionsCount}</span>
                            </div>
                        </div>

                        {/* Module Progress Breakdown */}
                        <div className="space-y-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Module Requirements</span>
                            
                            {['reading', 'listening', 'writing', 'speaking'].map((type, idx) => {
                                const count = formData.sections[type].length;
                                const target = recommendedCounts[type];
                                const pct = Math.min(100, Math.round((count / target) * 100));

                                return (
                                    <div 
                                        key={type}
                                        onClick={() => setCurrentStepIndex(idx + 1)}
                                        className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 cursor-pointer transition-all bg-slate-50/50 hover:bg-white space-y-1.5"
                                    >
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="flex items-center gap-1.5 capitalize text-slate-800">
                                                {sectionIcons[type]}
                                                {type}
                                            </span>
                                            <span className="text-slate-500 text-[11px]">
                                                {count} / {target}
                                            </span>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-300 ${
                                                    pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-indigo-600" : "bg-transparent"
                                                }`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Save Action */}
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                            <button
                                type="submit"
                                disabled={mutation.isPending}
                                className="btn btn-primary btn-md w-full rounded-2xl gap-2 font-bold shadow-md"
                            >
                                {mutation.isPending ? (
                                    <span className="loading loading-spinner loading-xs" />
                                ) : id ? (
                                    <PiCheckCircle className="w-5 h-5" />
                                ) : (
                                    <PiPlus className="w-5 h-5" />
                                )}
                                {id ? "Save Changes" : "Publish Mock Test"}
                            </button>
                            <p className="text-[11px] text-center text-slate-400">
                                Duration: <strong>{formData.totalDuration} mins</strong> • Access: <strong>{formData.planType}</strong>
                            </p>
                        </div>

                    </div>
                </div>

            </form>
        </div>
    );
};

export default CreateMockTest;


