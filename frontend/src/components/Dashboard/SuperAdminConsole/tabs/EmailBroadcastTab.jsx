import { PiEnvelopeSimple, PiEye, PiPencilSimple, PiTrash } from "react-icons/pi";

const EmailBroadcastTab = ({
  broadcasts,
  loadingBroadcasts,
  sendingBroadcast,
  selectedBroadcast,
  setSelectedBroadcast,
  emailCohort,
  setEmailCohort,
  emailSubject,
  setEmailSubject,
  emailContent,
  setEmailContent,
  editingBroadcast,
  setEditingBroadcast,
  editSubject,
  setEditSubject,
  editContent,
  setEditContent,
  editCohort,
  setEditCohort,
  isUpdatingBroadcast,
  handleSendBroadcast,
  handleStartEditBroadcast,
  handleUpdateBroadcast,
  handleDeleteBroadcast,
}) => {
  return (
    <div className="card bg-base-100 border border-base-300 rounded-[2rem] shadow-sm p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <PiEnvelopeSimple className="text-primary w-6 h-6" /> Interactive Notification Broadcast
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Compose styled system updates and promotional notifications, verify targeting parameters, and broadcast them directly to specific cohorts of users.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose form */}
        <div className="card border border-base-300 p-6 rounded-3xl bg-base-50/50 space-y-4">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Compose New Broadcast</h3>
          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Target Cohort</span>
              </label>
              <select
                value={emailCohort}
                onChange={(e) => setEmailCohort(e.target.value)}
                className="select select-bordered rounded-2xl w-full"
              >
                <option value="all">All Registered Students</option>
                <option value="free">Free Tier Subscribers</option>
                <option value="standard">Standard Tier Subscribers</option>
                <option value="premium">Premium Tier Subscribers</option>
                <option value="inactive">Inactive Students (No activity in 30 days)</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Subject / Title</span>
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="e.g. Upgrade to Pro & Save 30%!"
                className="input input-bordered rounded-2xl w-full"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Notification Content (Supports Markdown)</span>
              </label>
              <textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Write your notification message here... Use markdown for headers (#), bold (**), or bullet lists."
                className="textarea textarea-bordered rounded-2xl w-full h-48 focus:outline-none font-mono text-sm"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={sendingBroadcast}
              className="btn btn-primary rounded-2xl w-full font-bold"
            >
              {sendingBroadcast ? "Sending Broadcast..." : "Send Notification Broadcast"}
            </button>
          </form>
        </div>

        {/* Preview & info */}
        <div className="flex flex-col gap-6">
          <div className="card border border-base-300 p-6 rounded-3xl flex-1 flex flex-col min-h-[300px]">
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">Live Template Preview</h3>
            <div className="flex-1 bg-white dark:bg-slate-900 border border-base-200 dark:border-slate-800 rounded-2xl p-4 overflow-y-auto max-h-[400px]">
              {emailSubject ? (
                <h4 className="text-lg font-black text-slate-800 dark:text-white border-b pb-2 mb-3">
                  {emailSubject}
                </h4>
              ) : (
                <span className="text-slate-400 italic text-sm block mb-3">Enter subject to preview...</span>
              )}

              {emailContent ? (
                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {emailContent
                    .replace(/^#\s+(.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2 text-primary">$1</h2>')
                    .replace(/^##\s+(.+)$/gm, '<h3 class="text-lg font-bold mt-3 mb-1">$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .split("\n")
                    .map((line, idx) => {
                      if (line.startsWith("<h") || line.startsWith("<strong>")) {
                        return <div key={idx} dangerouslySetInnerHTML={{ __html: line }} />;
                      }
                      return <p key={idx} className="mb-2">{line}</p>;
                    })
                  }
                </div>
              ) : (
                <span className="text-slate-400 italic text-sm block">Write content to preview output...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast history list */}
      <div className="border-t border-base-200 pt-6">
        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-4">Past Broadcast History</h3>
        {loadingBroadcasts ? (
          <div className="flex justify-center items-center py-6">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            No past notification broadcasts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full text-xs">
              <thead>
                <tr className="bg-base-200">
                  <th>Subject</th>
                  <th>Target Cohort</th>
                  <th>Recipients</th>
                  <th>Sent By</th>
                  <th>Date Sent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {broadcasts.map((b) => (
                  <tr key={b._id}>
                    <td className="font-semibold text-slate-800 dark:text-white">{b.subject}</td>
                    <td>
                      <span className="badge badge-sm badge-secondary capitalize">{b.cohort}</span>
                    </td>
                    <td className="font-mono font-bold text-primary">{b.recipientCount} users</td>
                    <td>{b.sentBy}</td>
                    <td>{new Date(b.createdAt).toLocaleString()}</td>
                    <td>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setSelectedBroadcast(b)}
                          className="btn btn-xs btn-outline rounded-lg flex items-center gap-1"
                        >
                          <PiEye /> View
                        </button>
                        <button
                          onClick={() => handleStartEditBroadcast(b)}
                          className="btn btn-xs btn-outline btn-info rounded-lg flex items-center gap-1"
                        >
                          <PiPencilSimple /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBroadcast(b._id)}
                          className="btn btn-xs btn-outline btn-error rounded-lg flex items-center gap-1"
                        >
                          <PiTrash /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for viewing details */}
      {selectedBroadcast && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl rounded-3xl">
            <h3 className="font-black text-xl mb-2">{selectedBroadcast.subject}</h3>
            <div className="flex gap-2 mb-4 flex-wrap">
              <span className="badge badge-neutral">Cohort: {selectedBroadcast.cohort.toUpperCase()}</span>
              <span className="badge badge-primary">{selectedBroadcast.recipientCount} Recipients</span>
              <span className="badge badge-ghost text-xs">Sent {new Date(selectedBroadcast.createdAt).toLocaleString()}</span>
            </div>
            <div className="border border-base-300 bg-base-100 p-4 rounded-2xl max-h-[300px] overflow-y-auto whitespace-pre-wrap font-mono text-xs">
              {selectedBroadcast.content}
            </div>
            <div className="modal-action">
              <button onClick={() => setSelectedBroadcast(null)} className="btn btn-sm rounded-xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for editing broadcast */}
      {editingBroadcast && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl rounded-3xl">
            <h3 className="font-black text-xl mb-4">Edit Notification Broadcast</h3>
            <form onSubmit={handleUpdateBroadcast} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Target Cohort</span>
                </label>
                <select
                  value={editCohort}
                  onChange={(e) => setEditCohort(e.target.value)}
                  className="select select-bordered rounded-2xl w-full"
                >
                  <option value="all">All Registered Students</option>
                  <option value="free">Free Tier Subscribers</option>
                  <option value="standard">Standard Tier Subscribers</option>
                  <option value="premium">Premium Tier Subscribers</option>
                  <option value="inactive">Inactive Students (No activity in 30 days)</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Subject / Title</span>
                </label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="e.g. Upgrade to Pro & Save 30%!"
                  className="input input-bordered rounded-2xl w-full"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Notification Content (Supports Markdown)</span>
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Write your notification message here..."
                  className="textarea textarea-bordered rounded-2xl w-full h-48 focus:outline-none font-mono text-sm"
                  required
                ></textarea>
              </div>

              <div className="modal-action gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBroadcast(null)}
                  className="btn btn-sm btn-ghost rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingBroadcast}
                  className="btn btn-sm btn-primary rounded-xl font-bold"
                >
                  {isUpdatingBroadcast ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailBroadcastTab;
