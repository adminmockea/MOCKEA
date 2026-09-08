import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from "react";
import useAnswers from "../../../../hooks/useAnswers";
import useCountdown from "../../../../hooks/useCountdown";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { DEFAULT_MOCK_TEST_DURATION_MINUTES } from "../../../../constants";
import alerts from "../../../../utils/alerts";
import { 
    PiWarning,
    PiClock,
    PiCaretRightBold
} from "react-icons/pi";
import TestShell from "../../../Common/TestShell";
import useAxiosSecure from "../../../../hooks/useAxiosSecure";
import Loader from "../../../Loader/Loader";

const ReadingSection = lazy(() => import("./ReadingSection"));
const ListeningSection = lazy(() => import("./ListeningSection"));
const WritingSection = lazy(() => import("./WritingSection"));
const SpeakingSection = lazy(() => import("./SpeakingSection"));

const SectionLoadingSkeleton = () => (
    <div className="flex-1 h-full w-full flex overflow-hidden p-6 gap-6 bg-slate-50 animate-pulse">
        <div className="w-1/2 h-full bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
            <div className="h-8 bg-slate-200 rounded-lg w-1/3"></div>
            <div className="space-y-3">
                <div className="h-4 bg-slate-100 rounded w-full"></div>
                <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                <div className="h-4 bg-slate-100 rounded w-4/6"></div>
            </div>
        </div>
        <div className="w-1/2 h-full bg-white rounded-3xl border border-slate-200 p-8 space-y-6">
            <div className="h-6 bg-slate-200 rounded-lg w-1/4"></div>
            <div className="h-24 bg-slate-100 rounded-2xl"></div>
            <div className="h-24 bg-slate-100 rounded-2xl"></div>
        </div>
    </div>
);

