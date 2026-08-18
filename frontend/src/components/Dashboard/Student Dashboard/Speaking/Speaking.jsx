import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import useAxiosSecure from "../../../../hooks/useAxiosSecure.jsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAuth from "../../../../hooks/useAuth.jsx";
import useUserProfile from "../../../../hooks/useUserProfile.jsx";
import useTestIntegrity from "../../../../hooks/useTestIntegrity.jsx";
import { toast } from "react-toastify";
import alerts from "../../../../utils/alerts";
import Swal from "sweetalert2";
import Loader from "../../../Loader/Loader.jsx";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import TestShell from "../../../Common/TestShell.jsx";
import PracticeSetSelector from "../../../Common/PracticeSetSelector.jsx";

import BookingModal from "./components/BookingModal.jsx";
import AudioStudio from "./components/AudioStudio.jsx";
import IeltsSpeakingSection from "./components/IeltsSpeakingSection.jsx";
import PteSpeakingSection from "./components/PteSpeakingSection.jsx";

const defaultPart1Questions = [
  "Do you work or study?",
  "What do you like most about your home town?",
  "How do you usually spend your weekends?",
  "What is your favorite type of music or movie?"
];

const defaultPart3Questions = [
  "Why do you think protecting historic structures or old buildings is important?",
  "How do buildings of the past differ from modern architectural designs?",
  "What kind of buildings or homes do you think people will live in in the future?"
];

