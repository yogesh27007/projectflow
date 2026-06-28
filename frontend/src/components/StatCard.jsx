export default function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div style={{
      background: '#0d0d14',
      border: '1px solid #1e1e2e',
      borderRadius: 14, padding: '20px 22px',
      display: 'flex', alignItems: 'center', gap: 16,
      transition: 'border-color 0.2s',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: `linear-gradient(90deg, transparent, ${color}40, transparent)`
      }} />
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: color + '15',
        border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <p style={{ fontSize: 12, color: '#4a4a6a', marginBottom: 4, fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: 30, fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>{value}</p>
      </div>
    </div>
  );
}