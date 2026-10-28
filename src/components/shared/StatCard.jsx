function StatCard({ icon, label, value, hint }) {
  return (
    <div className="stat-card">
      <div className="stat-icon"><i className={`bi ${icon}`} /></div>
      <div><span>{label}</span><strong>{value}</strong>{hint && <small>{hint}</small>}</div>
    </div>
  )
}
export default StatCard
