import { PiRobot, PiArrowsClockwise, PiSliders } from "react-icons/pi";

const AiTutorConfigTab = ({
  chatbotSettings,
  setChatbotSettings,
  loadingChatbot,
  savingChatbot,
  fetchChatbotSettings,
  handleUpdateChatbotSettings,
}) => {
  return (
    <div className="card bg-base-100 border border-base-300 p-6 md:p-8 rounded-[2rem] shadow-sm space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-base-200 pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <PiRobot className="text-primary w-7 h-7" /> AI Tutor & LLM Configurator
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Adjust chatbot instructions, model providers, creativity settings, and usage limits across tiers.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchChatbotSettings}
          disabled={loadingChatbot}
          className="btn btn-outline btn-sm rounded-xl gap-2 font-bold px-4 hover:bg-primary hover:text-white"
        >
          <PiArrowsClockwise className={`w-4 h-4 ${loadingChatbot ? "animate-spin" : ""}`} />
          Refresh Configuration
        </button>
      </div>

      {loadingChatbot || !chatbotSettings ? (
        <div className="flex justify-center items-center py-20">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : (
        <form onSubmit={handleUpdateChatbotSettings} className="space-y-8">
          
          {/* Active Status & Basic Greeting */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card bg-base-200 border border-base-300 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Service Availability</h4>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-md"
                    checked={chatbotSettings.isActive}
                    onChange={(e) => setChatbotSettings({ ...chatbotSettings, isActive: e.target.checked })}
                  />
                  <span className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
                    {chatbotSettings.isActive ? "Online / Active" : "Disabled / Offline"}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-4 block">When off, students see a maintenance card.</span>
            </div>

            <div className="card bg-base-200 border border-base-300 p-6 rounded-2xl shadow-sm lg:col-span-2 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Greeting Welcome Message</span>
              <input
                type="text"
                className="input input-bordered rounded-xl w-full bg-base-100 focus:input-primary text-sm font-medium py-3"
                value={chatbotSettings.welcomeMessage || ""}
                onChange={(e) => setChatbotSettings({ ...chatbotSettings, welcomeMessage: e.target.value })}
              />
              <span className="text-[10px] text-slate-400">First message displayed to users upon opening the study buddy dialog.</span>
            </div>
          </div>

          {/* Quotas & Limits */}
          <div className="card border border-base-300 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <PiSliders className="text-primary w-5 h-5" /> Daily Message Quotas
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Guest Tier</span>
                <input
                  type="number"
                  className="input input-bordered rounded-xl w-full focus:input-primary font-semibold text-sm"
                  value={chatbotSettings.guestLimit || 0}
                  onChange={(e) => setChatbotSettings({ ...chatbotSettings, guestLimit: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Free User Tier</span>
                <input
                  type="number"
                  className="input input-bordered rounded-xl w-full focus:input-primary font-semibold text-sm"
                  value={chatbotSettings.freeLimit || 0}
                  onChange={(e) => setChatbotSettings({ ...chatbotSettings, freeLimit: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Standard User Tier</span>
                <input
                  type="number"
                  className="input input-bordered rounded-xl w-full focus:input-primary font-semibold text-sm"
                  value={chatbotSettings.standardLimit || 0}
                  onChange={(e) => setChatbotSettings({ ...chatbotSettings, standardLimit: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Premium User Tier</span>
                <input
                  type="number"
                  className="input input-bordered rounded-xl w-full focus:input-primary font-semibold text-sm"
                  value={chatbotSettings.premiumLimit || 0}
                  onChange={(e) => setChatbotSettings({ ...chatbotSettings, premiumLimit: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* Model Configuration */}
          <div className="card border border-base-300 p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <PiSliders className="text-primary w-5 h-5" /> Large Language Model (LLM) Integration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">API Provider Format</span>
                <select
                  className="select select-bordered rounded-xl w-full focus:select-primary font-medium"
                  value={chatbotSettings.apiFormat || "gemini"}
                  onChange={(e) => setChatbotSettings({ ...chatbotSettings, apiFormat: e.target.value })}
                >
                  <option value="gemini">Google Gemini API Format</option>
                  <option value="openai">OpenAI / Custom Compatible Format</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Model Name Identifier</span>
                <input
                  type="text"
                  className="input input-bordered rounded-xl w-full focus:input-primary font-medium"
                  value={chatbotSettings.modelName || ""}
                  onChange={(e) => setChatbotSettings({ ...chatbotSettings, modelName: e.target.value })}
                  placeholder="e.g. gemini-2.5-flash or gpt-4o"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Temperature (Creativity): <span className="font-mono text-primary font-bold text-xs">{chatbotSettings.temperature ?? 0.7}</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  className="range range-primary range-sm mt-1"
                  value={chatbotSettings.temperature ?? 0.7}
                  onChange={(e) => setChatbotSettings({ ...chatbotSettings, temperature: parseFloat(e.target.value) })}
                />
                <div className="w-full flex justify-between text-[9px] px-1 text-slate-400 mt-1">
                  <span>Strict (0.0)</span>
                  <span>Balanced (0.5)</span>
                  <span>Creative (1.0)</span>
                </div>
              </div>
            </div>

            {/* Advanced Endpoint and Key override fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-base-200 pt-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">API Call Endpoint URL</span>
                <input
                  type="text"
                  className="input input-bordered rounded-xl w-full focus:input-primary font-mono text-xs"
                  value={chatbotSettings.apiEndpoint || ""}
                  onChange={(e) => setChatbotSettings({ ...chatbotSettings, apiEndpoint: e.target.value })}
                  placeholder="e.g., https://api.openai.com/v1/chat/completions"
                />
                <span className="text-[10px] text-slate-400">Allows pointing to custom gateway routers, Azure endpoints, or local models.</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">API Key Environment Variable Name</span>
                <input
                  type="text"
                  className="input input-bordered rounded-xl w-full focus:input-primary font-mono text-xs"
                  value={chatbotSettings.apiKeyEnvName || ""}
                  onChange={(e) => setChatbotSettings({ ...chatbotSettings, apiKeyEnvName: e.target.value })}
                  placeholder="e.g. GEMINI_API_KEY"
                />
                <span className="text-[10px] text-slate-400">Specifies which environment variable on the server holds the authorization secret.</span>
              </div>
            </div>
          </div>

          {/* Custom Prompts Configuration */}
          <div className="card border border-base-300 p-6 rounded-2xl shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">AI Persona Instructions & Prompts</h3>
              <p className="text-xs text-slate-500 mt-1">Define the strict system instructions loaded into LLM prompts for each chat agent role.</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  1. IELTS Tutor & Study Buddy Persona Prompt
                </span>
                <textarea
                  rows={6}
                  className="textarea textarea-bordered rounded-2xl w-full font-mono text-xs leading-relaxed focus:textarea-primary bg-base-200/30"
                  value={chatbotSettings.tutorPrompt || ""}
                  onChange={(e) => setChatbotSettings({ ...chatbotSettings, tutorPrompt: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  2. TIMED Strict IELTS Examiner Persona Prompt
                </span>
                <textarea
                  rows={6}
                  className="textarea textarea-bordered rounded-2xl w-full font-mono text-xs leading-relaxed focus:textarea-primary bg-base-200/30"
                  value={chatbotSettings.examinerPrompt || ""}
                  onChange={(e) => setChatbotSettings({ ...chatbotSettings, examinerPrompt: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  3. MOCKEA Application Site Assistant Persona Prompt
                </span>
                <textarea
                  rows={6}
                  className="textarea textarea-bordered rounded-2xl w-full font-mono text-xs leading-relaxed focus:textarea-primary bg-base-200/30"
                  value={chatbotSettings.assistantPrompt || ""}
                  onChange={(e) => setChatbotSettings({ ...chatbotSettings, assistantPrompt: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={savingChatbot}
              className="btn btn-primary rounded-2xl font-bold px-10 btn-md"
            >
              {savingChatbot ? "Saving AI Settings..." : "Save AI Configuration"}
            </button>
          </div>

        </form>
      )}
    </div>
  );
};

export default AiTutorConfigTab;
