import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  PiMicrophoneFill,
  PiWaveformFill,
  PiStopCircleFill,
  PiCheckCircleFill,
  PiUserCircleFill,
} from "react-icons/pi";

const fmt = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const AudioStudio = ({
  studioSubtitle,
  isPrepPhase,
  prepTime,
  startRecording,
  isRecording,
  maxRecordingTime,
  recordingTime,
  stopRecording,
  canvasCallback,
  isSaving,
  activeBlob,
  activeAudioUrl,
  activeSet,
  speakingStep,
  part1QuestionIdx,
  part3QuestionIdx,
  pteQuestionIdx,
  isPlayingPteAudio,
  startPrep,
}) => {
  const isPte = activeSet?.examType === "PTE";

  return (
    <div className="lg:col-span-5 space-y-8">
      <div className="card bg-white border border-slate-100 p-10 rounded-[3.5rem] shadow-xl h-fit text-slate-800">
        <div className="space-y-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-800">
                Audio Studio
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {studioSubtitle}
              </p>
            </div>
            <PiWaveformFill className={`text-2xl text-primary ${isRecording ? "animate-pulse" : ""}`} />
          </div>

          {isPrepPhase ? (
            <motion.div
              key="prep"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center text-center space-y-6 py-10"
            >
              <div className="w-32 h-32 rounded-full border-4 border-red-500 border-t-transparent animate-spin flex items-center justify-center p-2">
                <div className="w-full h-full rounded-full bg-red-500/10 flex items-center justify-center animate-none">
                  <span className="text-3xl font-black font-mono text-red-500">
                    {prepTime}s
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-slate-800">
                  Preparation Phase
                </h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Organize your thoughts
                </p>
              </div>
              <button
                type="button"
                onClick={startRecording}
                className="btn btn-primary rounded-2xl px-10 h-14 font-black w-full"
              >
                Skip Prep & Record
              </button>
            </motion.div>
          ) : isRecording ? (
            <motion.div
              key="recording"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center space-y-10 py-10"
            >
              <div className="relative">
                <div className="w-40 h-40 rounded-full bg-red-500/10 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center text-white text-5xl shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                    <PiMicrophoneFill />
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-full h-full rounded-full border border-red-500/20"
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.4,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4 w-full">
                <div className="w-full flex justify-center py-2">
                  <canvas
                    ref={canvasCallback}
                    width={320}
                    height={80}
                    className="bg-slate-50 rounded-3xl border border-slate-200 shadow-inner"
                  />
                </div>
                <div className="text-5xl font-mono font-black text-slate-800">
                  {fmt(Math.max(0, maxRecordingTime - recordingTime))}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">
                  System Capturing Audio...
                </p>
              </div>

              <button
                type="button"
                onClick={stopRecording}
                className="btn btn-error btn-outline rounded-2xl px-12 h-16 font-black w-full border-2"
              >
                <PiStopCircleFill className="text-2xl" /> Stop Recording
              </button>
            </motion.div>
          ) : isSaving ? (
            <motion.div
              key="saving"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center text-center space-y-6 py-20 w-full"
            >
              <div className="w-20 h-20 rounded-[2rem] bg-primary/10 text-primary flex items-center justify-center text-4xl animate-pulse">
                💾
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-slate-800">
                  Saving Response...
                </h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                  Processing your audio file
                </p>
              </div>
            </motion.div>
          ) : activeBlob ? (
            <motion.div
              key="recorded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center space-y-8 py-10"
            >
              <div className="w-32 h-32 rounded-full bg-success/10 border border-success/20 flex items-center justify-center text-5xl text-success animate-pulse">
                <PiCheckCircleFill />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-slate-800">
                  {isPte ? `Question ${pteQuestionIdx + 1} Response Captured` : (speakingStep === 2 ? "Cue Card Response Captured" : `Question ${speakingStep === 1 ? part1QuestionIdx + 1 : part3QuestionIdx + 1} Response Captured`)}
                </h4>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                  Your response has been saved. Review your recording below.
                </p>
              </div>

              {activeAudioUrl && (
                <div className="w-full py-2">
                  <audio src={activeAudioUrl} controls className="w-full rounded-2xl border border-slate-200 shadow-sm" key={activeAudioUrl} />
                </div>
              )}

              <div className="grid grid-cols-1 w-full gap-4">
                <div className="text-center py-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                    Recording Finalized
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center space-y-8 py-10"
            >
              <div className="w-32 h-32 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-5xl text-slate-400">
                <PiMicrophoneFill />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-slate-800">
                  {isPte ? (
                    activeSet.questions?.[pteQuestionIdx]?.type === "pte-read-aloud" ? "Ready to Read Aloud?" :
                    activeSet.questions?.[pteQuestionIdx]?.type === "pte-repeat-sentence" ? "Ready to Repeat Sentence?" :
                    activeSet.questions?.[pteQuestionIdx]?.type === "pte-describe-image" ? "Ready to Describe Image?" :
                    activeSet.questions?.[pteQuestionIdx]?.type === "pte-retell-lecture" ? "Ready to Retell Lecture?" :
                    activeSet.questions?.[pteQuestionIdx]?.type === "pte-answer-short-question" ? "Ready to Answer Question?" :
                    "Ready to Record?"
                  ) : (speakingStep === 2 ? "Ready to Record Cue Card?" : `Ready to Record Question ${speakingStep === 1 ? part1QuestionIdx + 1 : part3QuestionIdx + 1}?`)}
                </h4>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                  {isPte ? (
                    activeSet.questions?.[pteQuestionIdx]?.type === "pte-read-aloud" ? "Take a moment to prepare, then record yourself reading the text clearly." :
                    activeSet.questions?.[pteQuestionIdx]?.type === "pte-repeat-sentence" ? "Listen to the sentence audio first, then start recording and repeat it." :
                    activeSet.questions?.[pteQuestionIdx]?.type === "pte-describe-image" ? "Analyze the image, prepare your description, and record." :
                    activeSet.questions?.[pteQuestionIdx]?.type === "pte-retell-lecture" ? "Listen to the lecture, then summarize and retell it in your recording." :
                    activeSet.questions?.[pteQuestionIdx]?.type === "pte-answer-short-question" ? "Listen to the question, then record a short, concise answer." :
                    "Click start recording when you are ready."
                  ) : (speakingStep === 2
                    ? "Prepare for 60 seconds or start speaking immediately."
                    : `Speak for up to ${speakingStep === 1 ? 40 : 50} seconds to answer the question.`)}
                </p>
              </div>
              <div className="grid grid-cols-1 w-full gap-4">
                {!isPte && speakingStep === 2 ? (
                  <>
                    <button
                      type="button"
                      onClick={startPrep}
                      className="btn btn-primary rounded-2xl h-16 font-black text-sm uppercase tracking-widest"
                    >
                      Start Prep Time
                    </button>
                    <button
                      type="button"
                      onClick={startRecording}
                      className="btn btn-ghost rounded-2xl h-16 font-black text-xs uppercase tracking-widest border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      Record Immediately
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={isPlayingPteAudio}
                    className="btn btn-primary rounded-2xl h-16 font-black text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlayingPteAudio ? "Listening..." : "Start Recording"}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Examiner Widget */}
      <div className="card bg-primary p-8 rounded-[3rem] text-white flex flex-row items-center gap-5 shadow-2xl shadow-primary/20">
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl backdrop-blur-md">
          <PiUserCircleFill />
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">
            Examiner Perspective
          </h4>
          <p className="text-sm font-black leading-tight italic">
            {speakingStep === 1
              ? '"Speak naturally and give detailed answers. Do not give simple yes or no responses."'
              : speakingStep === 2
              ? '"Try to talk for the full two minutes. Make sure to cover every point on the cue card."'
              : '"This is your chance to show off advanced vocabulary and explain complex, abstract opinions."'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AudioStudio;
