import { useState, useEffect } from "react";
import useAxiosSecure from "../../../../hooks/useAxiosSecure.jsx";
import { toast } from "react-toastify";
import Loader from "../../../Loader/Loader.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { 
    PiCheckCircleFill, 
    PiClockFill, 
    PiNotePencilFill, 
    PiMicrophoneStageFill,
    PiUserCircleFill,
    PiArrowRightBold,
    PiXCircleFill,
    PiChatCircleTextFill,
    PiChartLineUpFill,
    PiMagnifyingGlassFill
} from "react-icons/pi";

const InstructorReview = () => {
  const axiosSecure = useAxiosSecure();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewData, setReviewData] = useState({ score: "", bandScore: "", feedback: "" });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState({ status: "pending", testType: "" });

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const { data } = await axiosSecure.get(`/submissions?status=${filter.status}&testType=${filter.testType}`);
      setSubmissions(data.submissions);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load submissions");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const handleReview = async (e) => {
    e.preventDefault();
    if (!reviewData.score || !reviewData.bandScore || !reviewData.feedback) {
        toast.warning("Please fill all review fields");
        return;
    }

    try {
      setSubmitting(true);
      const { data } = await axiosSecure.patch(`/submissions/review/${selectedSubmission._id}`, reviewData);
      if (data.success) {
        toast.success("Review submitted successfully!");
        setSelectedSubmission(null);
        setReviewData({ score: "", bandScore: "", feedback: "" });
        fetchSubmissions();
      }
    } catch (error) {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && submissions.length === 0) return <Loader />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-800">Instructor <span className="text-primary italic">Review Lab</span></h1>
            <p className="text-slate-400 font-medium mt-2">Evaluate student mastery across writing and speaking modules.</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-base-300 shadow-sm">
            <select 
                className="select select-sm border-none focus:ring-0 font-bold text-xs uppercase tracking-widest"
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
            >
                <option value="pending">Pending Review</option>
                <option value="reviewed">Already Reviewed</option>
            </select>
            <div className="w-px h-6 bg-base-300" />
            <select 
                className="select select-sm border-none focus:ring-0 font-bold text-xs uppercase tracking-widest"
                value={filter.testType}
                onChange={(e) => setFilter({...filter, testType: e.target.value})}
            >
                <option value="">All Skills</option>
                <option value="writing">Writing</option>
                <option value="speaking">Speaking</option>
            </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Submissions List */}
        <div className={`${selectedSubmission ? 'lg:col-span-4' : 'lg:col-span-12'} space-y-4`}>
            {submissions.length === 0 ? (
                <div className="card bg-white border border-base-300 p-20 flex flex-col items-center justify-center text-center space-y-4 rounded-[3rem]">
                    <PiMagnifyingGlassFill className="text-6xl text-base-content/10" />
                    <h3 className="text-xl font-black opacity-30 uppercase tracking-tighter">No Submissions Found</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                    {submissions.map((sub) => (
                        <motion.div 
                            key={sub._id}
                            layout
                            onClick={() => setSelectedSubmission(sub)}
                            className={`card p-6 border transition-all cursor-pointer group ${
                                selectedSubmission?._id === sub._id 
                                ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 rounded-[2.5rem]' 
                                : 'bg-white border-base-300 hover:border-primary/50 rounded-[2rem]'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${selectedSubmission?._id === sub._id ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                                        {sub.testType === 'writing' ? <PiNotePencilFill /> : <PiMicrophoneStageFill />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-black leading-tight">{sub.userName}</h4>
                                            {sub.institution ? (
                                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${selectedSubmission?._id === sub._id ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'}`}>
                                                    {sub.institution.code}
                                                </span>
                                            ) : (
                                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${selectedSubmission?._id === sub._id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                    B2C
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedSubmission?._id === sub._id ? 'text-white/60' : 'text-slate-400'}`}>
                                            {sub.testType} • {new Date(sub.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <PiArrowRightBold className={`opacity-0 group-hover:opacity-100 transition-all ${selectedSubmission?._id === sub._id ? 'text-white' : 'text-primary'}`} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>

        {/* Review Pane */}
        <AnimatePresence>
            {selectedSubmission && (
                <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    className="lg:col-span-8 space-y-8"
                >
                    <div className="card bg-white border border-base-300 rounded-[3.5rem] shadow-sm overflow-hidden flex flex-col h-[calc(100vh-250px)]">
                        <div className="px-10 py-8 border-b border-base-200 bg-base-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <PiUserCircleFill className="text-4xl text-primary" />
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">{selectedSubmission.userName}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedSubmission.userEmail}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedSubmission(null)} className="btn btn-ghost btn-circle">
                                <PiXCircleFill className="text-2xl text-slate-300" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                            <div className="space-y-4">
                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Attempt Content</h5>
                                <div className="p-8 bg-base-50 border border-base-200 rounded-[2.5rem] text-lg leading-relaxed text-slate-700 whitespace-pre-wrap font-medium italic">
                                    {selectedSubmission.content}
                                </div>
                            </div>

                            {filter.status === 'pending' ? (
                                <form onSubmit={handleReview} className="space-y-8 pt-6 border-t border-base-200">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Numeric Score (0-100)</label>
                                            <input 
                                                type="number"
                                                className="input input-bordered w-full rounded-2xl font-black focus:border-primary"
                                                placeholder="e.g. 85"
                                                value={reviewData.score}
                                                onChange={(e) => setReviewData({...reviewData, score: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">IELTS Band Score</label>
                                            <input 
                                                type="text"
                                                className="input input-bordered w-full rounded-2xl font-black focus:border-primary"
                                                placeholder="e.g. 7.5"
                                                value={reviewData.bandScore}
                                                onChange={(e) => setReviewData({...reviewData, bandScore: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Professional Feedback</label>
                                        <textarea 
                                            className="textarea textarea-bordered w-full rounded-[2rem] h-32 font-medium focus:border-primary"
                                            placeholder="Provide detailed constructive criticism..."
                                            value={reviewData.feedback}
                                            onChange={(e) => setReviewData({...reviewData, feedback: e.target.value})}
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={submitting}
                                        className="btn btn-primary btn-block rounded-2xl h-16 font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20"
                                    >
                                        {submitting ? <span className="loading loading-spinner" /> : "Finalize Evaluation"}
                                        <PiCheckCircleFill className="text-xl" />
                                    </button>
                                </form>
                            ) : (
                                <div className="space-y-8 pt-6 border-t border-base-200 animate-in fade-in">
                                    <div className="flex items-center gap-8">
                                        <div className="flex flex-col items-center p-6 bg-success/10 rounded-[2rem] border border-success/20 min-w-[100px]">
                                            <span className="text-3xl font-black text-success">{selectedSubmission.score}%</span>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-success/60">Score</span>
                                        </div>
                                        <div className="flex flex-col items-center p-6 bg-primary/10 rounded-[2rem] border border-primary/20 min-w-[100px]">
                                            <span className="text-3xl font-black text-primary">{selectedSubmission.bandScore}</span>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">Band</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-success">Instructor Feedback</h5>
                                        <div className="p-8 bg-success/5 border border-success/10 rounded-[2.5rem] font-bold text-slate-600 italic leading-relaxed">
                                            {selectedSubmission.feedback}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InstructorReview;
