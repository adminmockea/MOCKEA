import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import useAnswers from "../../../../hooks/useAnswers";
import useCountdown from "../../../../hooks/useCountdown";
import { Howl } from "howler";
import { 
    PiPlayCircleFill, 
    PiPauseCircleFill, 
    PiSpeakerHighFill, 
    PiSpeakerSlashFill,
    PiClockFill,
    PiCheckCircleFill,
    PiXCircleFill,
    PiHeadphonesFill,
    PiArrowRightBold,
    PiArrowLeftBold,
    PiInfoFill,
    PiChartLineUpFill
} from "react-icons/pi";
import { toast } from "react-toastify";
import alerts from "../../../../utils/alerts";
import { motion, AnimatePresence } from "framer-motion";
import useAuth from "../../../../hooks/useAuth";
import useAxiosSecure from "../../../../hooks/useAxiosSecure";
import useUserProfile from "../../../../hooks/useUserProfile";
import Loader from "../../../Loader/Loader";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import useTestIntegrity from "../../../../hooks/useTestIntegrity";
import TestShell from "../../../Common/TestShell";
import IeltsListeningFormat from "./IeltsListeningFormat";
import useEvaluate from "../../../../hooks/useEvaluate";
import { getSetCategory, getCategoryBadgeStyle } from "../../../../utils/questionCategoryUtils";


