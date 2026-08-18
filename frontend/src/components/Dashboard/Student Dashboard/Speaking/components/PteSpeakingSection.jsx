import { motion } from "framer-motion";
import { PiPlay, PiClockFill, PiGraduationCapFill } from "react-icons/pi";

const PteSpeakingSection = ({
  activeSet,
  pteQuestionIdx,
  setPteQuestionIdx,
  pteBlobs,
  playPteAudio,
  isPlayingPteAudio,
  isRecording,
  isSaving,
  isUploading,
  handleSubmitSpeaking,
}) => {
  const currentPteQuestion = activeSet?.questions?.[pteQuestionIdx] || null;

  return (
    <motion.div
      key="pte-section"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="card bg-white p-12 rounded-[4rem] text-slate-900 shadow-2xl relative overflow-hidden h-fit border border-slate-100"
    >
      <div className="absolute top-0 right-0 p-12 text-slate-100 text-9xl -mr-10 -mt-10 pointer-events-none">
        <PiGraduationCapFill />
      </div>

      <div className="relative z-10 space-y-10">
        <div className="flex items-center justify-between">
          <span className="badge badge-primary px-5 py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.2em]">
            PTE Speaking & Writing Module
          </span>
          <div className="flex items-center gap-2 text-slate-400">
            <PiClockFill />
            <span className="text-xs font-bold uppercase">
              Question {pteQuestionIdx + 1} of {activeSet?.questions?.length || 1}
            </span>
          </div>
        </div>

        {currentPteQuestion && (
          <div className="prose prose-slate max-w-none space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-3xl font-black tracking-tighter text-slate-800 leading-tight capitalize">
                {currentPteQuestion.type?.replace("pte-", "").replace(/-/g, " ")}
              </h2>
              <span className="badge badge-neutral text-xs font-mono font-bold">
                {currentPteQuestion.type}
              </span>
            </div>

            <div className="p-8 bg-slate-50 border-2 border-primary/20 rounded-[2.5rem] shadow-inner space-y-4">
              {currentPteQuestion.question && (
                <p className="text-xl font-bold text-slate-800 leading-relaxed">
                  {currentPteQuestion.question}
                </p>
              )}

              {currentPteQuestion.audioText && (
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => playPteAudio(currentPteQuestion.audioText)}
                    className="btn btn-circle btn-primary shadow-md"
                  >
                    <PiPlay className="text-xl" />
                  </button>
                  <span className="text-xs font-bold text-slate-600">
                    {isPlayingPteAudio ? "Playing prompt audio..." : "Click to listen to prompt audio"}
                  </span>
                </div>
              )}

              {currentPteQuestion.imageUrl && (
                <div className="flex justify-center my-4">
                  <img
                    src={currentPteQuestion.imageUrl}
                    alt="PTE Describe Image"
                    className="max-h-64 rounded-2xl shadow-md border border-slate-200 object-contain"
                  />
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
              <button
                type="button"
                disabled={pteQuestionIdx === 0 || isRecording || isSaving}
                onClick={() => setPteQuestionIdx((prev) => prev - 1)}
                className="btn btn-ghost border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl px-4 h-10 font-bold text-xs uppercase"
              >
                ← Back
              </button>
              
              <div className="flex items-center gap-2">
                {activeSet.questions.map((_, index) => {
                  const isRecorded = !!pteBlobs[index];
                  const isActive = index === pteQuestionIdx;
                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={isRecording || isSaving}
                      onClick={() => setPteQuestionIdx(index)}
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

              {pteQuestionIdx < activeSet.questions.length - 1 ? (
                <button
                  type="button"
                  disabled={isRecording || isSaving}
                  onClick={() => setPteQuestionIdx((prev) => prev + 1)}
                  className="btn btn-primary rounded-xl px-6 h-10 font-bold text-xs uppercase"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleSubmitSpeaking}
                  className="btn btn-primary rounded-xl px-6 h-10 font-bold text-xs uppercase"
                >
                  {isUploading ? "Uploading..." : "Submit PTE Test ✓"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PteSpeakingSection;
