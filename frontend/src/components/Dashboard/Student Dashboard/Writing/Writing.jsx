import { useState, useEffect, useMemo } from "react";
import useCountdown from "../../../../hooks/useCountdown";
import useAxiosSecure from "../../../../hooks/useAxiosSecure.jsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAuth from "../../../../hooks/useAuth.jsx";
import useUserProfile from "../../../../hooks/useUserProfile.jsx";
import { toast } from "react-toastify";
import alerts from "../../../../utils/alerts";
import Swal from "sweetalert2";
import Loader from "../../../Loader/Loader.jsx";
import { motion } from "framer-motion";
import DOMPurify from 'dompurify';
import {
    PiPencilLineFill, 
    PiClockFill, 
    PiTextAaFill, 
    PiCheckCircleFill,
    PiArrowLeftBold,
} from "react-icons/pi";
import { useNavigate } from "react-router";
import useTestIntegrity from "../../../../hooks/useTestIntegrity.jsx";
import TestShell from "../../../Common/TestShell.jsx";
import { getSetCategory, getCategoryBadgeStyle } from "../../../../utils/questionCategoryUtils.js";
import CategoryDropdown from "../../../Common/CategoryDropdown.jsx";


const getTaskContent = (activeSet, tab, isPte) => {
  if (!activeSet) return "";
  if (isPte) {
    if (activeSet.questions?.length === 1) {
      const qText = activeSet.questions[0]?.question || activeSet.passage || "";
      return DOMPurify.sanitize(qText.replace(/\n/g, "<br />"));
    }
    const qIndex = tab === "task1" ? 0 : 1;
    const qText = activeSet.questions?.[qIndex]?.question || activeSet.passage || "";
    return DOMPurify.sanitize(qText.replace(/\n/g, "<br />"));
  }
  const passage = activeSet.passage;
  if (!passage) return "";
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(passage, "text/html");
  
  // Find the header elements containing "Task 1" or "Task 2"
  const headings = Array.from(doc.querySelectorAll("h3"));
  const taskHeading = headings.find(h => 
    tab === "task1" 
      ? h.textContent.toLowerCase().includes("task 1") 
      : h.textContent.toLowerCase().includes("task 2")
  );
  
  if (taskHeading) {
    // The task content is inside the parent container of this heading
    const container = taskHeading.closest(".p-6") || taskHeading.parentElement;
    if (container) {
      return DOMPurify.sanitize(container.outerHTML, { ADD_TAGS: ["img"], ADD_ATTR: ["class", "src", "alt"] });
    }
  }
  
  // Fallback: If DOMParser didn't find it, do a basic split
  if (tab === "task1") {
    return DOMPurify.sanitize(passage.split(/Task 2/i)[0] || passage);
  } else {
    const parts = passage.split(/Task 2/i);
    return DOMPurify.sanitize(parts.length > 1 ? "<h3>Task 2" + parts[1] : passage);
  }
};

