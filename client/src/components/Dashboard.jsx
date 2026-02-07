function Dashboard({ reports, onNewReport, onViewReport }) {
  const issueIcons = {
    pothole: '🕳️',
    trash: '🗑️',
    graffiti: '🎨',
    streetlight: '💡',
    other: '❓'
  };

  const statusLabels = {
    pending: 'Pending',
    acknowledged: 'Acknowledged',
    in_progress: 'In Progress',
    resolved: 'Resolved'
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Group by status for stats
  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    inProgress: reports.filter(r => r.status === 'in_progress' || r.status === 'acknowledged').length
  };

  return (
    <div className="dashboard">
      <button className="new-report-btn" onClick={onNewReport}>
        <span className="btn-icon">📷</span>
        Report New Issue
      </button>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Active Issues</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.pending}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.inProgress}</span>
          <span className="stat-label">In Progress</span>
        </div>
      </div>

      <h2 className="section-title">Recent Reports</h2>

      <div className="reports-list">
        {reports.length === 0 ? (
          <div className="empty-state">
            <p>No active issues in your area</p>
            <p className="empty-subtext">Be the first to report a problem!</p>
          </div>
        ) : (
          reports.slice(0, 10).map(report => (
            <div 
              key={report._id} 
              className="report-card"
              onClick={() => onViewReport(report._id)}
            >
              <div className="report-card-header">
                <span className={`issue-badge small ${report.issueType}`}>
                  {issueIcons[report.issueType]} {report.issueType}
                </span>
                <span className={`status-badge ${report.status}`}>
                  {statusLabels[report.status]}
                </span>
              </div>
              <p className="report-summary">{report.summary?.slice(0, 80)}...</p>
              <div className="report-card-footer">
                <span className="severity-indicator" data-level={report.severity}>
                  Severity: {report.severity}/5
                </span>
                <span className="report-time">{formatDate(report.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;
