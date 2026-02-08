import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

function ReportDetail({ reportId, onBack }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE}/reports/${reportId}`);
        setReport(response.data.data);
      } catch (err) {
        setError('Failed to load report details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <span className="loading-text">Loading report...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="error-message">
        {error || 'Report not found'}
        <button className="back-btn" onClick={onBack}>← Back</button>
      </div>
    );
  }

  const statusSteps = [
    { key: 'pending', label: 'Submitted', icon: '📝' },
    { key: 'acknowledged', label: 'Acknowledged', icon: '👀' },
    { key: 'in_progress', label: 'In Progress', icon: '🔧' },
    { key: 'resolved', label: 'Resolved', icon: '✅' }
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.key === report.status);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const issueIcons = {
    pothole: '🕳️',
    trash: '🗑️',
    graffiti: '🎨',
    streetlight: '💡',
    other: '❓'
  };

  return (
    <div className="report-detail">
      <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>
      
      <div className="detail-header">
        <span className={`issue-badge ${report.issueType}`}>
          {issueIcons[report.issueType]} {report.issueType}
        </span>
        <span className="report-id">#{report._id?.slice(-8)}</span>
      </div>

      {report.imageBase64 && (
        <img 
          src={report.imageBase64} 
          alt="Issue" 
          className="detail-image"
        />
      )}

      <div className="detail-section">
        <h3>Summary</h3>
        <p>{report.summary}</p>
      </div>

      {report.description && (
        <div className="detail-section">
          <h3>Your Description</h3>
          <p className="user-description">{report.description}</p>
        </div>
      )}

      <div className="detail-section">
        <h3>Status Timeline</h3>
        <div className="status-timeline">
          {statusSteps.map((step, index) => (
            <div 
              key={step.key}
              className={`timeline-step ${index <= currentStepIndex ? 'active' : ''} ${index === currentStepIndex ? 'current' : ''}`}
            >
              <div className="step-icon">{step.icon}</div>
              <div className="step-label">{step.label}</div>
              {index < statusSteps.length - 1 && <div className="step-line"></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="detail-section">
        <h3>Routing</h3>
        <div className="routing-info">
          <p className="department">{report.department?.replace(/_/g, ' ')}</p>
          <p className="reason">{report.reason}</p>
        </div>
      </div>

      <div className="detail-meta">
        <p><strong>Severity:</strong> {report.severity}/5</p>
        <p><strong>Submitted:</strong> {formatDate(report.createdAt)}</p>
        <p><strong>Last Updated:</strong> {formatDate(report.updatedAt)}</p>
      </div>
    </div>
  );
}

export default ReportDetail;
