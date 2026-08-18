const AuditLogsTab = ({ auditLogs, auditLogsPage, auditLogsTotalPages, setAuditLogsPage }) => {
  return (
    <div className="card bg-base-100 border border-base-300 rounded-[2rem] overflow-hidden shadow-sm p-4 md:p-6">
      <h2 className="text-xl font-bold mb-4">Platform Audit Trail Log</h2>
      <div className="overflow-x-auto shrink-0 mb-4">
        <table className="table w-full">
          <thead>
            <tr className="bg-base-200">
              <th>Admin / Actor</th>
              <th>Action Event</th>
              <th>Target Model</th>
              <th>IP Address</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-slate-400">
                  No audit records found.
                </td>
              </tr>
            ) : (
              auditLogs.map((log) => (
                <tr key={log._id}>
                  <td>
                    <div className="font-semibold text-sm">{log.actorEmail}</div>
                    <div className="text-xs badge badge-secondary">{log.actorRole}</div>
                  </td>
                  <td>
                    <span className="font-mono text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td>{log.targetType}</td>
                  <td className="text-xs text-slate-500 font-mono">{log.ipAddress}</td>
                  <td className="text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {auditLogsTotalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setAuditLogsPage((p) => Math.max(p - 1, 1))}
            disabled={auditLogsPage === 1}
            className="btn btn-sm btn-outline rounded-xl"
          >
            Previous
          </button>
          <span className="self-center text-xs font-semibold px-4">
            Page {auditLogsPage} of {auditLogsTotalPages}
          </span>
          <button
            onClick={() => setAuditLogsPage((p) => Math.min(p + 1, auditLogsTotalPages))}
            disabled={auditLogsPage === auditLogsTotalPages}
            className="btn btn-sm btn-outline rounded-xl"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditLogsTab;