const TestEnvironment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const axiosSecure = useAxiosSecure();

    // 1. Fetch Test Data
    // staleTime: Infinity + refetchOnWindowFocus: false prevents React Query from
    // performing background refetches when the user focuses the window/an input.
    // A refetch would create new object references for `test`, which propagates down
    // to ReadingSection's `data` prop, causing passageElement to recompute,
    // which replaces dangerouslySetInnerHTML content and destroys inline input focus.
    const { data: test, isLoading, error, isError } = useQuery({
        queryKey: ["test-session", id],
        queryFn: async () => {
            const res = await axiosSecure.get(`/mock-tests/${id}`);
            return res.data.test;
        },
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
    });

    useEffect(() => {
        if (isError) {
            toast.error(error?.response?.data?.message || "Failed to load test session. You might not have the correct plan or authorization.");
            navigate("/dashboard/full-mock-test");
        }
    }, [isError, error, navigate]);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isStarted, setIsStarted] = useState(() => !!localStorage.getItem(`test_cache_${id}`));
    const [isTerminating] = useState(() => {
        return !!localStorage.getItem(`test_cache_${id}`);
    });
    
    // Lazy initializers for crash recovery
    const [answers, setAnswers] = useState(() => {
        try {
            const cached = localStorage.getItem(`test_cache_${id}`);
            if (cached) {
                const parsed = JSON.parse(cached).answers;
                if (parsed && !parsed.listening && !parsed.reading && !parsed.writing && !parsed.speaking) {
                    return {
                        listening: parsed,
                        reading: parsed,
                        writing: parsed,
                        speaking: parsed
                    };
                }
                return parsed || { listening: {}, reading: {}, writing: {}, speaking: {} };
            }
            return { listening: {}, reading: {}, writing: {}, speaking: {} };
        } catch { return { listening: {}, reading: {}, writing: {}, speaking: {} }; }
    });

    const [currentModuleIdx, setCurrentModuleIdx] = useState(() => {
        try {
            const cached = localStorage.getItem(`test_cache_${id}`);
            return cached ? JSON.parse(cached).currentModuleIdx : 0;
        } catch { return 0; }
    });

    const [listeningPartIdx, setListeningPartIdx] = useState(0);
    const [readingSectionIdx, setReadingSectionIdx] = useState(0);

    useEffect(() => {
        setListeningPartIdx(0);
        setReadingSectionIdx(0);
    }, [currentModuleIdx]);

    const handleAnswerChange = useCallback((qId, val) => {
        const sectionType = ['listening', 'reading', 'writing', 'speaking'][currentModuleIdx];
        setAnswers((prev) => ({
            ...prev,
            [sectionType]: {
                ...(prev[sectionType] || {}),
                [qId]: val
            }
        }));
    }, [currentModuleIdx]);
    const { timeLeft, setTimeLeft, fmtTime: formatTime } = useCountdown(
        () => {
            try {
                const cached = localStorage.getItem(`test_cache_${id}`);
                return cached ? JSON.parse(cached).timeLeft : 0;
            } catch { return 0; }
        },
        isStarted && isFullscreen && !isTerminating,
        false
    );

    const unifiedQuestions = useMemo(() => {
        if (!test) return [];
        const list = [];
        if (currentModuleIdx === 0) {
            const listeningSections = test.sections?.listening || [];
            listeningSections.forEach((sec, secIdx) => {
                const secOffset = ((sec?.listeningPart || (secIdx + 1)) - 1) * 10;
                const qs = sec.questions || [];
                qs.forEach((q, qIdx) => {
                    list.push({
                        q,
                        secIdx,
                        localIdx: qIdx,
                        displayNum: secOffset + qIdx + 1
                    });
                });
            });
        } else if (currentModuleIdx === 1) {
            const readingSections = test.sections?.reading || [];
            let currentOffset = 0;
            readingSections.forEach((sec, secIdx) => {
                const qs = sec.questions || [];
                qs.forEach((q, qIdx) => {
                    list.push({
                        q,
                        secIdx,
                        localIdx: qIdx,
                        displayNum: currentOffset + qIdx + 1
                    });
                });
                currentOffset += qs.length;
            });
        }
        return list;
    }, [test, currentModuleIdx]);

    const handlePaletteClick = useCallback((item) => {
        if (currentModuleIdx === 0) {
            if (item.secIdx !== listeningPartIdx) {
                setListeningPartIdx(item.secIdx);
            }
            setTimeout(() => {
                const element = document.getElementById(`question-${item.localIdx}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        } else if (currentModuleIdx === 1) {
            if (item.secIdx !== readingSectionIdx) {
                setReadingSectionIdx(item.secIdx);
            }
            setTimeout(() => {
                const element = document.getElementById(`question-${item.localIdx}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [currentModuleIdx, listeningPartIdx, readingSectionIdx]);

    const [tabSwitches, setTabSwitches] = useState(() => {
        try {
            const cached = localStorage.getItem(`test_cache_${id}`);
            return cached ? JSON.parse(cached).tabSwitches || 0 : 0;
        } catch { return 0; }
    });
    const [resultId, setResultId] = useState(() => {
        try {
            const cached = localStorage.getItem(`test_cache_${id}`);
            return cached ? JSON.parse(cached).resultId : null;
        } catch { return null; }
    });
    const [showWarning, setShowWarning] = useState(false);
    const [warningType, setWarningType] = useState(""); // "fullscreen" or "tab"

    // Scratchpad States & Drag-Handlers
    const [showScratchpad, setShowScratchpad] = useState(false);
    const [scratchpadText, setScratchpadText] = useState(() => localStorage.getItem(`test_scratchpad_${id}`) || "");
    const [scratchpadPos, setScratchpadPos] = useState({ x: 100, y: 120 });
    const dragStartRef = useRef(null);
    const terminationFiredRef = useRef(false);

    const handleDragStart = (e) => {
        dragStartRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startPosX: scratchpadPos.x,
            startPosY: scratchpadPos.y
        };
        document.addEventListener("mousemove", handleDragging);
        document.addEventListener("mouseup", handleDragEnd);
    };

    const handleDragging = (e) => {
        if (!dragStartRef.current) return;
        const dx = e.clientX - dragStartRef.current.startX;
        const dy = e.clientY - dragStartRef.current.startY;
        setScratchpadPos({
            x: dragStartRef.current.startPosX + dx,
            y: dragStartRef.current.startPosY + dy
        });
    };

    const handleDragEnd = () => {
        dragStartRef.current = null;
        document.removeEventListener("mousemove", handleDragging);
        document.removeEventListener("mouseup", handleDragEnd);
    };

    // --- Helper Functions (Defined before Effects to avoid TDZ errors) ---

    const enterFullscreen = () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => toast.error("Could not enter fullscreen"));
        }
    };

    const handleSaveProgress = async () => {
        if (!test || !resultId) return;
        const sectionType = ['listening', 'reading', 'writing', 'speaking'][currentModuleIdx];
        const sectionAnswers = answers[sectionType] || {};
        try {
            await axiosSecure.post("/mock-tests/submit-section", {
                resultId,
                sectionType,
                answers: sectionAnswers,
                timeTaken: (test.totalDuration * 60) - timeLeft
            });
        } catch (err) {
            console.error("Failed to sync progress:", err);
            toast.warning("Network issue: Progress saved locally but not synced to server.");
        }
    };

    const handleFinalSubmit = async (isTerminated = false) => {
        const toastId = toast.loading(isTerminated ? "Saving and terminating session..." : "Submitting and grading exam... Please wait.");
        try {
            await axiosSecure.post("/mock-tests/finalize", { resultId, isTerminated });
            localStorage.removeItem(`test_cache_${id}`);
            if (isTerminated) {
                toast.update(toastId, { render: "Test session terminated.", type: "error", isLoading: false, autoClose: 3000 });
            } else {
                toast.update(toastId, { render: "Test submitted successfully!", type: "success", isLoading: false, autoClose: 3000 });
            }
            if (document.fullscreenElement) document.exitFullscreen();
            navigate("/dashboard/full-mock-test");
        } catch (err) {
            console.error(err);
            toast.update(toastId, { render: "Submission failed", type: "error", isLoading: false, autoClose: 3000 });
        }
    };

    const handleNextModule = async () => {
        if (answeredQuestions < totalQuestions) {
            if (currentModuleIdx === 2) {
                toast.error("Please answer both Writing Task 1 and Writing Task 2 before continuing.");
            } else if (currentModuleIdx === 3) {
                toast.error("Please complete all 3 parts of the Speaking section before finishing the test.");
            } else {
                const remaining = totalQuestions - answeredQuestions;
                toast.error(`Please answer all ${totalQuestions} questions before continuing (${remaining} remaining).`);
            }
            return;
        }
        if (currentModuleIdx < 3) {
            // Save progress in the background to avoid blocking section transition navigation
            handleSaveProgress().catch(err => console.error("Error saving progress:", err));
            setCurrentModuleIdx(prev => prev + 1);
            toast.success(`All questions finished! Moving to the ${['Listening', 'Reading', 'Writing', 'Speaking'][currentModuleIdx + 1]} section.`);
        } else {
            await handleSaveProgress();
            handleFinalSubmit();
        }
    };

    const handleExitTest = async () => {
        const hasAnswers = Object.values(answers).some(secAnswers => {
            if (!secAnswers || typeof secAnswers !== 'object') return false;
            return Object.values(secAnswers).some(val => {
                if (typeof val === 'string') {
                    return val.trim() !== "";
                }
                return val !== undefined && val !== null;
            });
        });

        const result = hasAnswers
            ? await alerts.confirmExitMockTest()
            : await alerts.confirmCancelMockTest();

        if (result.isConfirmed) {
            // Cancel and Exit: Trigger API call in the background without awaiting to navigate instantly
            axiosSecure.post("/mock-tests/finalize", { resultId, isTerminated: true }).catch(err => {
                console.error("Failed to terminate test session:", err);
            });
            localStorage.removeItem(`test_cache_${id}`);
            if (document.fullscreenElement) document.exitFullscreen();
            navigate("/dashboard/full-mock-test");
        }
    };

    const handleTerminateTestClick = async () => {
        const result = await alerts.confirmTerminateMockTest();
        if (result.isConfirmed) {
            const toastId = toast.loading("Saving progress and finalising test... Please wait.");
            try {
                await handleSaveProgress();
                toast.dismiss(toastId);
            } catch (err) {
                console.error("Failed to save progress on terminate:", err);
                toast.update(toastId, { render: "Failed to save progress. Submitting anyways...", type: "warning", isLoading: false, autoClose: 2000 });
            }
            await handleFinalSubmit(true);
        } else if (result.isDenied) {
            // Cancel & Exit: Trigger API call in the background to navigate instantly without delay
            axiosSecure.post("/mock-tests/finalize", { resultId, isTerminated: true }).catch(err => {
                console.error("Failed to terminate test session:", err);
            });
            localStorage.removeItem(`test_cache_${id}`);
            if (document.fullscreenElement) document.exitFullscreen();
            navigate("/dashboard/full-mock-test");
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

    // --- Effects ---

    // 0. Clear previous test caches on fresh test session startup OR terminate reload
    useEffect(() => {
        const cachedData = localStorage.getItem(`test_cache_${id}`);
        if (cachedData) {
            if (isTerminating) {
                if (terminationFiredRef.current) return;
                terminationFiredRef.current = true;
                try {
                    const parsed = JSON.parse(cachedData);
                    const resId = parsed.resultId;
                    
                    toast.error("Test terminated: Page reload is not allowed during the exam.");
                    
                    const performTermination = async () => {
                        if (resId) {
                            try {
                                await axiosSecure.post("/mock-tests/finalize", { resultId: resId, isTerminated: true });
                            } catch (err) {
                                console.error("Failed to finalize test on reload:", err);
                            }
                        }
                        
                        // Clear all caches
                        localStorage.removeItem(`test_cache_${id}`);
                        localStorage.removeItem(`test_scratchpad_${id}`);
                        Object.keys(localStorage).forEach(key => {
                            if (key.startsWith('speaking_cache_')) {
                                localStorage.removeItem(key);
                            }
                        });
                        
                        navigate("/dashboard/full-mock-test");
                    };
                    
                    performTermination();
                } catch (e) {
                    console.error("Error handling reload termination:", e);
                    localStorage.removeItem(`test_cache_${id}`);
                    navigate("/dashboard/full-mock-test");
                }
            }
        } else {
            // New test session startup
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('speaking_cache_') || key.startsWith('test_scratchpad_')) {
                    localStorage.removeItem(key);
                }
            });
        }
    }, [id, isTerminating, axiosSecure, navigate]);



    // 1.5 Pre-initialize timer once test details are loaded (to prevent 0:00 flicker on start)
    useEffect(() => {
        if (test && !localStorage.getItem(`test_cache_${id}`)) {
            setTimeLeft((test.totalDuration || DEFAULT_MOCK_TEST_DURATION_MINUTES) * 60);
        }
    }, [test, id, setTimeLeft]);

    // 2. Initialize Test Session
    useEffect(() => {
        if (isTerminating) return;
        if (test && !resultId && isStarted) {
            axiosSecure.post("/mock-tests/start", { testId: id })
                .then(res => {
                    setResultId(res.data.resultId);
                    setTimeLeft(prev => prev === 0 ? (test.totalDuration || DEFAULT_MOCK_TEST_DURATION_MINUTES) * 60 : prev);
                })
                .catch(err => {
                    console.error(err);
                    const errMsg = err.response?.data?.message || "Failed to initialize test session";
                    toast.error(errMsg);
                    if (document.fullscreenElement) {
                        document.exitFullscreen().catch(() => {});
                    }
                    navigate("/dashboard/full-mock-test");
                });
        }
    }, [test, id, isStarted, axiosSecure, resultId, isTerminating, navigate]);



    // 4. Cache Logic
    useEffect(() => {
        if (isTerminating) return;
        if (resultId && isStarted) {
            localStorage.setItem(`test_cache_${id}`, JSON.stringify({
                answers,
                currentModuleIdx,
                timeLeft,
                tabSwitches,
                resultId,
                timestamp: Date.now()
            }));
        }
    }, [answers, currentModuleIdx, timeLeft, tabSwitches, id, resultId, isStarted, isTerminating]);

    // 4.1 Scratchpad Persistence Logic
    useEffect(() => {
        if (isTerminating) return;
        if (isStarted) {
            localStorage.setItem(`test_scratchpad_${id}`, scratchpadText);
        }
    }, [scratchpadText, id, isStarted, isTerminating]);

    // 4.5 Keyboard Interceptor (Anti-Cheat & DevTools protection)
    useEffect(() => {
        if (isTerminating) return;
        if (!isStarted) return;
        const handleKeyDown = (e) => {
            const isMeta = e.ctrlKey || e.metaKey;
            const key = e.key.toLowerCase();
            
            // Intercept Copy, Paste, Cut, Select All
            if (isMeta && ['c', 'v', 'x', 'a'].includes(key)) {
                e.preventDefault();
                toast.warning("Copy, paste, cut, and select-all actions are disabled to maintain exam integrity.");
                return;
            }
            
            // Intercept DevTools Access
            if (e.key === 'F12' || (isMeta && e.shiftKey && key === 'i')) {
                e.preventDefault();
                toast.warning("Developer Tools access is disabled during the exam.");
                return;
            }
        };
        
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isStarted, isTerminating]);

    // 5. Restore Session Effect
    useEffect(() => {
        if (isTerminating) return;
        if (localStorage.getItem(`test_cache_${id}`)) {
            toast.info("Your previous progress has been restored.");
            enterFullscreen();
        }
    }, [id, isTerminating]);

    // Scroll to Top on Start
    useEffect(() => {
        if (isStarted) {
            window.scrollTo({ top: 0, behavior: "instant" });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            const scrollContainers = document.querySelectorAll(".overflow-y-auto");
            scrollContainers.forEach(container => {
                container.scrollTop = 0;
            });
        }
    }, [isStarted]);

    // 6. Fullscreen Change Monitor
    useEffect(() => {
        if (isTerminating) return;
        const handleFSChange = () => {
            const isFS = !!document.fullscreenElement;
            setIsFullscreen(isFS);
            if (!isFS && isStarted) {
                setShowWarning(true);
                setWarningType("fullscreen");
            }
        };
        document.addEventListener("fullscreenchange", handleFSChange);
        return () => document.removeEventListener("fullscreenchange", handleFSChange);
    }, [isStarted, isTerminating]);

    // 7. Tab Switch Monitor (Anti-cheat)
    useEffect(() => {
        if (isTerminating) return;
        const handleVisibilityChange = async () => {
            if (document.hidden && isFullscreen && isStarted) {
                const newCount = tabSwitches + 1;
                setTabSwitches(newCount);
                setWarningType("tab");
                setShowWarning(true);
                
                // INSTANT LOCAL ENFORCEMENT
                if (newCount >= 3) {
                    toast.error("Test terminated due to excessive tab switching.");
                    await handleSaveProgress();
                    await axiosSecure.post("/mock-tests/finalize", { resultId, isTerminated: true });
                    localStorage.removeItem(`test_cache_${id}`);
                    if (document.fullscreenElement) document.exitFullscreen();
                    navigate("/dashboard/full-mock-test");
                    return;
                }

                // Sync to backend in the background
                try {
                    await axiosSecure.post("/mock-tests/update-cheat-stats", { 
                        resultId, 
                        tabSwitches: 1 
                    });
                } catch (err) {
                    console.error("Failed to update cheat stats:", err);
                }
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tabSwitches, isFullscreen, resultId, axiosSecure, navigate, isStarted, id, isTerminating]);



    const { total: totalQuestions, answered: answeredQuestions } = useMemo(() => {
        if (!test) return { total: 0, answered: 0 };
        if (currentModuleIdx === 0) {
            const listeningSections = test.sections?.listening || [];
            let total = 0;
            let answered = 0;
            const listeningAnswers = answers.listening || {};
            listeningSections.forEach(sec => {
                const qs = sec.questions || [];
                total += qs.length;
                answered += qs.filter(q => !!(listeningAnswers[`${sec._id}_${q.id}`])).length;
            });
            return { total, answered };
        }
        if (currentModuleIdx === 1) {
            const readingSections = test.sections?.reading || [];
            let total = 0;
            let answered = 0;
            const readingAnswers = answers.reading || {};
            readingSections.forEach(sec => {
                const qs = sec.questions || [];
                total += qs.length;
                answered += qs.filter(q => !!(readingAnswers[`${sec._id}_${q.id}`])).length;
            });
            return { total, answered };
        }
        if (currentModuleIdx === 2) {
            const writingData = test.sections?.writing?.[0];
            if (!writingData) return { total: 0, answered: 0 };
            
            const writingAnswers = answers.writing || {};
            const rawText = writingAnswers[writingData._id] || "";
            let hasT1;
            let hasT2;
            
            if (rawText.includes("--- TASK 2")) {
                const match = rawText.match(/--- TASK 1.*---\n([\s\S]*?)\n\n--- TASK 2.*---\n([\s\S]*)/);
                if (match) {
                    hasT1 = match[1]?.trim() !== "";
                    hasT2 = match[2]?.trim() !== "";
                } else {
                    const parts = rawText.split(/--- TASK 2.*---\n?/);
                    const t1 = parts[0].replace(/--- TASK 1.*---\n?/, "").trim();
                    const t2 = parts[1] ? parts[1].trim() : "";
                    hasT1 = t1 !== "";
                    hasT2 = t2 !== "";
                }
            } else {
                hasT1 = rawText.trim() !== "";
                hasT2 = false;
            }
            
            return {
                total: 2,
                answered: (hasT1 ? 1 : 0) + (hasT2 ? 1 : 0)
            };
        }
        if (currentModuleIdx === 3) {
            const speakingData = test.sections?.speaking?.[0];
            if (!speakingData) return { total: 0, answered: 0 };
            const speakingAnswers = answers.speaking || {};
            const p1 = speakingAnswers[speakingData._id + '_part1_completed'] === 'completed' ? 1 : 0;
            const p2 = speakingAnswers[speakingData._id + '_part2_completed'] === 'completed' ? 1 : 0;
            const p3 = speakingAnswers[speakingData._id + '_part3_completed'] === 'completed' ? 1 : 0;
            return {
                total: 3,
                answered: p1 + p2 + p3
            };
        }
        return { total: 0, answered: 0 };
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    }, [test, currentModuleIdx, answers]);

    // 8. Exit fullscreen on component unmount
    useEffect(() => {
        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
        };
    }, []);

    if (isTerminating) return <Loader />;

    if (isLoading) return <Loader/>

    return (
        <TestShell
            isStarted={isStarted}
            onStart={() => { setIsStarted(true); enterFullscreen(); }}
            onCancel={() => navigate(-1)}
            title="Ready to Start?"
            description="This test will open in fullscreen mode. Ensure you are in a quiet environment."
            isFullscreen={isFullscreen}
            showWarning={showWarning}
            onWarningResume={() => { setShowWarning(false); enterFullscreen(); }}
            onWarningExit={handleExitTest}
            warningType={warningType}
            tabSwitches={tabSwitches}
            maxSwitches={3}
            className="h-screen overflow-hidden bg-[#FDFDFB] flex flex-col relative select-none"
        >

            {tabSwitches > 0 && !showWarning && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1040] animate-bounce pointer-events-none">
                    <div className="alert alert-warning shadow-2xl rounded-2xl border-none py-2 px-6 flex items-center gap-3">
                        <PiWarning className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">
                            Warning: {tabSwitches}/3 Tab Switches. On 3rd tab switch, test will terminate.
                        </span>
                    </div>
                </div>
            )}

            {/* Test Header */}
            <header className="bg-white border-b border-base-300 h-20 px-8 flex items-center justify-between shadow-sm sticky top-0 z-40">
                <div className="flex items-center gap-8">
                    <div className="flex flex-col justify-center gap-0.5 cursor-pointer select-none" onClick={handleExitTest}>
                        <img
                            src="/mockea-logo.png"
                            alt="MOCKEA Logo"
                            className="h-9 w-auto object-contain self-start"
                        />
                        <span 
                            className="text-[10px] font-bold text-base-content/40 uppercase tracking-wider truncate max-w-[150px]"
                            onMouseEnter={(e) => handleShowTitleIfClipped(e, test?.title)}
                        >
                            {test?.title}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 flex items-center justify-center font-bold text-sm">
                        {currentModuleIdx + 1}
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-primary">
                        {['Listening', 'Reading', 'Writing', 'Speaking'][currentModuleIdx]} Section
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowScratchpad(prev => !prev)}
                        className={`btn rounded-2xl h-12 font-black text-xs uppercase tracking-widest px-5 ${
                            showScratchpad 
                            ? "btn-primary shadow-xl shadow-primary/20 border-none" 
                            : "btn-ghost border border-base-300 bg-white hover:bg-base-100"
                        }`}
                    >
                        📝 Scratchpad
                    </button>
                    <div className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl font-mono text-2xl shadow-md transition-all border ${
                        timeLeft < 300 
                            ? "bg-red-500 text-white border-red-600 animate-pulse" 
                            : "bg-red-50 text-red-500 border-red-500"
                    }`}>
                        <PiClock className={timeLeft < 300 ? "animate-spin" : ""} />
                        <span className="tracking-tighter font-black">{formatTime(timeLeft)}</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden relative">
                <Suspense fallback={<SectionLoadingSkeleton />}>
                {currentModuleIdx === 0 && test?.sections?.listening?.length > 0 && (
                    <ListeningSection 
                        sections={test.sections.listening} 
                        answers={answers.listening || {}} 
                        onAnswerChange={handleAnswerChange} 
                        activePartIdx={listeningPartIdx}
                        setActivePartIdx={setListeningPartIdx}
                    />
                )}
                {currentModuleIdx === 1 && test?.sections?.reading?.length > 0 && (
                    <ReadingSection 
                        sections={test.sections.reading} 
                        answers={answers.reading || {}} 
                        onAnswerChange={handleAnswerChange} 
                        activeSectionIdx={readingSectionIdx}
                        setActiveSectionIdx={setReadingSectionIdx}
                    />
                )}
                {currentModuleIdx === 2 && test?.sections?.writing?.[0] && (
                    <WritingSection 
                        data={test.sections.writing[0]} 
                        answers={answers.writing || {}} 
                        onAnswerChange={handleAnswerChange} 
                        examType={test.examType}
                    />
                )}
                {currentModuleIdx === 3 && test?.sections?.speaking?.[0] && (
                    <SpeakingSection 
                        data={test.sections.speaking[0]} 
                        answers={answers.speaking || {}}
                        onAnswerChange={handleAnswerChange}
                        examType={test.examType}
                    />
                )}
                </Suspense>
            </main>

            <footer className="bg-white border-t border-base-300 min-h-20 py-3 px-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
                <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-left">
                        <p className="text-[10px] font-black text-base-content/30 uppercase tracking-widest leading-none mb-1">Current Section Progress</p>
                        <p className="text-base font-bold text-primary">{answeredQuestions} of {totalQuestions} Answered</p>
                    </div>
                </div>

                {/* Global Question Palette in the bottom bar */}
                {(currentModuleIdx === 0 || currentModuleIdx === 1) && (
                    <div className="flex flex-col gap-1 items-center justify-center py-1">
                        <span className="text-[9px] font-black text-base-content/30 uppercase tracking-widest leading-none mb-0.5">Question Palette</span>
                        <div className="flex flex-wrap justify-center gap-1.5 max-w-xl md:max-w-3xl">
                            {unifiedQuestions.map((item, i) => {
                                const sectionAnswers = currentModuleIdx === 0 ? answers.listening : answers.reading;
                                const sectionList = currentModuleIdx === 0 ? test.sections?.listening : test.sections?.reading;
                                const section = sectionList?.[item.secIdx];
                                const secId = section?._id;
                                const isAnswered = secId ? !!(sectionAnswers?.[`${secId}_${item.q.id}`]) : false;
                                const isCurrentSection = currentModuleIdx === 0 
                                    ? item.secIdx === listeningPartIdx 
                                    : item.secIdx === readingSectionIdx;
                                
                                return (
                                    <button 
                                        key={`${item.secIdx}_${item.q.id}_${i}`} 
                                        onClick={() => handlePaletteClick(item)}
                                        className={`w-7 h-7 md:w-8 md:h-8 rounded-xl text-[10px] md:text-xs font-black transition-all border border-b-2 ${
                                            isAnswered 
                                            ? "bg-primary border-primary text-white shadow-md shadow-primary/10" 
                                            : isCurrentSection
                                            ? "bg-base-300 border-base-400 text-base-content"
                                            : "bg-base-100 border-base-200 text-base-content/70 hover:bg-base-200"
                                        }`}
                                    >
                                        {item.displayNum}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-8 flex-shrink-0">
                    <button 
                        onClick={answeredQuestions < totalQuestions ? handleTerminateTestClick : handleNextModule}
                        className={`btn btn-lg rounded-2xl px-10 h-14 text-sm font-black shadow-xl flex items-center gap-3 group ${
                            answeredQuestions < totalQuestions 
                            ? "btn-error text-white shadow-error/20" 
                            : "btn-primary shadow-primary/30"
                        }`}
                    >
                        {currentModuleIdx === 3 && answeredQuestions === totalQuestions 
                            ? "FINISH TEST" 
                            : (answeredQuestions < totalQuestions ? "TERMINATE TEST" : "CONTINUE TO NEXT SECTION")}
                        <PiCaretRightBold className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </footer>

            {/* Draggable Resizable Scratchpad Panel */}
            {showScratchpad && (
                <div 
                    className="fixed z-[999] bg-slate-900 text-white rounded-[2rem] shadow-2xl border border-white/10 flex flex-col select-text overflow-hidden"
                    style={{ 
                        top: `${scratchpadPos.y}px`, 
                        left: `${scratchpadPos.x}px`,
                        width: "360px",
                        height: "280px",
                        resize: "both",
                        minWidth: "280px",
                        minHeight: "200px"
                    }}
                >
                    {/* Header */}
                    <div 
                        onMouseDown={handleDragStart}
                        className="bg-slate-950/80 px-5 py-3.5 flex items-center justify-between border-b border-white/5 cursor-move select-none"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                            📝 Exam Notes Scratchpad
                        </span>
                        <button 
                            onClick={() => setShowScratchpad(false)}
                            className="btn btn-ghost btn-circle btn-xs text-white/40 hover:text-white hover:bg-white/10"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Content Textarea */}
                    <div className="flex-1 p-4 flex">
                        <textarea
                            value={scratchpadText}
                            onChange={(e) => setScratchpadText(e.target.value)}
                            placeholder="Write down any notes, exam keywords, or essay outlines here. Notes are saved automatically."
                            className="w-full h-full bg-slate-950/40 text-slate-200 border-none resize-none focus:outline-none text-xs p-4 rounded-2xl placeholder-slate-600 font-medium font-serif leading-relaxed"
                        />
                    </div>
                </div>
            )}
        </TestShell>
    );
};



export default TestEnvironment;