const fmt = (s) => {
  if (!s || isNaN(s)) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const Listening = ({ preloadedSet = null, onSubmitGuest = null }) => {
  const axiosSecure = useAxiosSecure();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userData } = useUserProfile();
  const targetExam = userData?.targetExam || "IELTS";

  const queryClient = useQueryClient();
  const { data: fetchedListeningSets = [], isLoading: queryLoading } = useQuery({
    queryKey: ["listening-sets", user?.email],
    queryFn: async () => {
      const response = await axiosSecure.get("/questions?type=listening");
      return response?.data?.questions || [];
    },
    enabled: !!user?.email && !preloadedSet,
    staleTime: 5 * 60 * 1000,
  });

  const listeningSets = preloadedSet ? [preloadedSet] : fetchedListeningSets;
  const loading = preloadedSet ? false : queryLoading;

  const [selectedSetId, setSelectedSetId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const categories = useMemo(() => {
    const map = new Map();
    listeningSets.forEach(set => {
      const cat = getSetCategory(set);
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [listeningSets]);

  const filteredListeningSets = useMemo(() => {
    if (selectedCategory === "ALL") return listeningSets;
    return listeningSets.filter(set => getSetCategory(set) === selectedCategory);
  }, [listeningSets, selectedCategory]);
  const { submitting, submitted, setSubmitted, result, setResult, evaluate } = useEvaluate();
  const { answers, setAnswers, handleAnswerChange } = useAnswers({});
  const [clickedOption, setClickedOption] = useState(null);

  useEffect(() => {
    setClickedOption(null);
  }, [selectedSetId]);

  // Fullscreen & Gating States
  const [isStarted, setIsStarted] = useState(false);
  const { isFullscreen, showWarning, setShowWarning, enterFullscreen, exitFullscreen } = useTestIntegrity(isStarted, submitted);

  /* --- Audio State --- */
  const howlRef = useRef(null);
  const rafRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const activeSet = useMemo(
    () => preloadedSet || listeningSets.find((set) => set._id === selectedSetId) || null,
    [preloadedSet, listeningSets, selectedSetId],
  );

  const dragDropQuestions = useMemo(() => activeSet?.questions?.filter(q => q.type === 'drag-drop-completion' || (q.type === 'flow-chart-completion' && q.options?.length > 0)) || [], [activeSet?.questions]);
  const sharedOptions = useMemo(() => {
      const first = dragDropQuestions[0];
      return first?.options?.filter(Boolean) || [];
  }, [dragDropQuestions]);

  const isPte = useMemo(() => activeSet?.examType === "PTE" || targetExam === "PTE", [activeSet, targetExam]);

  const targetDurationSeconds = useMemo(() => {
    if (activeSet?.timeLimit && Number(activeSet.timeLimit) > 0) {
      return Number(activeSet.timeLimit) * 60;
    }
    if (isPte || activeSet?.examType === "PTE") {
      return 20 * 60; // 20 minutes default for PTE standalone tests
    }
    return duration > 0 ? Math.ceil(duration) : 30 * 60; // Audio duration or 30 mins default for IELTS
  }, [activeSet, isPte, duration]);

  const { timeLeft, fmtTime: fmtCountdown, resetCountdown } = useCountdown(targetDurationSeconds, !!activeSet && targetDurationSeconds > 0, submitted);

  // Listening data fetched via useQuery above

  /* --- Audio Logic --- */
  useEffect(() => {
    if (!activeSet?.audioUrl) return;

    if (howlRef.current) {
        howlRef.current.unload();
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
    }

    const sound = new Howl({
      src: [activeSet.audioUrl],
      html5: true,
      volume: volume,
      onload: () => {
        setIsLoaded(true);
        setDuration(sound.duration());
      },
      onend: () => {
        setIsPlaying(false);
        cancelAnimationFrame(rafRef.current);
      },
    });
    howlRef.current = sound;

    return () => {
      cancelAnimationFrame(rafRef.current);
      sound.unload();
    };
    }, [activeSet?.audioUrl]);

    useEffect(() => {
        if (targetDurationSeconds > 0 && !submitted) {
            resetCountdown(targetDurationSeconds);
        }
    }, [targetDurationSeconds, submitted, resetCountdown]);

    useEffect(() => {
        if (howlRef.current) {
            howlRef.current.volume(isMuted ? 0 : volume);
        }
    }, [volume, isMuted]);

  const tick = useCallback(function tickFn() {
    if (howlRef.current?.playing()) {
      const seek = howlRef.current.seek() || 0;
      setCurrentTime(seek);
      setProgress(howlRef.current.duration() ? (seek / howlRef.current.duration()) * 100 : 0);
      rafRef.current = requestAnimationFrame(tickFn);
    }
  }, []);

  const togglePlay = () => {
    if (!isLoaded) return;
    if (!testStarted) setTestStarted(true);
    if (isPlaying) {
      howlRef.current.pause();
      cancelAnimationFrame(rafRef.current);
    } else {
      howlRef.current.play();
      rafRef.current = requestAnimationFrame(tick);
    }
    setIsPlaying(prev => !prev);
  };

  useEffect(() => {
    if (!testStarted || submitted) return;
    const iv = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(iv);
  }, [testStarted, submitted]);



  const handleEvaluate = async () => {
    await evaluate(activeSet, answers, onSubmitGuest);
  };

    const handleExitTest = async () => {
    if (submitted) {
      exitFullscreen();
      setIsStarted(false);
      if (preloadedSet) {
        navigate(-1);
      } else {
        setSelectedSetId("");
        setAnswers({});
        setSubmitted(false);
        setResult(null);
      }
      return;
    }

    const hasAnswers = Object.keys(answers).length > 0;
    const result = hasAnswers
      ? await alerts.confirmExitPractice("Listening Practice Lab")
      : await alerts.confirmCancelPractice("Listening Practice Lab");

    if (result.isConfirmed) {
      exitFullscreen();
      setIsStarted(false);

      if (hasAnswers) {
        try {
          toast.info("Auto-evaluating your answers...");
          const response = await axiosSecure.post("/questions/evaluate", {
            questionSetId: activeSet._id,
            answers,
          });
          if (response.data.success) {
            toast.success("Practice test auto-submitted successfully!");
            queryClient.invalidateQueries({ queryKey: ["user-lab-results"] });
          }
        } catch (error) {
          console.error("Auto submit failed:", error);
          toast.error("Auto-submit failed");
        }
      } else {
        toast.info("No answers entered. Exiting practice.");
      }

      if (preloadedSet) {
        navigate(-1);
      } else {
        setSelectedSetId("");
        setAnswers({});
        setSubmitted(false);
        setResult(null);
      }
    } else if (result.isDenied) {
      exitFullscreen();
      setIsStarted(false);

      Object.keys(localStorage).forEach((key) => {
        if (key.includes("test_cache") || key.includes("test_scratchpad") || key.includes("listening")) {
          localStorage.removeItem(key);
        }
      });

      toast.info("Practice cancelled. Answers discarded.");

      if (preloadedSet) {
        navigate(-1);
      } else {
        setSelectedSetId("");
        setAnswers({});
        setSubmitted(false);
        setResult(null);
      }
    }
  };

    const handleReturnToDashboard = () => {
        exitFullscreen();
        setIsStarted(false);
        navigate("/dashboard");
    };

    const handleRetake = () => {
        setAnswers({});
        setSubmitted(false);
        setResult(null);
        setTestStarted(false);
        setElapsed(0);
        setClickedOption(null);

        if (howlRef.current) {
            howlRef.current.stop();
            howlRef.current.seek(0);
        }
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);

        if (duration > 0) {
            resetCountdown(Math.ceil(duration));
        }

        setIsStarted(true);
        enterFullscreen();
    };


  if (loading) return <Loader />;

  if (!activeSet || (!preloadedSet && !selectedSetId)) {
    return (
        <div className="max-w-7xl mx-auto px-6 pt-2 pb-20">
            <div className="text-center space-y-4 mb-16">
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest border ${
                    listeningSets.length > 0 
                    ? "bg-primary/10 text-primary border-primary/20" 
                    : "bg-amber-50 text-amber-600 border-amber-200"
                }`}>
                    <PiHeadphonesFill /> {listeningSets.length} Modules Available
                </div>
                <h2 className="text-5xl font-black tracking-tighter text-slate-800">Choose a <span className="text-primary italic">Listening Module</span></h2>
                <p className="text-slate-400 font-medium text-lg">Select a standardized unit to begin your immersive training.</p>
            </div>

            {userData?.plan === "free" && userData?.role !== "admin" && userData?.role !== "instructor" && (
                <div className="max-w-3xl mx-auto mb-10 p-5 bg-amber-50/60 border border-amber-200/60 rounded-3xl flex items-start gap-4 shadow-xs text-left">
                    <span className="text-2xl mt-0.5">💡</span>
                    <div>
                        <h4 className="font-black text-amber-800 text-sm uppercase tracking-wider">Free Tier Plan</h4>
                        <p className="text-amber-700/90 text-xs font-semibold mt-1 leading-relaxed">
                            You can access <strong>2 random questions per day</strong>. Your questions will reset tomorrow! Upgrade your plan for unlimited access to all modules.
                        </p>
                    </div>
                </div>
            )}

            {listeningSets.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-xl mx-auto"
                >
                    <div className="card bg-white border-2 border-dashed border-base-300 p-16 rounded-[3rem] text-center space-y-6">
                        <div className="w-20 h-20 rounded-4xl bg-amber-50 border border-amber-100 flex items-center justify-center text-4xl mx-auto">
                            🎧
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black tracking-tight text-slate-800">
                                No Listening Modules Yet
                            </h3>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                No listening content is available for your current exam track{" "}
                                <span className="font-black text-primary">({targetExam})</span>.
                                This could be because:
                            </p>
                        </div>
                        <ul className="text-left space-y-3 text-sm text-slate-500 font-medium">
                            <li className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">1</span>
                                The admin hasn't uploaded any listening questions for <strong>{targetExam}</strong> yet.
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
                    {/* Category Filter Tabs */}
                    {categories.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            <button
                                onClick={() => setSelectedCategory("ALL")}
                                className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                                    selectedCategory === "ALL"
                                    ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                            >
                                All Categories ({listeningSets.length})
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.name}
                                    onClick={() => setSelectedCategory(cat.name)}
                                    className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border flex items-center gap-2 ${
                                        selectedCategory === cat.name
                                        ? "bg-primary text-white border-primary shadow-md scale-[1.02]"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-primary/30 hover:bg-slate-50"
                                    }`}
                                >
                                    <span>{cat.name}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                        selectedCategory === cat.name ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                                    }`}>
                                        {cat.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {filteredListeningSets.length === 0 ? (
                        <div className="p-12 text-center bg-white border border-slate-200 rounded-[2.5rem]">
                            <p className="text-slate-500 font-bold text-sm">No modules found for category "{selectedCategory}".</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredListeningSets.map((set, idx) => {
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
                                                    <PiHeadphonesFill />
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
                                            <div className="flex items-center gap-2 flex-wrap text-[10px] font-black uppercase tracking-widest text-base-content/40">
                                                <span className="flex items-center gap-1.5">
                                                    <PiClockFill /> {set.timeLimit ? `${set.timeLimit}m` : (set.examType === 'PTE' ? '20m' : '30m')}
                                                </span>
                                                <span className="flex items-center gap-1.5"><PiChartLineUpFill /> {set.questions?.length} Qs</span>
                                                {set.examType && (
                                                    <span className={`badge badge-sm font-black ${
                                                        set.examType === 'IELTS' ? 'badge-primary' :
                                                        set.examType === 'PTE' ? 'badge-success' : 'badge-warning'
                                                    }`}>{set.examType}</span>
                                                )}
                                                {set.listeningPart && (set.examType === 'IELTS' || set.examType === 'BOTH') && (
                                                    <span className="badge badge-sm font-black badge-ghost border border-indigo-200 text-indigo-500">
                                                        Part {set.listeningPart}
                                                    </span>
                                                )}
                                            </div>
                                            <button className="btn btn-block rounded-2xl h-14 bg-slate-900 text-white border-none group-hover:bg-primary transition-all font-black uppercase tracking-widest text-xs">
                                                Start Lab
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
      onStart={() => { setIsStarted(true); enterFullscreen(); }}
      onCancel={() => preloadedSet ? navigate(-1) : setSelectedSetId("")}
      title="Ready to Start?"
      description="This practice test will open in fullscreen mode. Ensure you are in a quiet environment and have headphones/speakers ready."
      icon={PiHeadphonesFill}
      isFullscreen={isFullscreen}
      showWarning={showWarning}
      onWarningResume={() => { setShowWarning(false); enterFullscreen(); }}
      onWarningExit={handleExitTest}
    >

      {/* Minimal Sticky Nav Bar */}
      <div className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={handleExitTest}
                    className="btn btn-ghost btn-circle text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                    <PiArrowLeftBold className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-sm font-black tracking-tight leading-tight text-slate-800">{activeSet?.title}</h1>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                        {activeSet?.listeningPart && (activeSet?.examType === 'IELTS' || activeSet?.examType === 'BOTH')
                            ? `IELTS Listening · Part ${activeSet.listeningPart}`
                            : 'Listening Practice'
                        }
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Time Left</div>
                    <div className={`text-lg font-mono font-black ${timeLeft < 300 ? 'text-red-500' : 'text-primary'}`}>
                        {fmtCountdown(timeLeft)}
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
                  <button
                    onClick={handleExitTest}
                    className="btn btn-error text-white rounded-2xl px-8 h-12 font-black border-none shadow-xl shadow-error/20"
                  >
                    End Test
                  </button>
                )}
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left: Audio Player + Questions */}
            <div className="lg:col-span-8 space-y-8">

                {/* ── Rich Inline Audio Player ─────────────────────────── */}
                <motion.div
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="card bg-white border border-slate-200 p-8 rounded-[3rem] shadow-xl overflow-hidden relative"
                >
                    <div className="relative z-10 space-y-6">
                        {/* Title row */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-1">Now Playing</p>
                                <h2 className="text-xl font-black tracking-tight text-slate-800">{activeSet?.title}</h2>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-2">
                            <div
                                className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative cursor-pointer group"
                                onClick={(e) => {
                                    if (!howlRef.current || !duration) return;
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const pct = (e.clientX - rect.left) / rect.width;
                                    howlRef.current.seek(pct * duration);
                                }}
                            >
                                <motion.div
                                    className="absolute inset-y-0 left-0 bg-primary rounded-full shadow-[0_0_16px_rgba(99,102,241,0.3)] group-hover:bg-indigo-400 transition-colors"
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: 'linear', duration: 0.3 }}
                                />
                                {/* Thumb dot */}
                                <motion.div
                                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary shadow-lg border border-white"
                                    animate={{ left: `calc(${progress}% - 8px)` }}
                                    transition={{ ease: 'linear', duration: 0.3 }}
                                />
                            </div>
                            {/* Time labels */}
                            <div className="flex justify-between text-[11px] font-mono font-bold text-slate-400">
                                <span>{fmt(currentTime)}</span>
                                <span>{fmt(duration)}</span>
                            </div>
                        </div>

                        {/* Controls row */}
                        <div className="flex items-center gap-6">
                            <button
                                onClick={togglePlay}
                                disabled={!isLoaded}
                                className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-3xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isPlaying ? <PiPauseCircleFill /> : <PiPlayCircleFill />}
                            </button>

                            {/* Volume */}
                            <div className="flex items-center gap-3 flex-1">
                                <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-slate-700 transition-colors">
                                    {isMuted || volume === 0 ? <PiSpeakerSlashFill className="text-xl" /> : <PiSpeakerHighFill className="text-xl" />}
                                </button>
                                <input
                                    type="range" min="0" max="1" step="0.05"
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        setVolume(v);
                                        setIsMuted(v === 0);
                                    }}
                                    className="w-28 accent-primary cursor-pointer"
                                />
                            </div>

                            {/* Stats pills */}
                            <div className="flex items-center gap-3 ml-auto">
                                <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Elapsed</p>
                                    <p className="text-sm font-mono font-black text-slate-700">{fmt(elapsed)}</p>
                                </div>
                                <div className="px-4 py-2 bg-primary/5 rounded-xl border border-primary/10 text-center">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">Duration</p>
                                    <p className="text-sm font-mono font-black text-primary">{fmt(duration)}</p>
                                </div>
                            </div>
                        </div>

                        {!activeSet?.audioUrl ? (
                            <p className="text-[11px] text-amber-500/80 font-bold text-center">
                                ⚠ No audio URL configured for this test.
                            </p>
                        ) : !isLoaded ? (
                            <p className="text-[11px] text-slate-400 font-bold text-center animate-pulse">
                                Loading audio...
                            </p>
                        ) : null}
                    </div>
                </motion.div>
                {/* ─────────────────────────────────────────────────────── */}

                <AnimatePresence>
                {submitted && result && (
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="card bg-linear-to-br from-indigo-600 to-primary p-10 rounded-[3rem] text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8"
                    >
                        <div className="flex items-center gap-8">
                            <div className="w-24 h-24 rounded-4xl bg-white/10 backdrop-blur-xl flex flex-col items-center justify-center border border-white/20">
                                <span className="text-3xl font-black">{result.score}%</span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Score</span>
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-tight">Performance Verified</h2>
                                <p className="text-white/60 font-bold uppercase tracking-widest text-xs mt-1">
                                    {result.correctAnswers} Correct of {result.totalQuestions} Questions
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handleExitTest}
                                className="btn bg-white text-error hover:bg-rose-50 border-none rounded-2xl px-6 h-14 font-black shadow-xl"
                            >
                                End Test
                            </button>
                            <button
                                onClick={handleReturnToDashboard}
                                className="btn bg-white text-primary hover:bg-slate-50 border-none rounded-2xl px-6 h-14 font-black shadow-xl"
                            >
                                Return to Dashboard
                            </button>
                            <button
                                onClick={handleRetake}
                                className="btn bg-white/20 text-white hover:bg-white/30 border-none rounded-2xl px-6 h-14 font-black"
                            >
                                Retake Test
                            </button>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* Questions Panel — IELTS: inline form completion, PTE: vertical list */}
                {
                    (activeSet.examType === 'IELTS' || activeSet.examType === 'BOTH' ||
                     (activeSet.examType !== 'PTE' && targetExam !== 'PTE')) ? (
                        <div className="space-y-8">
                            <IeltsListeningFormat
                                activeSet={activeSet}
                                answers={answers}
                                onAnswerChange={handleAnswerChange}
                                submitted={submitted}
                                result={result}
                                clickedOption={clickedOption}
                                setClickedOption={setClickedOption}
                            />
                            {!submitted && (
                                <button
                                    onClick={handleEvaluate}
                                    disabled={submitting}
                                    className="btn btn-primary btn-block rounded-[2rem] h-20 text-sm font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02]"
                                >
                                    {submitting ? <span className="loading loading-spinner" /> : "Finalize Assessment"}
                                    <PiArrowRightBold />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="card bg-white p-10 rounded-[3.5rem] border border-base-300 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 text-primary/5 text-9xl">
                                <PiHeadphonesFill />
                            </div>
                    
                            <div className="relative z-10 space-y-10">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-3xl font-black tracking-tighter italic text-slate-800">Practice Modules</h2>
                                    <span className="badge badge-primary px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">Questions 1–{activeSet.questions.length}</span>
                                </div>

                                <div className="space-y-12">
                                    {activeSet.questions.map((q, idx) => {
                                        const evaluation = result?.evaluatedAnswers.find(a => a.questionId === q.id);
                                        const isCorrect = evaluation?.isCorrect;

                                        return (
                                            <div key={q.id} className={`group space-y-6 p-8 rounded-[2.5rem] transition-all border ${
                                                submitted 
                                                ? (isCorrect ? "bg-emerald-50/50 border-emerald-500/20" : "bg-red-50/50 border-red-500/20")
                                                : "bg-base-50/50 border-base-200 hover:border-primary/20"
                                            }`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-white border border-base-300 shadow-sm flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform">
                                                            {idx + 1}
                                                        </div>
                                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-base-content/30">Listen Carefully</span>
                                                    </div>
                                                    {submitted && (
                                                        isCorrect ? <PiCheckCircleFill className="text-emerald-500 text-2xl" /> : <PiXCircleFill className="text-red-500 text-2xl" />
                                                    )}
                                                </div>

                                                <p className="text-lg font-black text-slate-700 leading-tight">{q.question}</p>

                                                {q.options && q.options.filter(opt => opt && opt.trim() !== "").length > 0 ? (
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        {q.options.filter(opt => opt && opt.trim() !== "").map((opt, oIdx) => (
                                                            <label 
                                                                key={oIdx}
                                                                className={`flex items-center gap-3 p-5 rounded-2xl border transition-all cursor-pointer ${
                                                                    answers[q.id] === opt 
                                                                    ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 font-bold" 
                                                                    : "bg-white border-base-200 hover:border-primary/30"
                                                                }`}
                                                            >
                                                                <input 
                                                                    type="radio" 
                                                                    className="hidden"
                                                                    name={q.id}
                                                                    value={opt}
                                                                    disabled={submitted}
                                                                    onChange={() => handleAnswerChange(q.id, opt)}
                                                                />
                                                                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center p-1 ${answers[q.id] === opt ? "border-white" : "border-base-300"}`}>
                                                                    {answers[q.id] === opt && <div className="w-full h-full rounded-full bg-white" />}
                                                                </span>
                                                                <span className="text-sm">{opt}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {q.type === "pte-summarize-spoken-text" ? (
                                                            <div className="relative">
                                                                <textarea 
                                                                    disabled={submitted}
                                                                    rows={4}
                                                                    className="textarea textarea-bordered w-full rounded-2xl font-semibold bg-white focus:border-primary text-lg p-4 resize-y min-h-[120px]"
                                                                    placeholder="Enter your observation..."
                                                                    value={answers[q.id] || ""}
                                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                                />
                                                                <div className="text-right text-xs font-bold text-slate-400 mt-1">
                                                                    Word count: {(answers[q.id] || "").trim() ? (answers[q.id] || "").trim().split(/\s+/).filter(w => w.length > 0).length : 0}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <input 
                                                                type="text"
                                                                disabled={submitted}
                                                                className="input input-bordered w-full h-14 rounded-2xl font-bold bg-white focus:border-primary text-lg"
                                                                placeholder="Enter your observation..."
                                                                value={answers[q.id] || ""}
                                                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                            />
                                                        )}
                                                        {submitted && !isCorrect && (
                                                            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-500/20">
                                                                <PiCheckCircleFill /> Correct Key: {q.correctAnswer}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {!submitted && (
                                    <button 
                                        onClick={handleEvaluate}
                                        disabled={submitting}
                                        className="btn btn-primary btn-block rounded-[2rem] h-20 text-sm font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 mt-12 transition-all hover:scale-[1.02]"
                                    >
                                        {submitting ? <span className="loading loading-spinner" /> : "Finalize Assessment"}
                                        <PiArrowRightBold />
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                }
            </div>

            {/* Sidebar Widgets */}
            <div className="lg:col-span-4 space-y-8 sticky top-36">
                {/* Options Pool */}
                {sharedOptions.length > 0 && (
                    <div className="card bg-white p-8 rounded-[3rem] border border-base-300 shadow-sm space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-base-content/30">Answers Bank</h3>
                        <p className="text-xs text-slate-400 font-bold leading-snug">
                            Drag an option or click to select, then click a blank in the flowchart to place it.
                        </p>
                        <div className="flex flex-col gap-2">
                            {sharedOptions.map((opt, i) => {
                                const letter = String.fromCharCode(65 + i);
                                const label = `${letter}. ${opt}`;
                                const isPlaced = false; // Allow multiple use
                                const isSelected = clickedOption === label;
                                return (
                                    <div
                                        key={i}
                                        draggable={!isPlaced && !submitted}
                                        onDragStart={(e) => {
                                            if (submitted) return;
                                            e.dataTransfer.setData("text/plain", label);
                                        }}
                                        onClick={() => {
                                            if (submitted) return;
                                            if (!isPlaced) {
                                                setClickedOption(isSelected ? null : label);
                                            }
                                        }}
                                        className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all select-none text-center ${
                                            isPlaced
                                                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                                                : isSelected
                                                ? "bg-primary border-primary text-white shadow-md scale-105"
                                                : "bg-white border-slate-200 hover:border-primary/50 text-slate-700 hover:scale-105 active:scale-95 cursor-pointer"
                                        }`}
                                    >
                                        {label}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Navigator */}
                <div className="card bg-white p-8 rounded-[3rem] border border-base-300 shadow-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-base-content/30 mb-6">Unit Navigator</h3>
                    <div className="grid grid-cols-5 gap-3">
                        {activeSet.questions.map((q, i) => {
                            const part = activeSet?.listeningPart || 1;
                            const isIelts = activeSet?.examType === 'IELTS' || activeSet?.examType === 'BOTH';
                            const offset = isIelts ? (part - 1) * 10 : 0;
                            const isAnswered = !!answers[q.id];
                            return (
                                <div 
                                    key={q.id}
                                    className={`w-full aspect-square rounded-xl border flex items-center justify-center text-xs font-black transition-all ${
                                        isAnswered ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-base-100 border-base-200 text-base-content/40"
                                    }`}
                                >
                                    {offset + i + 1}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Info Card */}
                <div className="card bg-white p-8 rounded-[3rem] text-slate-800 border border-slate-200 shadow-sm overflow-hidden relative">
                    <div className="absolute -bottom-10 -right-10 text-slate-200 text-9xl">
                        <PiInfoFill />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                                <PiChartLineUpFill />
                            </div>
                            <h3 className="font-black tracking-tight leading-tight text-red-600">Practice Intensity</h3>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-xs font-bold text-red-500">
                                <span className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                Audio is played only once in real exam.
                            </li>
                            <li className="flex items-start gap-3 text-xs font-bold text-red-500">
                                <span className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                Spelling accuracy is mission critical.
                            </li>
                            <li className="flex items-start gap-3 text-xs font-bold text-red-500">
                                <span className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                Follow word count limits strictly.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </TestShell>
  );
};

export default Listening;
