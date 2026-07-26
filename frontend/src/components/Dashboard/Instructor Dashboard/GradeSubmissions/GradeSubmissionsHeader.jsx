import { PiFilesFill, PiSelectionAllFill } from "react-icons/pi";

const GradeSubmissionsHeader = ({ activeTab, setActiveTab, isSubmissionSelected }) => {
    if (isSubmissionSelected) return null;

    return (
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-3">Academic Evaluation Hub</p>
                <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-slate-800 leading-none">
                    Review <span className="text-primary italic">Center</span>
                </h1>
            </div>

            {/* Tab Switcher */}
            <div className="bg-white p-2 rounded-4xl border border-base-300 shadow-sm flex items-center gap-1">
                <button 
                    onClick={() => setActiveTab("mock-tests")}
                    className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'mock-tests' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-base-100'}`}
                >
                    <PiFilesFill className="text-lg" /> Full Mock Tests
                </button>
                <button 
                    onClick={() => setActiveTab("skill-labs")}
                    className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'skill-labs' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-base-100'}`}
                >
                    <PiSelectionAllFill className="text-lg" /> Individual Labs
                </button>
            </div>
        </div>
    );
};

export default GradeSubmissionsHeader;
