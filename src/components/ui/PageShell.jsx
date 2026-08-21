import "./page-shell.css";

function PageShell({ eyebrow, title, summary, actions, children }) {
  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="content-shell page-hero-inner">
          <div className="page-hero-copy">
            {eyebrow ? <span className="section-kicker">{eyebrow}</span> : null}
            <h1>{title}</h1>
            {summary ? <p>{summary}</p> : null}
            {actions ? <div className="page-actions">{actions}</div> : null}
          </div>
        </div>
      </section>

      <div className="content-shell page-content">{children}</div>
    </div>
  );
}

export default PageShell;
