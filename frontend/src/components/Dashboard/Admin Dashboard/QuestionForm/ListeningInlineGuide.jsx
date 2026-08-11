import { PiBookOpen } from "react-icons/pi";

export default function ListeningInlineGuide({ listeningPart }) {
    return (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl space-y-4 shadow-sm animate-fadeSlideDown">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-2xl">
                    <PiBookOpen className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-800">
                        How to Create IELTS Listening Part {listeningPart} (Inline &amp; Table Completion)
                    </h4>
                    <p className="text-xs text-slate-500">
                        Follow these steps to set up inline question gaps or markdown tables for the passage.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-4 bg-white/85 rounded-2xl border border-blue-50/50 space-y-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white font-black flex items-center justify-center text-[10px]">
                        1
                    </div>
                    <h5 className="font-bold text-slate-700">Add Questions Below</h5>
                    <p className="text-slate-500 leading-relaxed text-[11px]">
                        Click <strong className="text-slate-700">+ Add Question</strong> below. Choose <strong className="text-slate-700">Short Answer / Note Completion</strong> as the type.
                    </p>
                </div>

                <div className="p-4 bg-white/85 rounded-2xl border border-blue-50/50 space-y-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white font-black flex items-center justify-center text-[10px]">
                        2
                    </div>
                    <h5 className="font-bold text-slate-700">Insert Placeholders</h5>
                    <p className="text-slate-500 leading-relaxed text-[11px]">
                        In the text box below, write your passage. Mark input blanks with <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px] text-blue-600 font-bold">___31___</code> matching the question number.
                    </p>
                </div>

                <div className="p-4 bg-white/85 rounded-2xl border border-blue-50/50 space-y-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white font-black flex items-center justify-center text-[10px]">
                        3
                    </div>
                    <h5 className="font-bold text-slate-700">Tables &amp; Single Headers</h5>
                    <p className="text-slate-500 leading-relaxed text-[11px]">
                        Add single header tables with <code>| Responsibilities |</code> on row 1, or standard tables with <code>|</code> columns.
                    </p>
                </div>

                <div className="p-4 bg-white/85 rounded-2xl border border-blue-50/50 space-y-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white font-black flex items-center justify-center text-[10px]">
                        4
                    </div>
                    <h5 className="font-bold text-slate-700">Bullets &amp; Bold Text</h5>
                    <p className="text-slate-500 leading-relaxed text-[11px]">
                        Use <code>**bold**</code> for bolding and <code>- </code> or <code>• </code> for bullet points in both passages and tables.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] space-y-2 overflow-x-auto border border-slate-800">
                    <div className="text-slate-400 border-b border-slate-800 pb-1.5 font-sans font-bold flex justify-between items-center">
                        <span>Single Head Table &amp; Bullets Template</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded font-mono font-normal">Best for Parts 1 &amp; 4</span>
                    </div>
                    <div className="whitespace-pre">
{`| Responsibilities |
| | Task 1 | Task 2 | Notes |
|---|---|---|---|
| **Bakery section** | - Check sell by dates | - Change price labels | Use ___1___ labels |
| **Sushi counter** | - Re-stock with ___2___ boxes | - Wipe prep area | Do **not** clean knives |`}
                    </div>
                </div>

                <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] space-y-2 overflow-x-auto border border-slate-800">
                    <div className="text-slate-400 border-b border-slate-800 pb-1.5 font-sans font-bold flex justify-between items-center">
                        <span>Inline Passage &amp; Bullets Template</span>
                        <span className="text-[10px] text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded font-mono font-normal">Best for Parts 2 &amp; 3</span>
                    </div>
                    <div className="whitespace-pre">
{`**First day at work**

- Name of supervisor: ___31___
- Where to leave coat: use ___32___ in staffroom
- See **Tiffany** in HR to collect ___33___ number
- HR office: on ___34___ floor`}
                    </div>
                </div>
            </div>
        </div>
    );
}
