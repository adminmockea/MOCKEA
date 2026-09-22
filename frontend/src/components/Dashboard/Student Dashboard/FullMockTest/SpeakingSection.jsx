import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
    PiMicrophoneFill, 
    PiMicrophoneStageFill, 
    PiStopCircleFill, 
    PiCheckCircleFill, 
    PiInfoFill, 
    PiClockFill, 
    PiWaveformFill, 
    PiUserCircleFill, 
    PiArrowLeftBold,
    PiPlay,
    PiClock,
    PiMicrophoneStage,
    PiInfo,
    PiSpeakerHighFill
} from "react-icons/pi";
import Swal from "sweetalert2";
import axios from "axios";
import { toast } from "react-toastify";
import useAxiosSecure from "../../../../hooks/useAxiosSecure";

const SpeakingSection = ({ data, answers = {}, onAnswerChange, examType }) => {
    const axiosSecure = useAxiosSecure();
    // Timers & Active states
    const [prepTime, setPrepTime] = useState(60);
    const [isPrepActive, setIsPrepActive] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Active Navigation
    const [activePart, setActivePart] = useState(1);
    const [part1QuestionIdx, setPart1QuestionIdx] = useState(0);
    const [part3QuestionIdx, setPart3QuestionIdx] = useState(0);

    // Audio State Cache
    const [part1Urls, setPart1Urls] = useState([]);
    const [part2Url, setPart2Url] = useState("");
    const [part3Urls, setPart3Urls] = useState([]);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const visualizerCleanupRef = useRef(null);
    const recordingTimeRef = useRef(0);
    const hasInitializedRef = useRef({});
    const [mediaStream, setMediaStream] = useState(null);
    const [isPlayingPteAudio, setIsPlayingPteAudio] = useState(false);

    const pteAudioElementRef = useRef(null);

    const playPteAudio = (textOrUrl) => {
        if (!textOrUrl) return;

        const isUrl = /^https?:\/\//i.test(textOrUrl) || /\.(mp3|wav|m4a|ogg|aac|webm)(\?.*)?$/i.test(textOrUrl);

        if (isPlayingPteAudio) {
            if (pteAudioElementRef.current) {
                pteAudioElementRef.current.pause();
                pteAudioElementRef.current.currentTime = 0;
            }
            window.speechSynthesis?.cancel();
            setIsPlayingPteAudio(false);
            return;
        }

        if (isUrl) {
            window.speechSynthesis?.cancel();
            if (!pteAudioElementRef.current) {
                pteAudioElementRef.current = new Audio();
            }
            pteAudioElementRef.current.src = textOrUrl;
            pteAudioElementRef.current.onplay = () => setIsPlayingPteAudio(true);
            pteAudioElementRef.current.onended = () => setIsPlayingPteAudio(false);
            pteAudioElementRef.current.onerror = () => {
                setIsPlayingPteAudio(false);
                toast.error("Failed to load prompt audio.");
            };
            pteAudioElementRef.current.play().catch((err) => {
                console.error("Audio playback error:", err);
                setIsPlayingPteAudio(false);
            });
        } else {
            if (pteAudioElementRef.current) {
                pteAudioElementRef.current.pause();
            }
            window.speechSynthesis?.cancel();
            const utterance = new SpeechSynthesisUtterance(textOrUrl);
            utterance.onstart = () => setIsPlayingPteAudio(true);
            utterance.onend = () => setIsPlayingPteAudio(false);
            utterance.onerror = () => setIsPlayingPteAudio(false);
            window.speechSynthesis.speak(utterance);
        }
    };

    useEffect(() => {
        return () => {
            if (pteAudioElementRef.current) {
                pteAudioElementRef.current.pause();
            }
            window.speechSynthesis?.cancel();
            setIsPlayingPteAudio(false);
        };
    }, [activePart]);

    // Format speaking questions
    const part1Questions = useMemo(() => {
        return data?.speakingPart1Questions?.length > 0 
            ? data.speakingPart1Questions 
            : [
                "Do you work or study?",
                "What do you like most about your home town?",
                "How do you usually spend your weekends?",
                "What is your favorite type of music or movie?"
              ];
    }, [data]);

    const part3Questions = useMemo(() => {
        return data?.speakingPart3Questions?.length > 0 
            ? data.speakingPart3Questions 
            : [
                "Why do you think protecting historic structures or old buildings is important?",
                "How do buildings of the past differ from modern architectural designs?",
                "What kind of buildings or homes do you think people will live in in the future?"
              ];
    }, [data]);

    // Active Audio URL for review player
    const activeAudioUrl = useMemo(() => {
        if (activePart === 1) return part1Urls[part1QuestionIdx] || null;
        if (activePart === 2) return part2Url || null;
        if (activePart === 3) return part3Urls[part3QuestionIdx] || null;
        return null;
    }, [activePart, part1QuestionIdx, part3QuestionIdx, part1Urls, part2Url, part3Urls]);

    const studioSubtitle = useMemo(() => {
        if (examType === "PTE") {
            const q = data?.questions?.[activePart - 1];
            const typeStr = q?.type === "pte-read-aloud" ? "Read Aloud"
                          : q?.type === "pte-repeat-sentence" ? "Repeat Sentence"
                          : q?.type === "pte-describe-image" ? "Describe Image"
                          : q?.type === "pte-retell-lecture" ? "Retell Lecture"
                          : q?.type === "pte-answer-short-question" ? "Answer Short Question"
                          : "Speaking Task";
            return `${typeStr} • Question ${activePart} of 3`;
        }
        if (activePart === 1) return `Part 1 of 3 • Question ${part1QuestionIdx + 1} of ${part1Questions.length}`;
        if (activePart === 3) return `Part 3 of 3 • Question ${part3QuestionIdx + 1} of ${part3Questions.length}`;
        return "Part 2 of 3 • Cue Card Response";
    }, [activePart, part1QuestionIdx, part1Questions, part3QuestionIdx, part3Questions, examType, data]);

    const maxRecordingTime = useMemo(() => {
        if (examType === "PTE") {
            const q = data?.questions?.[activePart - 1];
            if (q?.type === "pte-repeat-sentence") return 15;
            if (q?.type === "pte-answer-short-question") return 10;
            return 40;
        }
        if (activePart === 1) return 40;
        if (activePart === 3) return 50;
        return 120; // Part 2 Cue Card
    }, [activePart, examType, data]);

    // Track recording time via Ref to avoid closure stale bugs
    useEffect(() => {
        recordingTimeRef.current = recordingTime;
    }, [recordingTime]);

    // Load URL cache from localStorage or parent answers on mount
    useEffect(() => {
        if (!data?._id) return;
        if (hasInitializedRef.current[data._id]) return;

        let loaded = false;
        const cached = localStorage.getItem(`speaking_cache_${data._id}`);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed.part1Urls?.length === part1Questions.length) setPart1Urls(parsed.part1Urls);
                if (parsed.part2Url) setPart2Url(parsed.part2Url);
                if (parsed.part3Urls?.length === part3Questions.length) setPart3Urls(parsed.part3Urls);
                loaded = true;
            } catch (e) {
                console.error("Failed to restore speaking cache:", e);
            }
        }

        if (!loaded) {
            const combined = answers[data._id];
            if (combined && typeof combined === 'string') {
                const parsedPart1 = new Array(part1Questions.length).fill("");
                let parsedPart2 = "";
                const parsedPart3 = new Array(part3Questions.length).fill("");

                const p3Index = combined.indexOf("--- Part 3 Discussion ---");
                const part1And2Text = p3Index !== -1 ? combined.slice(0, p3Index) : combined;
                const part3Text = p3Index !== -1 ? combined.slice(p3Index) : "";

                const p1Regex = /Q(\d+):[\s\S]*?\nAnswer:\s*(https?:\/\/[^\s\n]+)/g;
                let match;
                while ((match = p1Regex.exec(part1And2Text)) !== null) {
                    const idx = parseInt(match[1], 10) - 1;
                    if (idx >= 0 && idx < parsedPart1.length) {
                        parsedPart1[idx] = match[2];
                    }
                }

                const p2Regex = /Cue Card:[\s\S]*?\nAnswer:\s*(https?:\/\/[^\s\n]+)/;
                const p2Match = part1And2Text.match(p2Regex);
                if (p2Match) {
                    parsedPart2 = p2Match[1];
                }

                const p3Regex = /Q(\d+):[\s\S]*?\nAnswer:\s*(https?:\/\/[^\s\n]+)/g;
                while ((match = p3Regex.exec(part3Text)) !== null) {
                    const idx = parseInt(match[1], 10) - 1;
                    if (idx >= 0 && idx < parsedPart3.length) {
                        parsedPart3[idx] = match[2];
                    }
                }

                if (parsedPart1.some(u => !!u)) setPart1Urls(parsedPart1);
                if (parsedPart2) setPart2Url(parsedPart2);
                if (parsedPart3.some(u => !!u)) setPart3Urls(parsedPart3);
            }
        }

        hasInitializedRef.current[data._id] = true;
    }, [data?._id, part1Questions.length, part3Questions.length, answers]);

    // Save URL cache to localStorage when URLs change
    useEffect(() => {
        if (data?._id && (part1Urls.length > 0 || part2Url || part3Urls.length > 0)) {
            localStorage.setItem(`speaking_cache_${data._id}`, JSON.stringify({
                part1Urls,
                part2Url,
                part3Urls
            }));
        }
    }, [part1Urls, part2Url, part3Urls, data?._id]);

    // Initialize/sync URL arrays when questions change
    useEffect(() => {
        if (data) {
            setPart1Urls(prev => prev.length === part1Questions.length ? prev : new Array(part1Questions.length).fill(""));
            setPart3Urls(prev => prev.length === part3Questions.length ? prev : new Array(part3Questions.length).fill(""));
        }
    }, [data, part1Questions.length, part3Questions.length]);

    // Format & submit the speaking responses string to master answers
    useEffect(() => {
        if (!data?._id) return;

        const hasPart1 = part1Urls.some(u => !!u);
        const hasPart2 = !!part2Url;
        const hasPart3 = part3Urls.some(u => !!u);

        if (!hasPart1 && !hasPart2 && !hasPart3) return;

        const lines = [];
        if (hasPart1) {
            lines.push("--- Part 1 Interview ---");
            part1Questions.forEach((q, idx) => {
                if (part1Urls[idx]) {
                    lines.push(`Q${idx + 1}: ${q}\nAnswer: ${part1Urls[idx]}`);
                }
            });
        }
        if (hasPart2) {
            lines.push("--- Part 2 Cue Card ---");
            lines.push(`Cue Card: ${data.speakingPrompt || data.question || "Describe a historical building you have visited."}\nAnswer: ${part2Url}`);
        }
        if (hasPart3) {
            lines.push("--- Part 3 Discussion ---");
            part3Questions.forEach((q, idx) => {
                if (part3Urls[idx]) {
                    lines.push(`Q${idx + 1}: ${q}\nAnswer: ${part3Urls[idx]}`);
                }
            });
        }

        const combined = lines.join("\n\n");
        onAnswerChange(data._id, combined);

        // Compute completion keys
        const p1Complete = part1Urls.length > 0 && part1Urls.every(u => !!u);
        const p2Complete = !!part2Url;
        const p3Complete = part3Urls.length > 0 && part3Urls.every(u => !!u);

        onAnswerChange(data._id + '_part1_completed', p1Complete ? 'completed' : '');
        onAnswerChange(data._id + '_part2_completed', p2Complete ? 'completed' : '');
        onAnswerChange(data._id + '_part3_completed', p3Complete ? 'completed' : '');
    }, [part1Urls, part2Url, part3Urls, data, part1Questions, part3Questions, onAnswerChange]);

    // 10s Prep Timer Warn popup
    useEffect(() => {
        if (prepTime === 10 && isPrepActive) {
            Swal.fire({
                title: "10 Seconds of Prep Remaining!",
                text: "Get ready! Recording will begin automatically in 10 seconds.",
                icon: "warning",
                timer: 3500,
                showConfirmButton: false,
                toast: true,
                position: "top-end",
                timerProgressBar: true,
                background: "#FDFDFB",
                color: "#1e293b",
                customClass: {
                    popup: "rounded-[2rem] shadow-2xl border border-amber-300"
                }
            });
        }
    }, [prepTime, isPrepActive]);

    // Prep Countdown Timer
    useEffect(() => {
        let interval;
        if (isPrepActive) {
            interval = setInterval(() => {
                setPrepTime(prev => {
                    if (prev <= 1) {
                        setIsPrepActive(false);
                        startRecording();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPrepActive]);

    // Recording Time Progress Timer
    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    // Auto-Stop when max recording duration reached
    useEffect(() => {
        if (isRecording && recordingTime >= maxRecordingTime) {
            stopRecording();
            toast.info(`Maximum speaking time (${maxRecordingTime} seconds) reached. Recording stopped.`);
        }
    }, [recordingTime, isRecording, maxRecordingTime]);

    // Reset recording timer on sub-question switch
    useEffect(() => {
        setRecordingTime(0);
        setIsPrepActive(false);
    }, [part1QuestionIdx, part3QuestionIdx, activePart]);

    // Web Audio Soundwave Canvas Visualizer
    const canvasCallback = useCallback(
        (canvas) => {
            if (visualizerCleanupRef.current) {
                visualizerCleanupRef.current();
                visualizerCleanupRef.current = null;
            }

            if (!canvas || !mediaStream) return;

            let audioCtx;
            let analyser;
            let source;
            let animationFrameId;

            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioCtx.createAnalyser();
                analyser.fftSize = 128;

                source = audioCtx.createMediaStreamSource(mediaStream);
                source.connect(analyser);

                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                const ctx = canvas.getContext("2d");

                const draw = () => {
                    animationFrameId = requestAnimationFrame(draw);
                    analyser.getByteFrequencyData(dataArray);

                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    const barWidth = (canvas.width / bufferLength) * 1.6;
                    let barHeight;
                    let x = 0;

                    for (let i = 0; i < bufferLength; i++) {
                        barHeight = (dataArray[i] / 255) * canvas.height * 0.75;
                        if (barHeight < 4) barHeight = 4;

                        const gradient = ctx.createLinearGradient(
                            0,
                            (canvas.height - barHeight) / 2,
                            0,
                            (canvas.height + barHeight) / 2,
                        );
                        gradient.addColorStop(0, "#c084fc");
                        gradient.addColorStop(0.5, "#ec4899");
                        gradient.addColorStop(1, "#c084fc");

                        ctx.fillStyle = gradient;

                        const y = (canvas.height - barHeight) / 2;
                        const radius = 3;

                        ctx.beginPath();
                        ctx.roundRect(x, y, barWidth - 2, barHeight, radius);
                        ctx.fill();

                        x += barWidth;
                    }
                };

                draw();

                visualizerCleanupRef.current = () => {
                    if (animationFrameId) cancelAnimationFrame(animationFrameId);
                    if (audioCtx && audioCtx.state !== "closed") audioCtx.close();
                };
            } catch (e) {
                console.error("Audio visualizer failed:", e);
            }
        },
        [mediaStream]
    );

    // Audio capture functions
    const startRecording = async () => {
        if (isRecording || isSaving || isUploading || isPlayingPteAudio) return;

        // Strict Check: Prevent recording if a response already exists
        if (activePart === 1 && part1Urls[part1QuestionIdx]) {
            toast.error("You have already recorded a response for this question.");
            return;
        }
        if (activePart === 2 && part2Url) {
            toast.error("You have already recorded a response for this part.");
            return;
        }
        if (activePart === 3 && part3Urls[part3QuestionIdx]) {
            toast.error("You have already recorded a response for this question.");
            return;
        }
        
        // Clear previous url for the active part to ensure UI is reset and clean
        if (activePart === 1) {
            setPart1Urls(prev => {
                const next = [...prev];
                next[part1QuestionIdx] = "";
                return next;
            });
        } else if (activePart === 2) {
            setPart2Url("");
        } else if (activePart === 3) {
            setPart3Urls(prev => {
                const next = [...prev];
                next[part3QuestionIdx] = "";
                return next;
            });
        }

        toast.info("Recording is starting... Please wait.");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMediaStream(stream);
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                try {
                    const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                    if (blob.size > 100) {
                        await uploadToCloudinary(blob);
                    } else {
                        toast.warn("Recording was too short to be saved.");
                    }
                } catch (err) {
                    console.error("Error in MediaRecorder.onstop:", err);
                    toast.error("Failed to capture recording. Please try again.");
                } finally {
                    if (stream) {
                        stream.getTracks().forEach((track) => track.stop());
                    }
                    setMediaStream(null);
                    setIsRecording(false);
                    setIsSaving(false);
                }
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setIsPrepActive(false);
            setRecordingTime(0);
            toast.success("Recording Started! Speak clearly.");
        } catch (err) {
            console.error("Microphone access failed:", err);
            toast.error("Microphone access denied. Please enable it to record.");
        }
    };

    function stopRecording() {
        if (mediaRecorderRef.current && isRecording && mediaRecorderRef.current.state !== "inactive") {
            try {
                setIsSaving(true);
                setIsRecording(false);
                mediaRecorderRef.current.stop();
            } catch (err) {
                console.error("Failed to stop media recorder:", err);
                setIsSaving(false);
                setIsRecording(false);
            }
        }
    }

    const startPrep = () => {
        if (activePart === 2) {
            setPart2Url("");
        }
        setIsPrepActive(true);
        setPrepTime(60);
        toast.info("1-Minute Preparation Time Started");
    };

    // Auto-start prep timer when student navigates to Part 2 (Cue Card)
    useEffect(() => {
        if (activePart === 2 && examType !== "PTE" && !part2Url && !isPrepActive && !isRecording && !isSaving && !isUploading) {
            startPrep();
        }
    }, [activePart, examType, part2Url, isPrepActive, isRecording, isSaving, isUploading]);


    // Upload to Cloudinary helper
    const uploadToCloudinary = async (blob, _retryCount = 0) => {
        const MAX_RETRIES = 3;
        setIsUploading(true);
        try {
            // 1. Fetch secure upload signature from backend
            const signatureRes = await axiosSecure.get('/submissions/upload-signature');
            const { signature, timestamp, folder, apiKey, cloudName } = signatureRes.data;

            // 2. Perform direct-to-cloud signed upload
            const formData = new FormData();
            formData.append("file", blob, "speaking_mock_recording.webm");
            formData.append("api_key", apiKey);
            formData.append("timestamp", timestamp);
            formData.append("signature", signature);
            formData.append("folder", folder);

            const response = await axios.post(
                `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
                formData
            );

            const secureUrl = response.data.secure_url;

            if (activePart === 1) {
                setPart1Urls(prev => {
                    const next = [...prev];
                    next[part1QuestionIdx] = secureUrl;
                    return next;
                });
            } else if (activePart === 2) {
                setPart2Url(secureUrl);
            } else if (activePart === 3) {
                setPart3Urls(prev => {
                    const next = [...prev];
                    next[part3QuestionIdx] = secureUrl;
                    return next;
                });
            }
            toast.success("Recording uploaded and saved successfully!");
        } catch (err) {
            if (_retryCount < MAX_RETRIES) {
                const delay = Math.pow(2, _retryCount) * 1000;
                await new Promise((resolve) => setTimeout(resolve, delay));
                return uploadToCloudinary(blob, _retryCount + 1);
            }
            console.error("Upload failed:", err);
            toast.error("Failed to upload recording to server. Please try again.");
        } finally {
            if (_retryCount === 0 || _retryCount >= MAX_RETRIES) {
                setIsUploading(false);
            }
        }
    };

    const formatTime = (s) => {
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return `${min}:${sec.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex h-full bg-base-100 overflow-hidden">
            {/* Left Sidebar: Navigation & Instructions with Sticky Palette */}
            <div className="w-1/3 flex flex-col h-full bg-white border-r border-base-200 shrink-0">
                <div className="flex-1 overflow-y-auto p-12 space-y-8">
                    <header className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">{examType === "PTE" ? "PTE Speaking" : "IELTS Speaking"}</p>
                        <h1 className="text-3xl font-black">{examType === "PTE" ? "Academic Session" : "Practice Session"}</h1>
                    </header>

                    {/* Step wizard switcher */}
                    <div className="flex flex-col gap-2 bg-slate-50 p-2.5 rounded-3xl border border-slate-100">
                        {[1, 2, 3].map((part) => (
                            <button
                                key={part}
                                type="button"
                                disabled={isRecording || isSaving || isUploading}
                                onClick={() => setActivePart(part)}
                                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                                    activePart === part
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                                }`}
                            >
                                <span>Part {part}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-md ${activePart === part ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}>
                                    {examType === "PTE" 
                                        ? (part === 1 ? "Read Aloud" : part === 2 ? "Repeat Sentence" : "Describe Image")
                                        : (part === 1 ? "Interview" : part === 2 ? "Cue Card" : "Discussion")}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Dynamic Guidelines based on activePart */}
                    <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <PiInfo className="w-6 h-6" />
                            <span>Rules of Part {activePart}</span>
                        </div>
                        <ul className="space-y-3 text-sm text-base-content/70 leading-relaxed">
                            {examType === "PTE" ? (
                                <>
                                    {activePart === 1 && (
                                        <>
                                            <li>• Read the text displayed on the screen aloud.</li>
                                            <li>• Speak clearly, naturally, and at a steady pace.</li>
                                            <li>• You have 40 seconds to complete this task.</li>
                                        </>
                                    )}
                                    {activePart === 2 && (
                                        <>
                                            <li>• Listen to the sentence recording.</li>
                                            <li>• Repeat the sentence exactly as you hear it.</li>
                                            <li>• Accuracy in word order and pronunciation is key.</li>
                                        </>
                                    )}
                                    {activePart === 3 && (
                                        <>
                                            <li>• Look at the image/diagram displayed.</li>
                                            <li>• Describe the main details and trends shown in the image.</li>
                                            <li>• You have 40 seconds to record your answer.</li>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    {activePart === 1 && (
                                        <>
                                            <li>• Introduction and short general questions.</li>
                                            <li>• Answer immediately as the examiner asks them.</li>
                                            <li>• Speak naturally for about 40 seconds per question.</li>
                                        </>
                                    )}
                                    {activePart === 2 && (
                                        <>
                                            <li>• You have 1 minute to prepare your notes.</li>
                                            <li>• You should speak for 1 to 2 minutes.</li>
                                            <li>• The timer will guide you through each stage.</li>
                                        </>
                                    )}
                                    {activePart === 3 && (
                                        <>
                                            <li>• Abstract and deeper discussion questions.</li>
                                            <li>• Answer in detail, giving opinions and examples.</li>
                                            <li>• Speak naturally for about 50 seconds per question.</li>
                                        </>
                                    )}
                                </>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Sticky Question Palette */}
                <div className="p-6 border-t border-base-200 bg-white">
                    <div className="max-w-2xl mx-auto flex flex-col gap-3">
                        <span className="text-[10px] font-black text-base-content/30 uppercase tracking-widest">Section Steps</span>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3].map((part) => (
                                <button 
                                    key={part}
                                    disabled={isRecording || isSaving || isUploading}
                                    onClick={() => setActivePart(part)}
                                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all border-b-2 ${
                                        activePart === part 
                                        ? "bg-primary text-white border-primary-dark shadow-lg shadow-primary/20" 
                                        : "bg-base-200 border-base-300 hover:bg-base-300 disabled:opacity-50"
                                    }`}
                                >
                                    {part}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Pane: Main Task */}
            <div className="flex-1 flex flex-col lg:flex-row p-12 overflow-y-auto gap-8">
                {/* Left side of right pane: Questions */}
                <div className="flex-1 max-w-2xl w-full space-y-8">
                    {examType === "PTE" ? (
                        <div className="space-y-6">
                            {activePart === 1 && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <h2 className="text-2xl font-black text-slate-800">Part 1: Read Aloud</h2>
                                        <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl uppercase tracking-widest shrink-0">
                                            Q 1 of 3
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold mt-2">
                                        Read the text below aloud. Speak clearly and naturally into the microphone. You have 40 seconds.
                                    </p>
                                    <div className="p-8 bg-slate-50 border-2 border-primary/20 rounded-[2rem] shadow-md">
                                        <p className="text-xl font-bold text-slate-800 leading-relaxed">
                                            {data?.questions?.[0]?.question}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activePart === 2 && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <h2 className="text-2xl font-black text-slate-800">Part 2: Repeat Sentence</h2>
                                        <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl uppercase tracking-widest shrink-0">
                                            Q 2 of 3
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold mt-2">
                                        Listen to the sentence audio, then repeat it exactly as you heard it. You have 15 seconds.
                                    </p>
                                    <div className="p-8 bg-slate-50 border-2 border-primary/20 rounded-[2rem] shadow-md flex flex-col items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => playPteAudio(data?.questions?.[1]?.audioUrl || data?.questions?.[1]?.pteAudioTranscript)}
                                            className={`btn btn-circle btn-lg ${isPlayingPteAudio ? "btn-error animate-pulse" : "btn-primary"} text-white`}
                                        >
                                            {isPlayingPteAudio ? <PiStopCircleFill className="w-8 h-8" /> : <PiPlay className="w-8 h-8" />}
                                        </button>
                                        <span className="text-sm font-bold text-slate-600">
                                            {isPlayingPteAudio ? "Playing Sentence..." : "Click to Play Sentence"}
                                        </span>
                                        {data?.questions?.[1]?.audioUrl && (
                                            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                                                Master Audio Prompt Available
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activePart === 3 && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <h2 className="text-2xl font-black text-slate-800">Part 3: Describe Image</h2>
                                        <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl uppercase tracking-widest shrink-0">
                                            Q 3 of 3
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold mt-2">
                                        Look at the image below and describe the details shown in your own words. You have 40 seconds.
                                    </p>
                                    <div className="space-y-6">
                                        {data?.questions?.[2]?.question && (
                                            <p className="text-lg font-bold text-slate-800 italic">
                                                "{data?.questions?.[2]?.question}"
                                            </p>
                                        )}
                                        {data?.questions?.[2]?.imageUrl && (
                                            <div className="rounded-[2.5rem] overflow-hidden border-8 border-slate-50 shadow-inner max-h-[350px] flex items-center justify-center bg-slate-100">
                                                <img
                                                    src={data?.questions?.[2]?.imageUrl}
                                                    alt="Describe Image Prompt"
                                                    className="max-h-[350px] object-contain w-auto"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* PTE Navigation wizard */}
                            <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
                                <button
                                    type="button"
                                    disabled={activePart === 1 || isRecording || isSaving || isUploading}
                                    onClick={() => setActivePart(prev => prev - 1)}
                                    className="btn btn-ghost border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl px-4 h-10 font-bold text-xs uppercase"
                                >
                                    ← Back
                                </button>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            disabled={isRecording || isSaving || isUploading}
                                            onClick={() => setActivePart(p)}
                                            className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                                                p === activePart
                                                    ? "bg-primary scale-125 ring-4 ring-primary/20"
                                                    : (p === 1 && part1Urls[0]) || (p === 2 && part2Url) || (p === 3 && part3Urls[0])
                                                    ? "bg-success"
                                                    : "bg-slate-200 hover:bg-slate-300"
                                            }`}
                                        />
                                    ))}
                                </div>
                                {activePart < 3 ? (
                                    <button
                                        type="button"
                                        disabled={isRecording || isSaving || isUploading}
                                        onClick={() => setActivePart(prev => prev + 1)}
                                        className="btn btn-ghost border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl px-4 h-10 font-bold text-xs uppercase"
                                    >
                                        Next →
                                    </button>
                                ) : (
                                    <span className="text-xs font-bold text-slate-400">Final Question</span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {activePart === 1 && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <h2 className="text-2xl font-black text-slate-800">Part 1: Introduction & Interview</h2>
                                        <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl uppercase tracking-widest shrink-0">
                                            Q {part1QuestionIdx + 1} of {part1Questions.length}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold mt-2">
                                        Answer the question naturally. Speak for up to 40 seconds. Once recorded, you cannot re-record.
                                    </p>

                                    <div className="p-8 bg-slate-50 border-2 border-primary/20 rounded-[2rem] flex gap-5 items-start shadow-md">
                                        <span className="w-10 h-10 rounded-2xl bg-primary text-white font-black flex items-center justify-center shrink-0 text-lg shadow-md shadow-primary/20">
                                            {part1QuestionIdx + 1}
                                        </span>
                                        <p className="text-xl font-bold text-slate-800 leading-relaxed pt-0.5">
                                            {part1Questions[part1QuestionIdx]}
                                        </p>
                                    </div>

                                    {data?.speakingPart1AudioUrls?.[part1QuestionIdx] && (
                                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-4">
                                            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider shrink-0">
                                                <PiSpeakerHighFill className="w-4 h-4" />
                                                <span>Examiner Audio:</span>
                                            </div>
                                            <audio
                                                src={data.speakingPart1AudioUrls[part1QuestionIdx]}
                                                controls
                                                className="h-8 flex-1 max-w-md"
                                            />
                                        </div>
                                    )}

                                    {/* Question Nav Dots & Arrows */}
                                    <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
                                        <button
                                            type="button"
                                            disabled={part1QuestionIdx === 0 || isRecording || isSaving || isUploading}
                                            onClick={() => setPart1QuestionIdx(prev => prev - 1)}
                                            className="btn btn-ghost border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl px-4 h-10 font-bold text-xs uppercase"
                                        >
                                            ← Back
                                        </button>
                                        <div className="flex items-center gap-2">
                                            {part1Questions.map((_, idx) => {
                                                const isRecorded = !!part1Urls[idx];
                                                const isActive = idx === part1QuestionIdx;
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        disabled={isRecording || isSaving || isUploading}
                                                        onClick={() => setPart1QuestionIdx(idx)}
                                                        className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                                                            isActive
                                                                ? "bg-primary scale-125 ring-4 ring-primary/20"
                                                                : isRecorded
                                                                ? "bg-success"
                                                                : "bg-slate-200 hover:bg-slate-300"
                                                        }`}
                                                        title={`Question ${idx + 1}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                        {part1QuestionIdx === part1Questions.length - 1 ? (
                                            <button
                                                type="button"
                                                disabled={isRecording || isSaving || isUploading}
                                                onClick={() => setActivePart(2)}
                                                className="btn btn-primary rounded-xl px-4 h-10 font-bold text-xs uppercase text-white shadow-md shadow-primary/20"
                                            >
                                                Next Part →
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={isRecording || isSaving || isUploading}
                                                onClick={() => setPart1QuestionIdx(prev => prev + 1)}
                                                className="btn btn-ghost border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl px-4 h-10 font-bold text-xs uppercase"
                                            >
                                                Next →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activePart === 2 && (
                                <div className="space-y-6">
                                    <div className="border-b pb-4">
                                        <h2 className="text-2xl font-black text-slate-800">Part 2: Long Turn (Cue Card)</h2>
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold mt-2">
                                        Speak for 1 to 2 minutes on the cue card topic. Once recorded, you cannot re-record.
                                    </p>

                                    {/* Cue Card Display */}
                                    <div className="card bg-white border-2 p-10 rounded-[3rem] shadow-xl">
                                        <div className="space-y-6">
                                            <h3 className="text-xl font-bold border-b border-base-200 pb-4 text-slate-800">
                                                {data?.speakingPrompt || data?.question || "Describe a historical building you have visited."}
                                            </h3>
                                            <div className="space-y-3">
                                                <p className="font-bold text-base-content/40 uppercase tracking-widest text-xs">You should say:</p>
                                                <div className="prose prose-lg text-slate-600 font-medium whitespace-pre-line leading-relaxed">
                                                    {data?.passage || "• Where the building is\n• What it looks like\n• Why it is famous\n• And explain why you chose to visit it."}
                                                </div>
                                            </div>

                                            {data?.speakingPart2AudioUrl && (
                                                <div className="pt-4 border-t border-slate-200 flex items-center gap-4">
                                                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider shrink-0">
                                                        <PiSpeakerHighFill className="w-4 h-4" />
                                                        <span>Examiner Audio:</span>
                                                    </div>
                                                    <audio
                                                        src={data.speakingPart2AudioUrl}
                                                        controls
                                                        className="h-8 flex-1 max-w-md"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Question Nav Dots & Arrows */}
                                    <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
                                        <button
                                            type="button"
                                            disabled={isRecording || isSaving || isUploading}
                                            onClick={() => setActivePart(1)}
                                            className="btn btn-ghost border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl px-4 h-10 font-bold text-xs uppercase"
                                        >
                                            ← Back
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400">Part 2 of 3</span>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={isRecording || isSaving || isUploading}
                                            onClick={() => setActivePart(3)}
                                            className="btn btn-primary rounded-xl px-4 h-10 font-bold text-xs uppercase text-white shadow-md shadow-primary/20"
                                        >
                                            Next Part →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activePart === 3 && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <h2 className="text-2xl font-black text-slate-800">Part 3: Two-way Discussion</h2>
                                        <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl uppercase tracking-widest shrink-0">
                                            Q {part3QuestionIdx + 1} of {part3Questions.length}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold mt-2">
                                        Answer the question in detail. Speak for up to 50 seconds. Once recorded, you cannot re-record.
                                    </p>

                                    <div className="p-8 bg-slate-50 border-2 border-primary/20 rounded-[2rem] flex gap-5 items-start shadow-md">
                                        <span className="w-10 h-10 rounded-2xl bg-primary text-white font-black flex items-center justify-center shrink-0 text-lg shadow-md shadow-primary/20">
                                            {part3QuestionIdx + 1}
                                        </span>
                                        <p className="text-xl font-bold text-slate-800 leading-relaxed pt-0.5">
                                            {part3Questions[part3QuestionIdx]}
                                        </p>
                                    </div>

                                    {data?.speakingPart3AudioUrls?.[part3QuestionIdx] && (
                                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-4">
                                            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider shrink-0">
                                                <PiSpeakerHighFill className="w-4 h-4" />
                                                <span>Examiner Audio:</span>
                                            </div>
                                            <audio
                                                src={data.speakingPart3AudioUrls[part3QuestionIdx]}
                                                controls
                                                className="h-8 flex-1 max-w-md"
                                            />
                                        </div>
                                    )}

                                    {/* Question Nav Dots & Arrows */}
                                    <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
                                        <button
                                            type="button"
                                            disabled={part3QuestionIdx === 0 || isRecording || isSaving || isUploading}
                                            onClick={() => setPart3QuestionIdx(prev => prev - 1)}
                                            className="btn btn-ghost border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl px-4 h-10 font-bold text-xs uppercase"
                                        >
                                            ← Back
                                        </button>
                                        <div className="flex items-center gap-2">
                                            {part3Questions.map((_, idx) => {
                                                const isRecorded = !!part3Urls[idx];
                                                const isActive = idx === part3QuestionIdx;
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        disabled={isRecording || isSaving || isUploading}
                                                        onClick={() => setPart3QuestionIdx(idx)}
                                                        className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                                                            isActive
                                                                ? "bg-primary scale-125 ring-4 ring-primary/20"
                                                                : isRecorded
                                                                ? "bg-success"
                                                                : "bg-slate-200 hover:bg-slate-300"
                                                        }`}
                                                        title={`Question ${idx + 1}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                        <button
                                            type="button"
                                            disabled={part3QuestionIdx === part3Questions.length - 1 || isRecording || isSaving || isUploading}
                                            onClick={() => setPart3QuestionIdx(prev => prev + 1)}
                                            className="btn btn-ghost border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl px-4 h-10 font-bold text-xs uppercase"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right side of right pane: Audio Studio */}
                <div className="w-full lg:w-80 shrink-0 space-y-6">
                    <div className="card bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl text-slate-800">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div>
                                    <h3 className="text-lg font-black tracking-tight text-slate-800">Audio Studio</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                        {studioSubtitle}
                                    </p>
                                </div>
                                <PiWaveformFill className={`text-2xl text-primary ${isRecording ? "animate-pulse" : ""}`} />
                            </div>

                            {/* State renders */}
                            {isPrepActive ? (
                                <div className="flex flex-col items-center text-center space-y-6 py-6">
                                    <div className="w-28 h-28 rounded-full border-4 border-red-500 border-t-transparent animate-spin flex items-center justify-center p-1.5">
                                        <div className="w-full h-full rounded-full bg-red-500/10 flex items-center justify-center">
                                            <span className="text-2xl font-black font-mono text-red-500">
                                                {prepTime}s
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-lg font-black text-slate-800">Preparation Phase</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organize your thoughts</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={startRecording}
                                        className="btn btn-primary rounded-xl px-6 h-12 font-black w-full"
                                    >
                                        Skip Prep & Record
                                    </button>
                                </div>
                            ) : isRecording ? (
                                <div className="flex flex-col items-center text-center space-y-6 py-6">
                                    <div className="relative">
                                        <div className="w-32 h-32 rounded-full bg-red-500/10 flex items-center justify-center">
                                            <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white text-4xl shadow-lg shadow-red-500/20">
                                                <PiMicrophoneFill />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 w-full">
                                        <div className="w-full flex justify-center py-1">
                                            <canvas
                                                ref={canvasCallback}
                                                width={240}
                                                height={60}
                                                className="bg-slate-50 rounded-2xl border border-slate-200 shadow-inner"
                                            />
                                        </div>
                                        <div className="text-4xl font-mono font-black text-slate-800">
                                            {formatTime(Math.max(0, maxRecordingTime - recordingTime))}
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-wider text-red-500 animate-pulse">
                                            Capturing Voice...
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={stopRecording}
                                        className="btn btn-error btn-outline rounded-xl px-6 h-14 font-black w-full border-2"
                                    >
                                        <PiStopCircleFill className="text-lg" /> Stop Recording
                                    </button>
                                </div>
                            ) : isSaving || isUploading ? (
                                <div className="flex flex-col items-center text-center space-y-4 py-12 w-full">
                                    <span className="loading loading-spinner loading-lg text-primary" />
                                    <div className="space-y-1">
                                        <h4 className="text-lg font-black text-slate-800">Uploading Audio...</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                                            Processing & Saving to cloud
                                        </p>
                                    </div>
                                </div>
                            ) : activeAudioUrl ? (
                                <div className="flex flex-col items-center text-center space-y-6 py-6">
                                    <div className="w-24 h-24 rounded-full bg-success/10 border border-success/20 flex items-center justify-center text-4xl text-success shadow-md shadow-success/10">
                                        <PiCheckCircleFill />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-lg font-black text-slate-800">Response Captured</h4>
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                            Review your recording below.
                                        </p>
                                    </div>

                                    <div className="w-full">
                                        <audio src={activeAudioUrl} controls className="w-full rounded-xl border border-slate-200 shadow-sm" key={activeAudioUrl} />
                                    </div>

                                    <div className="text-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                                            Recording Finalized
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-center space-y-6 py-6">
                                    <div className="w-24 h-24 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-4xl text-slate-400">
                                        <PiMicrophoneFill />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-lg font-black text-slate-800">
                                            {examType === "PTE" ? (
                                                activePart === 1 ? "Read Aloud" :
                                                activePart === 2 ? "Repeat Sentence" :
                                                "Describe Image"
                                            ) : (
                                                activePart === 2 ? "Record Cue Card" : "Record Response"
                                            )}
                                        </h4>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-relaxed">
                                            {examType === "PTE" ? (
                                                activePart === 1 ? "Prepare, then read the text aloud." :
                                                activePart === 2 ? "Listen first, then repeat exactly." :
                                                "Analyze the image, then describe it."
                                            ) : (
                                                activePart === 2
                                                    ? "Prepare for 60s or start speaking."
                                                    : `Speak for up to ${activePart === 1 ? 40 : 50} seconds.`
                                            )}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 w-full gap-3">
                                        {examType !== "PTE" && activePart === 2 ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={startPrep}
                                                    className="btn btn-primary rounded-xl h-14 font-black text-xs uppercase"
                                                >
                                                    Start Prep Time
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={startRecording}
                                                    className="btn btn-ghost rounded-xl h-12 font-black text-xs uppercase border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                >
                                                    Record Immediately
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={startRecording}
                                                disabled={isPlayingPteAudio}
                                                className="btn btn-primary rounded-xl h-14 font-black text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isPlayingPteAudio ? "Listening..." : "Start Recording"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Examiner Widget */}
                    <div className="card bg-primary p-6 rounded-[2rem] text-white flex flex-row items-center gap-4 shadow-xl shadow-primary/10">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-2xl backdrop-blur-md shrink-0">
                            <PiUserCircleFill />
                        </div>
                        <div>
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-0.5">
                                {examType === "PTE" ? "PTE Guidelines" : "Examiner Hint"}
                            </h4>
                            <p className="text-xs font-black leading-tight italic">
                                {examType === "PTE" ? (
                                    activePart === 1 ? '"Read fluently and without pause. Pronounce words clearly."' :
                                    activePart === 2 ? '"Focus on the sequence of words and mimic the speaker\'s intonation."' :
                                    '"Focus on key features, high/low points, and describe them logically."'
                                ) : (
                                    activePart === 1
                                        ? '"Speak naturally and give detailed answers. Avoid single-word responses."'
                                        : activePart === 2
                                        ? '"Try to talk for the full two minutes. Cover every bullet point on the card."'
                                        : '"Showcase your advanced vocabulary and expand on complex topics in detail."'
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpeakingSection;
