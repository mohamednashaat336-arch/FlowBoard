export default function StatsCard({ label, value, detail, Icon }) {
  return (
    <article className="fb-stat-card">
      <div className="fb-stat-card__top">
        <span className="fb-stat-card__label">{label}</span>
        <span className="fb-stat-card__icon"><Icon aria-hidden="true" /></span>
      </div>
      <p className="fb-stat-card__value">{value}</p>
      <p className="fb-stat-card__detail">{detail}</p>
    </article>
  )
}
