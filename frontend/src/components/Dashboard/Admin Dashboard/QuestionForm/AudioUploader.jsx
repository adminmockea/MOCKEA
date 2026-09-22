import React, { useState, useRef } from "react";
import { 
    PiMicrophoneStage, 
    PiUploadSimple, 
    PiPlay, 
    PiPause, 
    PiTrash, 
    PiLink, 
    PiCheckCircle,
    PiSpeakerHigh,
    PiArrowsClockwise
} from "react-icons/pi";
import { toast } from "react-toastify";
import useAxiosSecure from "../../../../hooks/useAxiosSecure";

export default function AudioUploader({
    audioUrl = "",
    onChange,
    label = "Audio Prompt",
    compact = false,
    placeholder = "Upload or enter audio URL",
    helperText = ""
}) {
    const axiosSecure = useAxiosSecure();
    const fileInputRef = useRef(null);
    const audioRef = useRef(null);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [manualUrl, setManualUrl] = useState(audioUrl || "");
    const [isDragging, setIsDragging] = useState(false);

    // Sync manualUrl when audioUrl prop updates
    React.useEffect(() => {
        setManualUrl(audioUrl || "");
    }, [audioUrl]);

    const handleFileSelect = async (file) => {
        if (!file) return;

        const allowedExtensions = ["mp3", "wav", "m4a", "ogg", "aac", "webm", "flac"];
        const ext = file.name.split(".").pop().toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            toast.error(`Invalid file format (.${ext}). Supported: ${allowedExtensions.join(", ")}`);
            return;
        }

        // Limit size to 25MB
        if (file.size > 25 * 1024 * 1024) {
            toast.error("Audio file size must be less than 25MB");
            return;
        }

        setIsUploading(true);
        setUploadProgress(10);

        const formData = new FormData();
        formData.append("audio", file);

        try {
            const res = await axiosSecure.post("/questions/upload-audio", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(Math.min(95, percent));
                }
            });

            if (res.data.success && res.data.audioUrl) {
                setUploadProgress(100);
                onChange(res.data.audioUrl);
                toast.success(`Audio "${res.data.originalName || file.name}" uploaded successfully!`);
            } else {
                toast.error(res.data.message || "Failed to upload audio");
            }
        } catch (error) {
            console.error("Audio upload error:", error);
            toast.error(error.response?.data?.message || "Failed to upload audio to Cloudinary");
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch((err) => {
                console.error("Audio playback error:", err);
                setIsPlaying(false);
            });
        }
    };

    const formatTime = (secs) => {
        if (isNaN(secs)) return "0:00";
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const handleRemove = () => {
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
        }
        setIsPlaying(false);
        onChange("");
        setManualUrl("");
    };

    const handleManualUrlSubmit = (e) => {
        e.preventDefault();
        if (manualUrl.trim()) {
            onChange(manualUrl.trim());
            setShowUrlInput(false);
            toast.success("Audio URL updated");
        }
    };

    // Compact Mode (for individual question items in Part 1 / Part 3)
    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />

                {audioUrl ? (
                    <div className="flex items-center gap-2 bg-indigo-50/80 border border-indigo-200/80 px-3 py-1.5 rounded-xl">
                        <audio
                            ref={audioRef}
                            src={audioUrl}
                            preload="metadata"
                            onEnded={() => setIsPlaying(false)}
                            onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
                            onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
                        />
                        <button
                            type="button"
                            onClick={togglePlay}
                            className="btn btn-circle btn-xs btn-primary shadow-sm"
                            title={isPlaying ? "Pause audio" : "Play audio"}
                        >
                            {isPlaying ? <PiPause className="w-3.5 h-3.5" /> : <PiPlay className="w-3.5 h-3.5" />}
                        </button>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700">
                            <PiSpeakerHigh className="w-3.5 h-3.5" />
                            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="btn btn-ghost btn-xs text-slate-400 hover:text-primary px-1"
                            title="Replace audio file"
                        >
                            <PiArrowsClockwise className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="btn btn-ghost btn-xs text-slate-400 hover:text-error px-1"
                            title="Remove audio"
                        >
                            <PiTrash className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 rounded-xl font-bold gap-1.5"
                            title="Attach audio prompt for this question"
                        >
                            {isUploading ? (
                                <>
                                    <span className="loading loading-spinner loading-xs text-primary" />
                                    <span className="text-[11px]">Uploading ({uploadProgress}%)...</span>
                                </>
                            ) : (
                                <>
                                    <PiUploadSimple className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-[11px]">+ Audio</span>
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowUrlInput(!showUrlInput)}
                            className="btn btn-ghost btn-xs text-slate-400 hover:text-slate-600 px-1"
                            title="Paste external audio link"
                        >
                            <PiLink className="w-3.5 h-3.5" />
                        </button>
                        {showUrlInput && (
                            <div className="flex items-center gap-1">
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={manualUrl}
                                    onChange={(e) => setManualUrl(e.target.value)}
                                    className="input input-bordered input-xs rounded-lg text-[11px] w-36"
                                />
                                <button
                                    type="button"
                                    onClick={handleManualUrlSubmit}
                                    className="btn btn-primary btn-xs rounded-lg text-[10px] px-2 font-bold"
                                >
                                    Set
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Standard / Full Card Mode (for PTE Questions or IELTS Cue Card / Overall Speaking)
    return (
        <div className="space-y-2">
            {label && (
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 tracking-wide flex items-center gap-1.5">
                        <PiMicrophoneStage className="text-primary w-4 h-4" />
                        <span>{label}</span>
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="text-[11px] text-slate-400 hover:text-primary font-medium flex items-center gap-1 transition-colors"
                    >
                        <PiLink className="w-3 h-3" />
                        {showUrlInput ? "Hide Direct URL" : "Paste Direct URL"}
                    </button>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                accept="audio/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />

            {showUrlInput && (
                <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <input
                        type="url"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        placeholder="https://domain.com/path/to/prompt-audio.mp3"
                        className="input input-bordered input-sm flex-1 rounded-xl text-xs bg-white"
                    />
                    <button
                        type="button"
                        onClick={handleManualUrlSubmit}
                        className="btn btn-primary btn-sm rounded-xl text-xs font-bold px-3"
                    >
                        Apply Link
                    </button>
                </div>
            )}

            {audioUrl ? (
                <div className="bg-white border-2 border-primary/20 rounded-2xl p-3 shadow-sm space-y-2">
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        preload="metadata"
                        onEnded={() => setIsPlaying(false)}
                        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
                        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
                    />

                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={togglePlay}
                                className="btn btn-circle btn-sm btn-primary shadow-md"
                                title={isPlaying ? "Pause Preview" : "Play Preview"}
                            >
                                {isPlaying ? <PiPause className="w-4 h-4" /> : <PiPlay className="w-4 h-4" />}
                            </button>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <PiCheckCircle className="text-success w-3.5 h-3.5" />
                                    Audio Prompt Attached
                                </span>
                                <span className="text-[11px] font-mono text-slate-500">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="btn btn-ghost btn-xs text-slate-500 hover:text-primary gap-1 font-bold"
                                title="Choose a different audio file"
                            >
                                <PiArrowsClockwise className="w-3.5 h-3.5" />
                                Replace
                            </button>
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="btn btn-ghost btn-xs text-error hover:bg-error/10 gap-1 font-bold"
                                title="Remove this audio prompt"
                            >
                                <PiTrash className="w-3.5 h-3.5" />
                                Remove
                            </button>
                        </div>
                    </div>

                    {/* Progress scrubber visual */}
                    {duration > 0 && (
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-primary h-full transition-all duration-150"
                                style={{ width: `${(currentTime / duration) * 100}%` }}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 ${
                        isDragging
                            ? "border-primary bg-primary/5 scale-[1.01]"
                            : "border-slate-200 hover:border-primary/50 hover:bg-slate-50/50 bg-white"
                    } ${isUploading ? "pointer-events-none opacity-80" : ""}`}
                >
                    {isUploading ? (
                        <div className="flex flex-col items-center gap-2 py-1">
                            <span className="loading loading-spinner loading-md text-primary" />
                            <span className="text-xs font-bold text-slate-700">
                                Uploading Audio Prompt to Cloudinary ({uploadProgress}%)...
                            </span>
                            <div className="w-48 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-primary h-full transition-all duration-200"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1.5 py-1">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-1">
                                <PiUploadSimple className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-slate-700">
                                Click or drag & drop audio prompt here
                            </span>
                            <span className="text-[11px] text-slate-400">
                                Supports MP3, WAV, M4A, OGG, AAC up to 25MB
                            </span>
                        </div>
                    )}
                </div>
            )}

            {helperText && (
                <p className="text-[11px] text-slate-400 italic pl-1">{helperText}</p>
            )}
        </div>
    );
}