const Writing = ({ preloadedSet = null }) => {
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userData } = useUserProfile();
  const targetExam = userData?.targetExam || "IELTS";

  const { data: fetchedWritingSets = [], isLoading: queryLoading } = useQuery({
    queryKey: ["writing-sets"],
    queryFn: async () => {
      const response = await axiosSecure.get("/questions?type=writing");
      return response?.data?.questions || [];
    },
    enabled: !!user?.email && !preloadedSet,
    staleTime: 5 * 60 * 1000,
  });

  const writingSets = preloadedSet ? [preloadedSet] : fetchedWritingSets;
  const loading = preloadedSet ? false : queryLoading;

  const [selectedSetId, setSelectedSetId] = useState(preloadedSet ? preloadedSet._id : "");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const categories = useMemo(() => {
    const map = new Map();
    writingSets.forEach(set => {
      const cat = getSetCategory(set);
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [writingSets]);

  const filteredWritingSets = useMemo(() => {
    if (selectedCategory === "ALL") return writingSets;
    return writingSets.filter(set => getSetCategory(set) === selectedCategory);
  }, [writingSets, selectedCategory]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fullscreen & Gating States
  const [isStarted, setIsStarted] = useState(false);
  const { isFullscreen, showWarning, setShowWarning, enterFullscreen, exitFullscreen } = useTestIntegrity(isStarted, submitted);
  
  // Student input
  const [activeTab, setActiveTab] = useState("task1"); // "task1" or "task2"
  const [task1Text, setTask1Text] = useState("");
  const [task2Text, setTask2Text] = useState("");
  const [task1Submitted, setTask1Submitted] = useState(false);

  const text = useMemo(() => {
    return `--- TASK 1 (150 Words Requirement) ---\n${task1Text}\n\n--- TASK 2 (250 Words Requirement) ---\n${task2Text}`;
  }, [task1Text, task2Text]);

  const resetText = () => {
    setTask1Text("");
    setTask2Text("");
    setTask1Submitted(false);
    setActiveTab("task1");
  };

  const handleTextChange = (val) => {
    if (activeTab === "task1") {
      setTask1Text(val);
    } else {
      setTask2Text(val);
    }
  };

  const activeSet = useMemo(
    () => preloadedSet || writingSets.find((set) => set._id === selectedSetId) || null,
    [preloadedSet, writingSets, selectedSetId],
  );

  const isPte = useMemo(() => activeSet?.examType === "PTE" || targetExam === "PTE", [activeSet, targetExam]);
  const isSinglePteTask = useMemo(() => isPte && activeSet?.questions?.length === 1, [isPte, activeSet]);
  const singlePteType = useMemo(() => isSinglePteTask ? activeSet?.questions?.[0]?.type : null, [isSinglePteTask, activeSet]);

  const targetDurationSeconds = useMemo(() => {
    if (activeSet?.timeLimit && Number(activeSet.timeLimit) > 0) {
      return Number(activeSet.timeLimit) * 60;
    }
    if (isSinglePteTask) {
      return singlePteType === "pte-summarize-written-text" ? 10 * 60 : 20 * 60;
    }
    if (isPte || activeSet?.examType === "PTE") {
      return 20 * 60; // 20 minutes default for PTE standalone tests
    }
    return 60 * 60; // 60 minutes default for IELTS Writing
  }, [activeSet, isPte, isSinglePteTask, singlePteType]);

  const [timerActive, setTimerActive] = useState(false);
  const { timeLeft, fmtTime: fmt, resetCountdown } = useCountdown(targetDurationSeconds, timerActive, submitted);

  useEffect(() => {
    if (activeSet) {
      resetCountdown(targetDurationSeconds);
    }
  }, [activeSet, targetDurationSeconds, resetCountdown]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const wordCount1 = useMemo(() => task1Text.trim() ? task1Text.trim().split(/\s+/).filter(w => w.length > 0).length : 0, [task1Text]);
  const wordCount2 = useMemo(() => task2Text.trim() ? task2Text.trim().split(/\s+/).filter(w => w.length > 0).length : 0, [task2Text]);
  const currentWordCount = activeTab === "task1" ? wordCount1 : wordCount2;

  const currentTargetWordsLabel = useMemo(() => {
    if (isSinglePteTask) {
      return singlePteType === "pte-summarize-written-text" ? "5-75" : "200-300";
    }
    if (isPte) {
      return activeTab === "task1" ? "5-75" : "200-300";
    }
    return activeTab === "task1" ? "150" : "250";
  }, [isSinglePteTask, singlePteType, isPte, activeTab]);

  const isWordCountValid = useMemo(() => {
    if (isSinglePteTask) {
      return singlePteType === "pte-summarize-written-text"
        ? (wordCount1 >= 5 && wordCount1 <= 75)
        : (wordCount1 >= 200 && wordCount1 <= 300);
    }
    if (isPte) {
      return activeTab === "task1"
        ? (wordCount1 >= 5 && wordCount1 <= 75)
        : (wordCount2 >= 200 && wordCount2 <= 300);
    }
    return activeTab === "task1" ? wordCount1 >= 150 : wordCount2 >= 250;
  }, [isSinglePteTask, singlePteType, isPte, activeTab, wordCount1, wordCount2]);

  // Writing data fetched via useQuery above



  const handleFirstTaskSubmit = async () => {
    const minWords = isPte ? 5 : 30;
    if (wordCount1 < minWords) {
      toast.warning(`Your response is too short (minimum ${minWords} words recommended).`);
      return;
    }
    
    const titleText = isPte ? "Submit Summarize Written Text?" : "Submit Task 1?";
    const textMsg = isPte 
      ? "You are about to proceed to the Essay. Once submitted, you cannot edit your summary again."
      : "You are about to proceed to Task 2. Once submitted, you cannot edit Task 1 again.";

    const result = await Swal.fire({
      title: titleText,
      text: textMsg,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, proceed",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563EB",
      cancelButtonColor: "#64748B",
      customClass: {
        popup: "rounded-[2rem]"
      }
    });

    if (result.isConfirmed) {
      setTask1Submitted(true);
      setActiveTab("task2");
      toast.success(isPte ? "Summary locked! Now starting Essay." : "Task 1 locked! Now starting Task 2.");
    }
  };

  const handleSubmit = async () => {
    if (isSinglePteTask) {
      const minWords = singlePteType === "pte-summarize-written-text" ? 5 : 200;
      if (wordCount1 < minWords) {
        toast.warning(`Your response is too short (minimum ${minWords} words recommended).`);
        return;
      }
    } else {
      const minWords = isPte ? 200 : 50;
      if (wordCount2 < minWords) {
        toast.warning(`Your response is too short (minimum ${minWords} words recommended).`);
        return;
      }
    }

    try {
      if (!activeSet) {
        toast.error("Question set not loaded properly. Please refresh.");
        return;
      }
      setSubmitting(true);
      const submissionContent = isSinglePteTask
        ? `--- ${singlePteType === 'pte-summarize-written-text' ? 'SUMMARIZE WRITTEN TEXT' : 'PTE ESSAY'} ---\n${task1Text}`
        : text;
      const response = await axiosSecure.post("/submissions/submit", {
        questionSetId: activeSet._id,
        testType: "writing",
        title: activeSet.title,
        content: submissionContent,
        userName: user?.displayName || "Student",
        userEmail: user?.email
      });

      if (response.data.success) {
        setSubmitted(true);
        setTimerActive(false);
        toast.success("Response submitted for instructor evaluation!");
        queryClient.invalidateQueries({ queryKey: ["user-lab-results"] });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExitTest = async () => {
    if (submitted) {
      exitFullscreen();
      setIsStarted(false);
      if (preloadedSet) {
        navigate(-1);
      } else {
        setSelectedSetId("");
      }
      resetText();
      setSubmitted(false);
      setTimerActive(false);
      return;
    }

    const hasAnswers = task1Text.trim() !== "" || task2Text.trim() !== "";
    const result = hasAnswers
      ? await alerts.confirmExitPractice("Writing Essay Composition")
      : await alerts.confirmCancelPractice("Writing Essay Composition");

    if (result.isConfirmed) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsStarted(false);

      const minExitWords = isSinglePteTask ? (singlePteType === 'pte-summarize-written-text' ? 5 : 50) : 50;
      const totalWords = isSinglePteTask ? wordCount1 : wordCount;
      if (hasAnswers && totalWords >= minExitWords) {
        try {
          toast.info("Auto-submitting your essay response...");
          const submissionContent = isSinglePteTask
            ? `--- ${singlePteType === 'pte-summarize-written-text' ? 'SUMMARIZE WRITTEN TEXT' : 'PTE ESSAY'} ---\n${task1Text}`
            : text;
          await axiosSecure.post("/submissions/submit", {
            questionSetId: activeSet._id,
            testType: "writing",
            title: activeSet.title,
            content: submissionContent,
            userName: user?.displayName || "Student",
            userEmail: user?.email
          });
          toast.success("Practice test auto-submitted successfully!");
          queryClient.invalidateQueries({ queryKey: ["user-lab-results"] });
      } catch {
          console.error("Auto submit failed:");
          toast.error("Auto-submit failed");
        }
      } else {
        toast.info(hasAnswers ? "Response too short to submit. Exiting practice." : "No response entered. Exiting practice.");
      }

      setSelectedSetId("");
      resetText();
      setSubmitted(false);
      setTimerActive(false);
    } else if (result.isDenied) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsStarted(false);

      Object.keys(localStorage).forEach((key) => {
        if (key.includes("test_cache") || key.includes("test_scratchpad") || key.includes("writing")) {
          localStorage.removeItem(key);
        }
      });

      toast.info("Practice cancelled. Essay discarded.");
      setSelectedSetId("");
      resetText();
      setSubmitted(false);
      setTimerActive(false);
    }
  };

  const handleReturnToDashboard = () => {
    exitFullscreen();
    setIsStarted(false);
    navigate("/dashboard");
  };

  const handleRetake = () => {
    setSubmitted(false);
    setSubmitting(false);
    resetText();
    setTimerActive(true);
    resetCountdown(targetDurationSeconds);
    setIsStarted(true);
    enterFullscreen();
  };


  if (loading) return <Loader />;

  const userPlan = userData?.plan || "free";
  const userRole = userData?.role || "student";

  if (userRole !== "admin" && userRole !== "instructor" && userPlan === "free") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-base-300 rounded-[2.5rem] p-8 md:p-12 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-rose-100 rounded-3xl flex items-center justify-center mx-auto text-rose-500 text-4xl font-bold">
            🚫
          </div>
          <h1 className="text-3xl font-bold text-slate-800 leading-tight">403 - Access Denied</h1>
          <p className="text-sm text-base-content/60 leading-relaxed">
            The Writing practice section is exclusive to Standard and Premium plans. Please upgrade your plan to access this lab.
          </p>
          <button 
            onClick={() => navigate("/pricing")}
            className="btn btn-primary w-full rounded-2xl font-black text-sm uppercase tracking-wider animate-bounce"
          >
            Upgrade Plan
          </button>
          <button 
            onClick={() => navigate("/dashboard")}
            className="btn btn-ghost w-full rounded-2xl font-black text-sm uppercase tracking-wider"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!activeSet || (!preloadedSet && !selectedSetId)) {
    return (
        <div className="max-w-7xl mx-auto px-6 pt-2 pb-20">
            <div className="text-center space-y-4 mb-16">
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest border ${
                    writingSets.length > 0
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-amber-50 text-amber-600 border-amber-200"
                }`}>
                    <PiPencilLineFill /> {writingSets.length} Modules Available
                </div>
                <h2 className="text-5xl font-black tracking-tighter text-slate-800">Select a <span className="text-primary italic">Writing Test</span></h2>
                <p className="text-slate-400 font-medium text-lg">Choose a standardized prompt to master your academic composition.</p>
            </div>

            {writingSets.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-xl mx-auto"
                >
                    <div className="card bg-white border-2 border-dashed border-base-300 p-16 rounded-[3rem] text-center space-y-6">
                        <div className="w-20 h-20 rounded-[2rem] bg-amber-50 border border-amber-100 flex items-center justify-center text-4xl mx-auto">
                            ✍️
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black tracking-tight text-slate-800">
                                No Writing Prompts Yet
                            </h3>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                No writing content is available for your current exam track{" "}
                                <span className="font-black text-primary">({targetExam})</span>.
                                This could be because:
                            </p>
                        </div>
                        <ul className="text-left space-y-3 text-sm text-slate-500 font-medium">
                            <li className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">1</span>
                                The admin hasn't uploaded any writing prompts for <strong>{targetExam}</strong> yet.
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">2</span>
                                Your exam preference might not match the available content — try switching to <strong>IELTS</strong> or <strong>BOTH</strong>.
                            </li>
                        </ul>
                        <a
                            href="/dashboard/profile"
                            className="btn btn-primary btn-block rounded-2xl h-14 font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20"
                        >
                            Change Exam Preference →
                        </a>
                    </div>
                </motion.div>
            ) : (
                <div className="space-y-8">
                    {/* Category Filter Dropdown */}
                    {categories.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <CategoryDropdown
                                categories={categories}
                                selectedCategory={selectedCategory}
                                onSelectCategory={setSelectedCategory}
                                totalCount={writingSets.length}
                            />
                            <div className="text-xs font-bold text-slate-400">
                                {selectedCategory === "ALL"
                                    ? `Showing all ${writingSets.length} modules`
                                    : `Showing ${filteredWritingSets.length} of ${writingSets.length} modules`}
                            </div>
                        </div>
                    )}

                    {filteredWritingSets.length === 0 ? (
                        <div className="p-12 text-center bg-white border border-slate-200 rounded-[2.5rem]">
                            <p className="text-slate-500 font-bold text-sm">No modules found for category "{selectedCategory}".</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredWritingSets.map((set, idx) => {
                                const categoryName = getSetCategory(set);
                                return (
                                    <motion.div 
                                        key={set._id}
                                        whileHover={{ y: -10 }}
                                        className="card bg-white p-8 rounded-[3rem] border border-base-300 shadow-sm hover:shadow-2xl hover:border-primary/30 cursor-pointer group transition-all"
                                        onClick={() => setSelectedSetId(set._id)}
                                    >
                                        <div className="flex flex-col h-full space-y-6">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl group-hover:bg-primary group-hover:text-white transition-all flex-shrink-0">
                                                    <PiPencilLineFill />
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5 flex-1 min-w-0">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-base-content/20">Unit {idx + 1}</span>
                                                    {categoryName && (
                                                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border truncate max-w-full ${getCategoryBadgeStyle(categoryName)}`}>
                                                            {categoryName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-black group-hover:text-primary transition-colors">{set.title}</h3>
                                            <div className="flex items-center gap-3 flex-wrap text-[10px] font-black uppercase tracking-widest text-base-content/40">
                                                <span className="flex items-center gap-1.5">
                                                    <PiClockFill /> {set.timeLimit ? `${set.timeLimit}m` : (set.examType === 'PTE' ? '20m' : '60m')}
                                                </span>
                                                <span className="flex items-center gap-1.5"><PiTextAaFill /> {set.questions?.length === 1 ? '1 Task' : '2 Tasks'}</span>
                                                {set.examType && (
                                                    <span className={`badge badge-sm font-black ${
                                                        set.examType === 'IELTS' ? 'badge-primary' :
                                                        set.examType === 'PTE' ? 'badge-success' : 'badge-warning'
                                                    }`}>{set.examType}</span>
                                                )}
                                            </div>
                                            <button className="btn btn-block rounded-2xl h-14 bg-slate-900 text-white border-none group-hover:bg-primary transition-all font-black uppercase tracking-widest text-xs">
                                                Start Composition
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
  }

  return (
    <TestShell
      isStarted={isStarted}
      onStart={() => { setIsStarted(true); setTimerActive(true); enterFullscreen(); }}
      onCancel={() => preloadedSet ? navigate(-1) : setSelectedSetId("")}
      title="Ready to Start?"
      description="This practice test will open in fullscreen mode. Ensure you are in a quiet environment."
      icon={PiPencilLineFill}
      isFullscreen={isFullscreen}
      showWarning={showWarning}
      onWarningResume={() => { setShowWarning(false); enterFullscreen(); }}
      onWarningExit={handleExitTest}
    >

      {/* Sticky Premium Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <button onClick={handleExitTest} className="btn btn-ghost btn-circle text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                    <PiArrowLeftBold className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-800">{activeSet?.title}</h1>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Writing Practice</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Remaining Time</div>
                    <div className={`text-xl font-mono font-black leading-none mt-1 ${timeLeft < 300 ? 'text-red-500' : 'text-slate-800'}`}>
                        {fmt(timeLeft)}
                    </div>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                {submitted ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-success font-black text-xs uppercase tracking-widest">
                      <PiCheckCircleFill className="text-xl" /> Session Finalized
                    </div>
                    <button
                      onClick={handleExitTest}
                      className="btn btn-error text-white btn-sm rounded-2xl px-4 h-10 font-black text-[10px] uppercase tracking-widest border-none shadow-md shadow-error/20"
                    >
                      End Test
                    </button>
                    <button
                      onClick={handleRetake}
                      className="btn btn-primary btn-sm rounded-2xl px-4 h-10 font-black text-[10px] uppercase tracking-widest"
                    >
                      Retake Test
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {isSinglePteTask ? (
                      <button 
                          onClick={handleSubmit} 
                          disabled={submitting}
                          className="btn btn-primary rounded-2xl px-6 h-12 font-black shadow-xl shadow-primary/20 border-none"
                      >
                          {submitting ? <span className="loading loading-spinner" /> : (singlePteType === "pte-summarize-written-text" ? "Submit Summary" : "Submit Essay")}
                      </button>
                    ) : activeTab === "task1" ? (
                      <button 
                          onClick={handleFirstTaskSubmit} 
                          className="btn btn-primary rounded-2xl px-6 h-12 font-black shadow-xl shadow-primary/20 border-none"
                      >
                          {isPte ? "Submit SWT & Continue" : "Submit Task 1 & Continue"}
                      </button>
                    ) : (
                      <button 
                          onClick={handleSubmit} 
                          disabled={submitting}
                          className="btn btn-primary rounded-2xl px-6 h-12 font-black shadow-xl shadow-primary/20 border-none"
                      >
                          {submitting ? <span className="loading loading-spinner" /> : "Submit Results"}
                      </button>
                    )}
                    <button
                        onClick={handleExitTest}
                        className="btn btn-error text-white rounded-2xl px-6 h-12 font-black border-none shadow-xl shadow-error/20"
                    >
                        End Test
                    </button>
                  </div>
                )}
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Prompt Side */}
            <div className="space-y-6">
                <div className="card bg-white p-10 rounded-[3rem] border border-base-300 shadow-sm h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar">
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <span className="badge badge-neutral p-4 rounded-xl font-black text-[10px] uppercase tracking-widest">Official Prompt</span>
                            <PiClockFill className="text-xl text-base-content/20" />
                        </div>
                        
                        <div className="prose prose-slate max-w-none">
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight mb-4">
                                {activeSet?.title}
                            </h2>
                            <div 
                                className="prose prose-slate max-w-none"
                                dangerouslySetInnerHTML={{ __html: getTaskContent(activeSet, activeTab, isPte) }}
                            />
                        </div>

                        {activeTab === "task1" && activeSet.images?.filter(img => img && img.trim() !== "").length > 0 && (
                            <div className="grid gap-4 pt-6">
                                {activeSet.images.filter(img => img && img.trim() !== "").map((img, i) => (
                                    <div key={i} className="rounded-3xl overflow-hidden border border-base-200 bg-base-50 p-4">
                                        <img src={img} alt="Prompt Diagram" className="w-full h-auto" />
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Instructor's Guide</h4>
                            <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                                "{activeSet?.instructions || "Spend approximately 20-40 minutes on this task. Ensure your response is well-structured and uses varied vocabulary."}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Editor Side */}
            <div className="space-y-6">
                <div className="card bg-white rounded-[3rem] border border-base-300 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-180px)]">
                    {/* Editor Toolbar */}
                    <div className="px-10 py-6 border-b border-slate-200 bg-base-50/50 flex items-center justify-between">
                        {isSinglePteTask ? (
                            <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-800 shadow-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                {singlePteType === "pte-summarize-written-text" ? "Summarize Written Text" : "Write Essay"}
                            </div>
                        ) : (
                            <div className="flex bg-slate-200/60 p-1 rounded-2xl gap-1.5 shadow-inner">
                                <button 
                                    onClick={() => {
                                        if (task1Submitted) {
                                            toast.warning(isPte ? "Summarize Written Text has been submitted and locked." : "Task 1 has been submitted and locked.");
                                            return;
                                        }
                                        setActiveTab("task1");
                                    }}
                                    className={`py-2 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeTab === "task1" 
                                        ? "bg-white text-slate-800 shadow-sm" 
                                        : "text-slate-400 hover:text-slate-600"
                                    } ${task1Submitted ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    {isPte ? "Summarize Written Text" : "Task 1"}
                                </button>
                                <button 
                                    onClick={() => {
                                        if (!task1Submitted) {
                                            toast.info(isPte ? "Please submit Summarize Written Text before proceeding to Write Essay." : "Please submit Task 1 before proceeding to Task 2.");
                                            return;
                                        }
                                        setActiveTab("task2");
                                    }}
                                    className={`py-2 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeTab === "task2" 
                                        ? "bg-white text-slate-800 shadow-sm" 
                                        : "text-slate-400 hover:text-slate-600"
                                    } ${!task1Submitted ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    {isPte ? "Write Essay" : "Task 2"}
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-4">
                            <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                                isWordCountValid 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                : "bg-orange-50 text-orange-600 border-orange-100"
                            }`}>
                                Words: {isSinglePteTask ? wordCount1 : currentWordCount} / {currentTargetWordsLabel} Target
                            </div>
                        </div>
                    </div>

                    {/* TextArea */}
                    <div className="flex-1 p-10 flex flex-col">
                        {submitted ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-full text-center space-y-6"
                            >
                                <div className="w-20 h-20 rounded-full bg-success/10 text-success flex items-center justify-center text-4xl shadow-xl">
                                    <PiCheckCircleFill />
                                </div>
                                <div className="max-w-sm">
                                    <h3 className="text-2xl font-black tracking-tight">Submission Successful</h3>
                                    <p className="text-slate-500 font-bold mt-2 leading-relaxed">
                                        Your response has been added to the instructor's queue. You will be notified once the grading is complete.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                    <button 
                                        onClick={handleExitTest} 
                                        className="btn btn-error text-white rounded-2xl px-8 font-black border-none shadow-lg shadow-error/20"
                                    >
                                        End Test
                                    </button>
                                    <button 
                                        onClick={handleReturnToDashboard} 
                                        className="btn btn-primary rounded-2xl px-8 font-black shadow-lg shadow-primary/20"
                                    >
                                        Return to Dashboard
                                    </button>
                                    <button 
                                        onClick={handleRetake} 
                                        className="btn btn-outline border-slate-300 text-slate-700 hover:bg-slate-100 rounded-2xl px-6 font-black"
                                    >
                                        Retake Test
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <textarea 
                                className="w-full h-full resize-none border-none focus:ring-0 text-lg leading-relaxed text-slate-700 placeholder:text-slate-300 font-medium custom-scrollbar focus:outline-none"
                                placeholder={
                                    isSinglePteTask
                                    ? (singlePteType === "pte-summarize-written-text"
                                        ? "Write your Summarize Written Text response here (5-75 words, single sentence)..."
                                        : "Write your PTE Essay response here (200-300 words)...")
                                    : isPte
                                    ? (activeTab === "task1"
                                        ? "Write your Summarize Written Text response here (5-75 words, single sentence)..."
                                        : "Write your PTE Essay response here (200-300 words)...")
                                    : (activeTab === "task1" 
                                        ? "Write your Task 1 academic report here (minimum 150 words)..." 
                                        : "Write your Task 2 argumentative opinion essay here (minimum 250 words)...")
                                }
                                value={isSinglePteTask ? task1Text : (activeTab === "task1" ? task1Text : task2Text)}
                                onChange={(e) => isSinglePteTask ? setTask1Text(e.target.value) : handleTextChange(e.target.value)}
                                readOnly={!isSinglePteTask && activeTab === "task1" && task1Submitted}
                            />
                        )}
                    </div>

                    {/* Editor Footer */}
                    <div className="px-10 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Status: {timerActive ? 'Active Session' : 'Standby'}</span>
                        <div className="flex items-center gap-4">
                            {isSinglePteTask ? (
                                <span>{singlePteType === 'pte-summarize-written-text' ? "Summary" : "Essay"}: {wordCount1}w</span>
                            ) : (
                                <>
                                    <span>{isPte ? "Summary" : "Task 1"}: {wordCount1}w</span>
                                    <span>{isPte ? "Essay" : "Task 2"}: {wordCount2}w</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </TestShell>
  );
};

export default Writing;