const Speaking = ({ preloadedSet = null, onSubmitGuest = null }) => {
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userData } = useUserProfile();

  const { data: fetchedSpeakingSets = [], isLoading: queryLoading } = useQuery({
    queryKey: ["speaking-sets"],
    queryFn: async () => {
      const response = await axiosSecure.get("/questions?type=speaking");
      return response?.data?.questions || [];
    },
    enabled: !!user?.email && !preloadedSet,
    staleTime: 5 * 60 * 1000,
  });

  const speakingSets = preloadedSet ? [preloadedSet] : fetchedSpeakingSets;
  const loading = preloadedSet ? false : queryLoading;

  // Booking UI States
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [studentNotes, setStudentNotes] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Fetch Student's Booked Sessions
  const { data: bookingsData = {}, refetch: refetchBookings } = useQuery({
    queryKey: ["student-bookings"],
    queryFn: async () => {
      const res = await axiosSecure.get("/bookings/student/bookings");
      return res.data;
    },
    enabled: !!user?.email && userData?.plan !== "free",
  });
  const bookedSessions = (bookingsData.bookings || []).filter(session => session.status === "booked");

  // Fetch Available Slots
  const { data: availableSlotsData = {}, refetch: refetchAvailableSlots } = useQuery({
    queryKey: ["available-slots"],
    queryFn: async () => {
      const res = await axiosSecure.get("/bookings/slots/available");
      return res.data;
    },
    enabled: !!user?.email && userData?.plan !== "free",
  });
  const availableSlots = availableSlotsData.slots || [];

  const handleConfirmBooking = async () => {
    if (!selectedSlotId) {
      toast.error("Please select a time slot.");
      return;
    }
    setIsSubmittingBooking(true);
    try {
      await axiosSecure.post(`/bookings/slots/${selectedSlotId}/book`, { studentNotes });
      toast.success("Successfully booked session with instructor!");
      setShowBookingModal(false);
      setSelectedSlotId("");
      setStudentNotes("");
      refetchBookings();
      refetchAvailableSlots();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to book session.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    Swal.fire({
      title: "Cancel Booking?",
      text: "Are you sure you want to cancel this mock speaking session booking?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel Booking",
      cancelButtonText: "No, Keep Booked",
      background: "#ffffff",
      customClass: {
        container: "z-[99999]",
        popup: "rounded-[2rem] shadow-2xl border border-slate-100",
        confirmButton: "rounded-xl px-8 py-3 font-bold btn btn-error text-white border-none mx-2",
        cancelButton: "rounded-xl px-8 py-3 font-bold btn btn-ghost text-slate-500 mx-2 hover:bg-slate-50"
      },
      buttonsStyling: false
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axiosSecure.post(`/bookings/slots/${bookingId}/cancel`);
          toast.success("Booking cancelled successfully.");
          refetchBookings();
          refetchAvailableSlots();
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to cancel booking.");
        }
      }
    });
  };

  const [selectedSetId, setSelectedSetId] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [prepTime, setPrepTime] = useState(60); // 1 min prep
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPrepPhase, setIsPrepPhase] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);

  // 3-Part Speaking States
  const [speakingStep, setSpeakingStep] = useState(1);
  const [part1Blobs, setPart1Blobs] = useState([]);
  const [part2Blob, setPart2Blob] = useState(null);
  const [part3Blobs, setPart3Blobs] = useState([]);

  const [part1QuestionIdx, setPart1QuestionIdx] = useState(0);
  const [part3QuestionIdx, setPart3QuestionIdx] = useState(0);

  const part1QuestionIdxRef = useRef(0);
  const part3QuestionIdxRef = useRef(0);

  // PTE Speaking States
  const [pteQuestionIdx, setPteQuestionIdx] = useState(0);
  const [pteBlobs, setPteBlobs] = useState([]);
  const pteQuestionIdxRef = useRef(0);
  const pteBlobsRef = useRef([]);
  const [isPlayingPteAudio, setIsPlayingPteAudio] = useState(false);

  useEffect(() => {
    part1QuestionIdxRef.current = part1QuestionIdx;
  }, [part1QuestionIdx]);

  useEffect(() => {
    part3QuestionIdxRef.current = part3QuestionIdx;
  }, [part3QuestionIdx]);

  useEffect(() => {
    pteQuestionIdxRef.current = pteQuestionIdx;
  }, [pteQuestionIdx]);

  const part1BlobsRef = useRef([]);
  const part2BlobRef = useRef(null);
  const part3BlobsRef = useRef([]);
  const audioBlobRef = useRef(null);

  const playPteAudio = (text) => {
    if (!text) return;
    if (isPlayingPteAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingPteAudio(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsPlayingPteAudio(true);
    utterance.onend = () => setIsPlayingPteAudio(false);
    utterance.onerror = () => setIsPlayingPteAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [pteQuestionIdx]);

  const setPart1BlobsWithRef = (valOrFn) => {
    if (typeof valOrFn === "function") {
      setPart1Blobs((prev) => {
        const next = valOrFn(prev);
        part1BlobsRef.current = next;
        return next;
      });
    } else {
      part1BlobsRef.current = valOrFn;
      setPart1Blobs(valOrFn);
    }
  };
  const setPart2BlobWithRef = (blob) => {
    part2BlobRef.current = blob;
    setPart2Blob(blob);
  };
  const setPart3BlobsWithRef = (valOrFn) => {
    if (typeof valOrFn === "function") {
      setPart3Blobs((prev) => {
        const next = valOrFn(prev);
        part3BlobsRef.current = next;
        return next;
      });
    } else {
      part3BlobsRef.current = valOrFn;
      setPart3Blobs(valOrFn);
    }
  };
  const setPteBlobsWithRef = (valOrFn) => {
    if (typeof valOrFn === "function") {
      setPteBlobs((prev) => {
        const next = valOrFn(prev);
        pteBlobsRef.current = next;
        return next;
      });
    } else {
      pteBlobsRef.current = valOrFn;
      setPteBlobs(valOrFn);
    }
  };
  const setAudioBlobWithRef = (blob) => {
    audioBlobRef.current = blob;
  };

  // Fullscreen & Gating States
  const [isStarted, setIsStarted] = useState(false);
  const { showWarning, setShowWarning, enterFullscreen, exitFullscreen } = useTestIntegrity(isStarted, submitted);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const visualizerCleanupRef = useRef(null);
  const recordingTimeRef = useRef(0);

  useEffect(() => {
    recordingTimeRef.current = recordingTime;
  }, [recordingTime]);

  const activeSet = useMemo(
    () => preloadedSet || speakingSets.find((set) => set._id === selectedSetId) || null,
    [preloadedSet, speakingSets, selectedSetId],
  );

  const part1Questions = useMemo(() => {
    return activeSet?.speakingPart1Questions && activeSet.speakingPart1Questions.length > 0
      ? activeSet.speakingPart1Questions
      : defaultPart1Questions;
  }, [activeSet]);

  const part3Questions = useMemo(() => {
    return activeSet?.speakingPart3Questions && activeSet.speakingPart3Questions.length > 0
      ? activeSet.speakingPart3Questions
      : defaultPart3Questions;
  }, [activeSet]);

  const activeBlob = useMemo(() => {
    if (activeSet?.examType === "PTE") {
      return pteBlobs[pteQuestionIdx] || null;
    }
    if (speakingStep === 1) return part1Blobs[part1QuestionIdx] || null;
    if (speakingStep === 2) return part2Blob;
    if (speakingStep === 3) return part3Blobs[part3QuestionIdx] || null;
    return null;
  }, [speakingStep, part1Blobs, part1QuestionIdx, part2Blob, part3Blobs, part3QuestionIdx, pteBlobs, pteQuestionIdx, activeSet]);

  const activeAudioUrl = useMemo(() => {
    if (!activeBlob) return null;
    return URL.createObjectURL(activeBlob);
  }, [activeBlob]);

  useEffect(() => {
    return () => {
      if (activeAudioUrl) {
        URL.revokeObjectURL(activeAudioUrl);
      }
    };
  }, [activeAudioUrl]);

  const studioSubtitle = useMemo(() => {
    if (activeSet?.examType === "PTE") {
      const q = activeSet.questions?.[pteQuestionIdx];
      const typeStr = q?.type === "pte-read-aloud" ? "Read Aloud"
                    : q?.type === "pte-repeat-sentence" ? "Repeat Sentence"
                    : q?.type === "pte-describe-image" ? "Describe Image"
                    : q?.type === "pte-retell-lecture" ? "Retell Lecture"
                    : q?.type === "pte-answer-short-question" ? "Answer Short Question"
                    : "Speaking Task";
      return `${typeStr} • Question ${pteQuestionIdx + 1} of ${activeSet.questions?.length}`;
    }
    if (speakingStep === 1) return `Part 1 of 3 • Question ${part1QuestionIdx + 1} of ${part1Questions.length}`;
    if (speakingStep === 3) return `Part 3 of 3 • Question ${part3QuestionIdx + 1} of ${part3Questions.length}`;
    return "Part 2 of 3 • Cue Card Response";
  }, [speakingStep, part1QuestionIdx, part1Questions, part3QuestionIdx, part3Questions, pteQuestionIdx, activeSet]);

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
    [mediaStream],
  );

  useEffect(() => {
    return () => {
      if (visualizerCleanupRef.current) {
        visualizerCleanupRef.current();
      }
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRecordingTime(0);
      setAudioBlobWithRef(null);
      setIsRecording(false);
      setIsSaving(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [speakingStep, part1QuestionIdx, part3QuestionIdx, pteQuestionIdx]);

  useEffect(() => {
    if (activeSet) {
      if (activeSet.examType === "PTE") {
        const len = activeSet.questions?.length || 0;
        setPteBlobs(new Array(len).fill(null));
        pteBlobsRef.current = new Array(len).fill(null);
        setPteQuestionIdx(0);
      } else {
        const p1Len = part1Questions.length;
        setPart1Blobs(new Array(p1Len).fill(null));
        part1BlobsRef.current = new Array(p1Len).fill(null);

        const p3Len = part3Questions.length;
        setPart3Blobs(new Array(p3Len).fill(null));
        part3BlobsRef.current = new Array(p3Len).fill(null);

        setPart1QuestionIdx(0);
        setPart3QuestionIdx(0);
      }
    }
  }, [activeSet, part1Questions, part3Questions]);

  const startRecording = useCallback(async () => {
    if (isRecording || isSaving || isPlayingPteAudio) return;

    if (activeSet?.examType === "PTE") {
      if (pteBlobsRef.current[pteQuestionIdxRef.current]) {
        toast.error("You have already recorded a response for this question.");
        return;
      }
    } else {
      if (speakingStep === 1 && part1BlobsRef.current[part1QuestionIdxRef.current]) {
        toast.error("You have already recorded a response for this question.");
        return;
      }
      if (speakingStep === 2 && part2BlobRef.current) {
        toast.error("You have already recorded a response for this part.");
        return;
      }
      if (speakingStep === 3 && part3BlobsRef.current[part3QuestionIdxRef.current]) {
        toast.error("You have already recorded a response for this question.");
        return;
      }
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

      mediaRecorderRef.current.onstop = () => {
        try {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          if (blob.size > 100) {
            if (activeSet?.examType === "PTE") {
              setPteBlobsWithRef((prev) => {
                const updated = prev ? [...prev] : [];
                updated[pteQuestionIdxRef.current] = blob;
                return updated;
              });
            } else if (speakingStep === 1) {
              setPart1BlobsWithRef((prev) => {
                const updated = prev ? [...prev] : [];
                updated[part1QuestionIdxRef.current] = blob;
                return updated;
              });
            } else if (speakingStep === 2) {
              setPart2BlobWithRef(blob);
            } else if (speakingStep === 3) {
              setPart3BlobsWithRef((prev) => {
                const updated = prev ? [...prev] : [];
                updated[part3QuestionIdxRef.current] = blob;
                return updated;
              });
            }
            setAudioBlobWithRef(blob);
          }
        } catch (err) {
          console.error("Recording error:", err);
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
      setIsPrepPhase(false);
      setRecordingTime(0);
      toast.success("Recording Started! Speak clearly.");
    } catch (err) {
      console.error("Microphone access failed:", err);
      toast.error("Microphone access denied. Please enable it to record.");
    }
  }, [speakingStep, isRecording, isSaving, isPlayingPteAudio, activeSet]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && mediaRecorderRef.current.state !== "inactive") {
      try {
        setIsSaving(true);
        setIsRecording(false);
        mediaRecorderRef.current.stop();
        toast.info("Recording captured. Ready for submission. Please submit your response.");
      } catch (err) {
        console.error("Failed to stop recorder:", err);
        setIsSaving(false);
        setIsRecording(false);
      }
    }
  }, [isRecording]);

  const startPrep = () => {
    setIsPrepPhase(true);
    setPrepTime(60);
    toast.info("1-Minute Preparation Time Started");
  };

  useEffect(() => {
    if (speakingStep === 2 && activeSet?.examType !== "PTE" && !part2Blob && !isPrepPhase && !isRecording && !isSaving && !isUploading) {
      startPrep();
    }
  }, [speakingStep, activeSet?.examType, part2Blob, isPrepPhase, isRecording, isSaving, isUploading]);

  useEffect(() => {
    if (!isPrepPhase) return;

    const iv = setInterval(() => {
      setPrepTime((prev) => {
        if (prev <= 1) {
          clearInterval(iv);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(iv);
  }, [isPrepPhase]);

  useEffect(() => {
    if (isPrepPhase && prepTime === 0) {
      const timer = setTimeout(() => {
        setIsPrepPhase(false);
        startRecording();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isPrepPhase, prepTime, startRecording]);

  useEffect(() => {
    if (!isRecording) return;
    const iv = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    return () => clearInterval(iv);
  }, [isRecording]);

  const maxRecordingTime = useMemo(() => {
    if (activeSet?.examType === "PTE") {
      const q = activeSet.questions?.[pteQuestionIdx];
      if (q?.type === "pte-read-aloud") return 40;
      if (q?.type === "pte-repeat-sentence") return 15;
      if (q?.type === "pte-describe-image") return 40;
      if (q?.type === "pte-retell-lecture") return 40;
      if (q?.type === "pte-answer-short-question") return 10;
      return 40;
    }
    if (speakingStep === 1) return 40;
    if (speakingStep === 3) return 50;
    return 120;
  }, [speakingStep, pteQuestionIdx, activeSet]);

  useEffect(() => {
    if (isRecording && recordingTime >= maxRecordingTime) {
      const timer = setTimeout(() => {
        stopRecording();
        toast.info(`Maximum speaking time (${maxRecordingTime} seconds) reached. Recording stopped.`);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [recordingTime, isRecording, maxRecordingTime, stopRecording]);

  useEffect(() => {
    if (isPrepPhase && prepTime === 10) {
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
  }, [prepTime, isPrepPhase]);

  const uploadToCloudinary = async (blob, filename, _retryCount = 0) => {
    const MAX_RETRIES = 3;
    try {
      const signatureRes = await axiosSecure.get('/submissions/upload-signature');
      const { signature, timestamp, folder, apiKey, cloudName } = signatureRes.data;

      const formData = new FormData();
      formData.append("file", blob, filename);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", folder);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        formData,
      );

      return response.data.secure_url;
    } catch (err) {
      if (_retryCount < MAX_RETRIES) {
        const delay = Math.pow(2, _retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return uploadToCloudinary(blob, filename, _retryCount + 1);
      }
      throw err;
    }
  };

  const handleSubmitSpeaking = async () => {
    const p1s = part1BlobsRef.current;
    const p2 = part2BlobRef.current;
    const p3s = part3BlobsRef.current;
    const pteBlobsVal = pteBlobsRef.current;
    const ab = audioBlobRef.current;

    const hasPart1Recording = p1s.some(blob => blob !== null && blob !== undefined);
    const hasPart3Recording = p3s.some(blob => blob !== null && blob !== undefined);
    const hasPteRecording = pteBlobsVal.some(blob => blob !== null && blob !== undefined);
    const hasRecording = hasPart1Recording || p2 || hasPart3Recording || hasPteRecording || ab;

    if (!hasRecording) {
      toast.info("No audio recording captured. Please Submit your response.");
      return;
    }

    try {
      setIsUploading(true);
      toast.info("Auto-submitting your speaking responses...");

      const urls = [];
      const username = userData?.name || user?.displayName || user?.email?.split('@')[0] || "guest";
      const sanitizedUser = username.replace(/[^a-zA-Z0-9]/g, "_");
      const dateStr = new Date().toISOString().split("T")[0];
      const testId = activeSet._id;

      if (activeSet?.examType === "PTE") {
        toast.info("Uploading PTE Speaking responses...");
        urls.push("--- PTE Speaking ---");
        for (let i = 0; i < activeSet.questions.length; i++) {
          const blob = pteBlobsVal[i];
          if (blob) {
            toast.info(`Uploading PTE Q${i + 1} response...`);
            const filename = `${sanitizedUser}_${dateStr}_${testId}_pte_q${i + 1}.webm`;
            const url = await uploadToCloudinary(blob, filename);
            urls.push(`Q${i + 1} [Type: ${activeSet.questions[i].type}]: ${activeSet.questions[i].question}\nAnswer: ${url}`);
          }
        }
      } else {
        if (hasPart1Recording) {
          toast.info("Uploading Part 1 responses...");
          urls.push("--- Part 1 Interview ---");
          for (let i = 0; i < part1Questions.length; i++) {
            const blob = p1s[i];
            if (blob) {
              toast.info(`Uploading Part 1 Q${i + 1} response...`);
              const filename = `${sanitizedUser}_${dateStr}_${testId}_part1_q${i + 1}.webm`;
              const url = await uploadToCloudinary(blob, filename);
              urls.push(`Q${i + 1}: ${part1Questions[i]}\nAnswer: ${url}`);
            }
          }
        }

        if (p2) {
          toast.info("Uploading Part 2 response...");
          urls.push("--- Part 2 Cue Card ---");
          const filename = `${sanitizedUser}_${dateStr}_${testId}_part2.webm`;
          const url2 = await uploadToCloudinary(p2, filename);
          urls.push(`Cue Card: ${activeSet.speakingPrompt || activeSet.passage || activeSet.content}\nAnswer: ${url2}`);
        } else if (ab && !p2 && !hasPart1Recording && !hasPart3Recording) {
          toast.info("Uploading Cue Card response...");
          urls.push("--- Part 2 Cue Card ---");
          const filename = `${sanitizedUser}_${dateStr}_${testId}_part2.webm`;
          const url2 = await uploadToCloudinary(ab, filename);
          urls.push(`Answer: ${url2}`);
        }

        if (hasPart3Recording) {
          toast.info("Uploading Part 3 responses...");
          urls.push("--- Part 3 Discussion ---");
          for (let i = 0; i < part3Questions.length; i++) {
            const blob = p3s[i];
            if (blob) {
              toast.info(`Uploading Part 3 Q${i + 1} response...`);
              const filename = `${sanitizedUser}_${dateStr}_${testId}_part3_q${i + 1}.webm`;
              const url = await uploadToCloudinary(blob, filename);
              urls.push(`Q${i + 1}: ${part3Questions[i]}\nAnswer: ${url}`);
            }
          }
        }
      }

      const combinedContent = urls.join("\n\n");

      if (onSubmitGuest && !user?.email) {
        onSubmitGuest(combinedContent);
        toast.success("Guest test submitted successfully!");
        setSubmitted(true);
        exitFullscreen();
        setIsStarted(false);
        navigate(-1);
        return;
      }

      const MAX_SUBMIT_RETRIES = 3;
      let lastErr;
      for (let attempt = 0; attempt <= MAX_SUBMIT_RETRIES; attempt++) {
        try {
          await axiosSecure.post("/submissions/submit", {
            questionSetId: activeSet._id,
            testType: "speaking",
            title: activeSet.title,
            content: combinedContent,
            userName: userData?.name || user?.displayName || user?.email?.split('@')[0] || "Student",
            userEmail: user?.email,
          });
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          if (err?.response?.status === 429 && attempt < MAX_SUBMIT_RETRIES) {
            await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
          } else {
            throw err;
          }
        }
      }
      if (lastErr) throw lastErr;

      toast.success("Speaking practice test submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["user-lab-results"] });
      setSubmitted(true);
      exitFullscreen();
      setIsStarted(false);
      navigate(-1);
    } catch (e) {
      console.error("Submission failed:", e);
      toast.error("Failed to submit speaking response.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleExitTest = async () => {
    if (submitted) {
      exitFullscreen();
      setIsStarted(false);
      navigate(-1);
      return;
    }

    const hasPart1Recording = part1BlobsRef.current.some(blob => blob !== null && blob !== undefined);
    const hasPart3Recording = part3BlobsRef.current.some(blob => blob !== null && blob !== undefined);
    const hasPteRecording = pteBlobsRef.current.some(blob => blob !== null && blob !== undefined);
    const hasRecording = hasPart1Recording || part2BlobRef.current || hasPart3Recording || hasPteRecording || audioBlobRef.current || (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive");
    
    const result = hasRecording
      ? await alerts.confirmExitPractice("Speaking Practice Interview")
      : await alerts.confirmCancelPractice("Speaking Practice Interview");

    if (result.isConfirmed) {
      if (hasRecording) {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          try {
            setIsSaving(true);
            mediaRecorderRef.current.stop();
          } catch (err) {
            console.error("Failed to stop media recorder on exit:", err);
            setIsSaving(false);
          }
          setTimeout(async () => {
            await handleSubmitSpeaking();
          }, 600);
        } else {
          await handleSubmitSpeaking();
        }
      } else {
        exitFullscreen();
        setIsStarted(false);
        toast.info("No recording captured. Exiting practice.");
        navigate(-1);
      }
    } else if (result.isDenied) {
      exitFullscreen();
      setIsStarted(false);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch (err) {
          console.error("Failed to stop media recorder on cancel:", err);
        }
      }

      setPart1BlobsWithRef([]);
      setPart2BlobWithRef(null);
      setPart3BlobsWithRef([]);
      setPteBlobsWithRef([]);
      setAudioBlobWithRef(null);

      Object.keys(localStorage).forEach((key) => {
        if (key.includes("test_cache") || key.includes("test_scratchpad") || key.includes("speaking")) {
          localStorage.removeItem(key);
        }
      });

      toast.info("Practice cancelled. Response discarded.");
      navigate(-1);
    }
  };

  const handleReturnToDashboard = () => {
    exitFullscreen();
    setIsStarted(false);
    navigate("/dashboard");
  };

  const handleRetake = () => {
    setSubmitted(false);
    setIsSaving(false);
    setIsUploading(false);
    setIsRecording(false);
    setIsPrepPhase(false);
    setPrepTime(60);
    setRecordingTime(0);

    setSpeakingStep(1);
    setPart1Blobs([]);
    setPart2Blob(null);
    setPart3Blobs([]);
    setPart1QuestionIdx(0);
    setPart3QuestionIdx(0);
    
    setPteQuestionIdx(0);
    setPteBlobs([]);
    setIsPlayingPteAudio(false);

    part1QuestionIdxRef.current = 0;
    part3QuestionIdxRef.current = 0;
    pteQuestionIdxRef.current = 0;
    pteBlobsRef.current = [];
    part1BlobsRef.current = [];
    part2BlobRef.current = null;
    part3BlobsRef.current = [];
    audioBlobRef.current = null;

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsStarted(true);
    enterFullscreen();
  };

  if (loading) return <Loader />;

  if (!isStarted && !preloadedSet) {
    return (
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <BookingModal
          showBookingModal={showBookingModal}
          setShowBookingModal={setShowBookingModal}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedSlotId={selectedSlotId}
          setSelectedSlotId={setSelectedSlotId}
          studentNotes={studentNotes}
          setStudentNotes={setStudentNotes}
          isSubmittingBooking={isSubmittingBooking}
          availableSlots={availableSlots}
          bookedSessions={bookedSessions}
          handleConfirmBooking={handleConfirmBooking}
          handleCancelBooking={handleCancelBooking}
        />

        <PracticeSetSelector
          title="Speaking Practice Laboratory"
          subtitle="Simulate official 3-part IELTS speaking interviews or PTE speech modules with real-time AI band scoring."
          sets={speakingSets}
          selectedSetId={selectedSetId}
          onSelectSet={(id) => setSelectedSetId(id)}
          onStartTest={() => {
            if (!selectedSetId) return;
            setIsStarted(true);
            enterFullscreen();
          }}
          startBtnText="Start Speaking Test"
        />
      </div>
    );
  }

  return (
    <TestShell
      title={activeSet?.title || "Speaking Practice Test"}
      onExit={handleExitTest}
      submitted={submitted}
      showWarning={showWarning}
      setShowWarning={setShowWarning}
      onReturnDashboard={handleReturnToDashboard}
      onRetakeTest={handleRetake}
    >
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-8">
            <AnimatePresence mode="wait">
              {activeSet?.examType === "PTE" ? (
                <PteSpeakingSection
                  activeSet={activeSet}
                  pteQuestionIdx={pteQuestionIdx}
                  setPteQuestionIdx={setPteQuestionIdx}
                  pteBlobs={pteBlobs}
                  playPteAudio={playPteAudio}
                  isPlayingPteAudio={isPlayingPteAudio}
                  isRecording={isRecording}
                  isSaving={isSaving}
                  isUploading={isUploading}
                  handleSubmitSpeaking={handleSubmitSpeaking}
                />
              ) : (
                <IeltsSpeakingSection
                  speakingStep={speakingStep}
                  setSpeakingStep={setSpeakingStep}
                  part1Questions={part1Questions}
                  part1QuestionIdx={part1QuestionIdx}
                  setPart1QuestionIdx={setPart1QuestionIdx}
                  part1Blobs={part1Blobs}
                  part2Blob={part2Blob}
                  part3Questions={part3Questions}
                  part3QuestionIdx={part3QuestionIdx}
                  setPart3QuestionIdx={setPart3QuestionIdx}
                  part3Blobs={part3Blobs}
                  activeSet={activeSet}
                  isRecording={isRecording}
                  isSaving={isSaving}
                  isUploading={isUploading}
                  handleSubmitSpeaking={handleSubmitSpeaking}
                />
              )}
            </AnimatePresence>
          </div>

          <AudioStudio
            studioSubtitle={studioSubtitle}
            isPrepPhase={isPrepPhase}
            prepTime={prepTime}
            startRecording={startRecording}
            isRecording={isRecording}
            maxRecordingTime={maxRecordingTime}
            recordingTime={recordingTime}
            stopRecording={stopRecording}
            canvasCallback={canvasCallback}
            isSaving={isSaving}
            activeBlob={activeBlob}
            activeAudioUrl={activeAudioUrl}
            activeSet={activeSet}
            speakingStep={speakingStep}
            part1QuestionIdx={part1QuestionIdx}
            part3QuestionIdx={part3QuestionIdx}
            pteQuestionIdx={pteQuestionIdx}
            isPlayingPteAudio={isPlayingPteAudio}
            startPrep={startPrep}
          />
        </div>
      </div>
    </TestShell>
  );
};

export default Speaking;
