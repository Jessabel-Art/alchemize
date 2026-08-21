export function AdminPageHeader({ eyebrow, title, summary, actions = [] }) {
  return (
    <header className="portal-page-header admin-page-header">
      <div>
        {eyebrow ? <span className="section-kicker">{eyebrow}</span> : null}
        <h1>{title}</h1>
      </div>
      <div className="admin-header-meta">
        {summary ? <p>{summary}</p> : null}
        {actions.length ? (
          <div className="admin-header-actions">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                className={action.primary ? "primary-button" : "secondary-button"}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function AdminMetricCard({ label, value, hint }) {
  return (
    <article className="admin-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </article>
  );
}

export function AdminMetrics({ items = [] }) {
  return (
    <section className="admin-metrics" aria-label="Summary metrics">
      {items.map((item) => (
        <AdminMetricCard key={item.label} {...item} />
      ))}
    </section>
  );
}

export function AdminToolbar({
  searchValue,
  onSearchChange,
  filters = [],
  actions = [],
  extraControls = null,
}) {
  return (
    <div className="admin-toolbar">
      <label className="admin-search">
        <span>Search</span>
        <input
          type="search"
          value={searchValue || ""}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Search records"
        />
      </label>

      <div className="admin-filter-row">
        {filters.map((filter) => (
          <label key={filter.label} className="admin-filter">
            <span>{filter.label}</span>
            <select
              value={filter.value ?? ""}
              onChange={(event) => filter.onChange?.(event.target.value)}
            >
              {filter.options.map((option) => (
                <option key={option.value ?? option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="admin-toolbar-side">
        {extraControls ? <div className="admin-toolbar-extra">{extraControls}</div> : null}
        {actions.length ? (
          <div className="admin-toolbar-actions">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                className={action.primary ? "primary-button" : "secondary-button"}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AdminStatusBadge({ status, tone }) {
  const className = `status-pill ${tone || "neutral"}`;
  return <span className={className}>{status}</span>;
}

export function AdminEmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="admin-empty-state">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {actionLabel ? (
        <button type="button" className="primary-button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function AdminDetailDrawer({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="admin-detail-overlay" onClick={onClose}>
      <aside className="admin-detail-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="admin-detail-header">
          <h2>{title}</h2>
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="admin-detail-body">{children}</div>
      </aside>
    </div>
  );
}

export function AdminTabs({ tabs = [], activeTab, onChange }) {
  return (
    <div className="admin-tabs" role="tablist" aria-label="Admin tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={activeTab === tab.id ? "admin-tab active" : "admin-tab"}
          onClick={() => onChange?.(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function AdminSection({ title, children, actions = [] }) {
  return (
    <section className="admin-section">
      <div className="admin-section-header">
        <h2>{title}</h2>
        {actions.length ? (
          <div className="admin-section-actions">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                className={action.primary ? "primary-button" : "secondary-button"}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}
