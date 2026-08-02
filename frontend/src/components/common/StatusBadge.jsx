const StatusBadge = ({ status }) => {
  const styles = {
    pending: { background: '#FEF9C3', color: '#A16207' },
    approved: { background: '#DCFCE7', color: '#166534' },
    rejected: { background: '#FEE2E2', color: '#991B1B' },
    active: { background: '#DCFCE7', color: '#166534' },
    maintenance: { background: '#FEF9C3', color: '#A16207' },
    available: { background: '#DCFCE7', color: '#166534' },
    blocked: { background: '#FEE2E2', color: '#991B1B' },
    // Maintenance task lifecycle
    assigned: { background: '#DBEAFE', color: '#1E40AF' },
    in_progress: { background: '#FEF3C7', color: '#92400E' },
    waiting_for_parts: { background: '#F3E8FF', color: '#6B21A8' },
    review_pending: { background: '#FFE4E6', color: '#9F1239' },
    completed: { background: '#DCFCE7', color: '#166534' },
    additional_work_required: { background: '#FEF9C3', color: '#A16207' },
    // Room lifecycle
    under_maintenance: { background: '#FEF9C3', color: '#A16207' },
    maintenance_assigned: { background: '#DBEAFE', color: '#1E40AF' },
    maintenance_in_progress: { background: '#FEF3C7', color: '#92400E' },
    maintenance_review_pending: { background: '#FFE4E6', color: '#9F1239' },
    // Severity scales
    critical: { background: '#FEE2E2', color: '#991B1B' },
    high: { background: '#FFE4E6', color: '#9F1239' },
    medium: { background: '#FEF9C3', color: '#A16207' },
    low: { background: '#DCFCE7', color: '#166534' },
  };

  const style = styles[status?.toLowerCase()] || {
    background: '#E5E7EB',
    color: '#374151',
  };

  // Map snake_case statuses to friendlier labels
  const labels = {
    in_progress: 'In Progress',
    waiting_for_parts: 'Waiting for Parts',
    review_pending: 'Review Pending',
    additional_work_required: 'Additional Work',
    under_maintenance: 'Under Maintenance',
    maintenance_assigned: 'Maintenance Assigned',
    maintenance_in_progress: 'Maintenance In Progress',
    maintenance_review_pending: 'Review Pending',
  };

  const display = labels[status?.toLowerCase()] || (status?.charAt(0).toUpperCase() + status?.slice(1));

  return (
    <span
      className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap"
      style={{ background: style.background, color: style.color }}
    >
      {display}
    </span>
  );
};

export default StatusBadge;
