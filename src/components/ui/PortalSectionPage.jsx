function PortalSectionPage({ title, eyebrow, summary, cards = [] }) {
  return (
    <div className="portal-page">
      <header className="portal-page-header">
        <div>
          {eyebrow ? <span className="section-kicker">{eyebrow}</span> : null}
          <h1>{title}</h1>
        </div>
        {summary ? <p>{summary}</p> : null}
      </header>

      <div className="card-grid three-column portal-card-grid">
        {cards.map((card) => (
          <article key={card.title} className="card info-card">
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default PortalSectionPage;
