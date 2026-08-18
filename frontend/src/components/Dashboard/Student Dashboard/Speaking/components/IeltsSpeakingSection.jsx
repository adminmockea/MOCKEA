import { motion } from "framer-motion";
import {
  PiClockFill,
  PiMicrophoneStageFill,
  PiNotebookFill,
  PiArrowLeftBold,
} from "react-icons/pi";
import { toast } from "react-toastify";

const IeltsSpeakingSection = ({
  speakingStep,
  setSpeakingStep,
  part1Questions,
  part1QuestionIdx,
  setPart1QuestionIdx,
  part1Blobs,
  part2Blob,
  part3Questions,
  part3QuestionIdx,
  setPart3QuestionIdx,
  part3Blobs,
  activeSet,
  isRecording,
  isSaving,
  isUploading,
  handleSubmitSpeaking,
}) => {
  const renderNavigationWizard = () => {
    return (
      <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <button
          type="button"
          disabled={speakingStep === 1}
          onClick={() => {
            if (isRecording) {
              toast.warning("Please stop recording before switching sections");
              return;
            }
            setSpeakingStep((p) => Math.max(1, p - 1));
          }}
          className="btn btn-ghost border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl px-6 h-12 font-black text-xs uppercase tracking-widest gap-2 flex items-center disabled:opacity-30 w-full md:w-auto"
        >
          <PiArrowLeftBold className="w-4 h-4" /> Previous Part
        </button>

        <div className="flex items-center gap-3">
          {[1, 2, 3].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => {
                if (isRecording) {
                  toast.warning("Please stop recording before switching sections");
                  return;
                }
                if (step > speakingStep) {
                  if (speakingStep === 1) {
                    const allRecorded = part1Questions.every((_, idx) => part1Blobs[idx]);
                    if (!allRecorded) {
                      toast.warning("Please record all questions in Part 1 before proceeding.");
                      return;
                    }
                  }
                  if (speakingStep === 2 && step === 3) {
                    if (!part2Blob) {
                      toast.warning("Please record your Part 2 response before proceeding.");
                      return;
                    }
                  }
                }
                setSpeakingStep(step);
              }}
              className={`w-10 h-10 rounded-full font-black text-sm transition-all flex items-center justify-center ${
                speakingStep === step
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-500"
              }`}
            >
              {step}
            </button>
          ))}
        </div>

        {speakingStep < 3 ? (
          <button
            type="button"
            onClick={() => {
              if (isRecording) {
                toast.warning("Please stop recording before switching sections");
                return;
              }
              if (speakingStep === 1) {
                const allRecorded = part1Questions.every((_, idx) => part1Blobs[idx]);
                if (!allRecorded) {
                  toast.warning("Please record all questions in Part 1 before proceeding.");
                  return;
                }
              } else if (speakingStep === 2) {
                if (!part2Blob) {
                  toast.warning("Please record your Part 2 response before proceeding.");
                  return;
                }
              }
              setSpeakingStep((p) => Math.min(3, p + 1));
            }}
            className="btn btn-primary rounded-2xl px-6 h-12 font-black text-xs uppercase tracking-widest flex items-center gap-2 w-full md:w-auto"
          >
            Next Part →
          </button>
        ) : (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => {
              const allRecorded = part3Questions.every((_, idx) => part3Blobs[idx]);
              if (!allRecorded) {
                toast.warning("Please record all questions in Part 3 before submitting.");
                return;
              }
              handleSubmitSpeaking();
            }}
            className="btn btn-primary rounded-2xl px-8 h-12 font-black text-xs uppercase tracking-widest flex items-center gap-2 w-full md:w-auto shadow-lg shadow-primary/20"
          >
            {isUploading ? "Uploading..." : "Submit Speaking Test ✓"}
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      {/* PART 1 */}
      {speakingStep === 1 && (
        <motion.div
          key="part1"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="card bg-white p-12 rounded-[4rem] text-slate-900 shadow-2xl relative overflow-hidden h-fit border border-slate-100"
        >
          <div className="absolute top-0 right-0 p-12 text-slate-100 text-9xl -mr-10 -mt-10 pointer-events-none">
            <PiMicrophoneStageFill />
          </div>

          <div className="relative z-10 space-y-10">
            <div className="flex items-center justify-between">
              <span className="badge badge-primary px-5 py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.2em]">
                Part 1: Introduction & Interview
              </span>
              <div className="flex items-center gap-2 text-slate-400">
                <PiClockFill />
                <span className="text-xs font-bold uppercase">
                  40s Per Question
                </span>
              </div>
            </div>

            <div className="prose prose-slate max-w-none">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-4xl font-black tracking-tighter text-slate-800 leading-tight">
                  {activeSet?.title}
                </h2>
                <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl uppercase tracking-widest shrink-0">
                  Q {part1QuestionIdx + 1} of {part1Questions.length}
                </span>
              </div>
              <p className="text-slate-500 font-semibold text-sm mt-3">
                Answer general questions about familiar topics. Speak naturally for up to 40 seconds. Once recorded, you cannot re-record.
              </p>
              
              <div className="mt-8">
                <div className="p-8 bg-slate-50 border-2 border-primary/20 rounded-[2rem] flex gap-5 items-start shadow-md">
                  <span className="w-10 h-10 rounded-2xl bg-primary text-white font-black flex items-center justify-center shrink-0 text-lg shadow-md shadow-primary/20">
                    {part1QuestionIdx + 1}
                  </span>
                  <p className="text-2xl font-bold text-slate-800 leading-relaxed pt-0.5">
                    {part1Questions[part1QuestionIdx]}
                  </p>
                </div>
              </div>

              {/* Question Navigation Dots & Back/Next */}
              <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  disabled={part1QuestionIdx === 0 || isRecording || isSaving}
                  onClick={() => setPart1QuestionIdx((prev) => prev - 1)}
                  className="btn btn-ghost border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl px-4 h-10 font-bold text-xs uppercase"
                >
                  ← Back
                </button>
                <div className="flex items-center gap-2">
                  {part1Questions.map((_, index) => {
                    const isRecorded = !!part1Blobs[index];
                    const isActive = index === part1QuestionIdx;
                    return (
                      <button
                        key={index}
                        type="button"
                        disabled={isRecording || isSaving}
                        onClick={() => setPart1QuestionIdx(index)}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                          isActive
                            ? "bg-primary scale-125 ring-4 ring-primary/20"
                            : isRecorded
                            ? "bg-success"
                            : "bg-slate-200 hover:bg-slate-300"
                        }`}
                        title={`Question ${index + 1}`}
                      />
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={part1QuestionIdx === part1Questions.length - 1 || isRecording || isSaving}
                  onClick={() => setPart1QuestionIdx((prev) => prev + 1)}
                  className="btn btn-ghost border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl px-4 h-10 font-bold text-xs uppercase"
                >
                  Next →
                </button>
              </div>
            </div>

            {renderNavigationWizard()}
          </div>
        </motion.div>
      )}

      {/* PART 2 */}
      {speakingStep === 2 && (
        <motion.div
          key="part2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="card bg-white p-12 rounded-[4rem] text-slate-900 shadow-2xl relative overflow-hidden h-fit border border-slate-100"
        >
          <div className="absolute top-0 right-0 p-12 text-slate-100 text-9xl -mr-10 -mt-10 pointer-events-none">
            <PiNotebookFill />
          </div>

          <div className="relative z-10 space-y-10">
            <div className="flex items-center justify-between">
              <span className="badge badge-primary px-5 py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.2em]">
                Part 2: Individual Long Turn (Cue Card)
              </span>
              <div className="flex items-center gap-2 text-slate-400">
                <PiClockFill />
                <span className="text-xs font-bold uppercase">
                  1 Min Prep • 2 Mins Speak
                </span>
              </div>
            </div>

            <div className="prose prose-slate max-w-none">
              <h2 className="text-4xl font-black tracking-tighter text-slate-800 leading-tight">
                {activeSet?.title}
              </h2>
              
              <div className="mt-8 p-10 bg-slate-50 border-2 border-primary/20 rounded-[2.5rem] shadow-inner space-y-6">
                <div className="text-xl font-black text-slate-800 border-b border-slate-200 pb-4">
                  Topic Prompt:
                </div>
                <div className="text-lg font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {activeSet?.speakingPrompt || activeSet?.passage || activeSet?.content || "Describe a memorable journey you have taken."}
                </div>
              </div>
            </div>

            {renderNavigationWizard()}
          </div>
        </motion.div>
      )}

      {/* PART 3 */}
      {speakingStep === 3 && (
        <motion.div
          key="part3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="card bg-white p-12 rounded-[4rem] text-slate-900 shadow-2xl relative overflow-hidden h-fit border border-slate-100"
        >
          <div className="absolute top-0 right-0 p-12 text-slate-100 text-9xl -mr-10 -mt-10 pointer-events-none">
            <PiMicrophoneStageFill />
          </div>

          <div className="relative z-10 space-y-10">
            <div className="flex items-center justify-between">
              <span className="badge badge-primary px-5 py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.2em]">
                Part 3: Two-way Analytical Discussion
              </span>
              <div className="flex items-center gap-2 text-slate-400">
                <PiClockFill />
                <span className="text-xs font-bold uppercase">
                  50s Per Question
                </span>
              </div>
            </div>

            <div className="prose prose-slate max-w-none">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-4xl font-black tracking-tighter text-slate-800 leading-tight">
                  {activeSet?.title}
                </h2>
                <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl uppercase tracking-widest shrink-0">
                  Q {part3QuestionIdx + 1} of {part3Questions.length}
                </span>
              </div>
              <p className="text-slate-500 font-semibold text-sm mt-3">
                Discuss abstract issues and concepts related to the topic of Part 2. Speak for up to 50 seconds. Once recorded, you cannot re-record.
              </p>
              
              <div className="mt-8">
                <div className="p-8 bg-slate-50 border-2 border-primary/20 rounded-[2rem] flex gap-5 items-start shadow-md">
                  <span className="w-10 h-10 rounded-2xl bg-primary text-white font-black flex items-center justify-center shrink-0 text-lg shadow-md shadow-primary/20">
                    {part3QuestionIdx + 1}
                  </span>
                  <p className="text-2xl font-bold text-slate-800 leading-relaxed pt-0.5">
                    {part3Questions[part3QuestionIdx]}
                  </p>
                </div>
              </div>

              {/* Question Navigation Dots & Back/Next */}
              <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  disabled={part3QuestionIdx === 0 || isRecording || isSaving}
                  onClick={() => setPart3QuestionIdx((prev) => prev - 1)}
                  className="btn btn-ghost border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl px-4 h-10 font-bold text-xs uppercase"
                >
                  ← Back
                </button>
                <div className="flex items-center gap-2">
                  {part3Questions.map((_, index) => {
                    const isRecorded = !!part3Blobs[index];
                    const isActive = index === part3QuestionIdx;
                    return (
                      <button
                        key={index}
                        type="button"
                        disabled={isRecording || isSaving}
                        onClick={() => setPart3QuestionIdx(index)}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                          isActive
                            ? "bg-primary scale-125 ring-4 ring-primary/20"
                            : isRecorded
                            ? "bg-success"
                            : "bg-slate-200 hover:bg-slate-300"
                        }`}
                        title={`Question ${index + 1}`}
                      />
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={part3QuestionIdx === part3Questions.length - 1 || isRecording || isSaving}
                  onClick={() => setPart3QuestionIdx((prev) => prev + 1)}
                  className="btn btn-ghost border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl px-4 h-10 font-bold text-xs uppercase"
                >
                  Next →
                </button>
              </div>
            </div>

            {renderNavigationWizard()}
          </div>
        </motion.div>
      )}
    </>
  );
};

export default IeltsSpeakingSection;
