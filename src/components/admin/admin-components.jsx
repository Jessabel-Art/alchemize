import { Children, cloneElement, isValidElement } from "react";
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
                className={
                  action.primary ? "primary-button" : "secondary-button"
                }
                onClick={action.onClick}
                disabled={action.disabled}
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
        {extraControls ? (
          <div className="admin-toolbar-extra">{extraControls}</div>
        ) : null}
        {actions.length ? (
          <div className="admin-toolbar-actions">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                className={
                  action.primary ? "primary-button" : "secondary-button"
                }
                onClick={action.onClick}
                disabled={action.disabled}
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
  const normalized = String(status || "")
    .toLowerCase()
    .replaceAll("_", " ");
  const semanticTone = /past due|overdue|rejected|failed/.test(normalized)
    ? "danger"
    : /waiting on client|awaiting upload|preparing|prospect|requested/.test(
          normalized,
        )
      ? "warning"
      : /active|paid|completed|received|ready for review|confirmed/.test(
            normalized,
          )
        ? "success"
        : /scheduled|issued|open|review/.test(normalized)
          ? "info"
          : "neutral";
  const className = `status-pill ${tone || semanticTone}`;
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
      <aside
        className="admin-detail-drawer"
        onClick={(event) => event.stopPropagation()}
      >
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
                className={
                  action.primary ? "primary-button" : "secondary-button"
                }
                onClick={action.onClick}
                disabled={action.disabled}
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

// Native table semantics and controls, with labels for the narrow-screen record layout.
export function AdminTable({ children, className = "admin-table", ...props }) {
  const textOf = (node) =>
    Children.toArray(node)
      .map((child) =>
        isValidElement(child)
          ? textOf(child.props.children)
          : String(child ?? ""),
      )
      .join("");
  const labels = [];
  const collect = (nodes) =>
    Children.forEach(nodes, (node) => {
      if (!isValidElement(node)) return;
      if (node.type === "th") labels.push(textOf(node.props.children));
      else collect(node.props.children);
    });
  collect(children);
  const decorate = (nodes) =>
    Children.map(nodes, (node) => {
      if (!isValidElement(node)) return node;
      if (node.type === "tr") {
        let index = 0;
        return cloneElement(
          node,
          {},
          Children.map(node.props.children, (cell) => {
            if (!isValidElement(cell) || !["td", "th"].includes(cell.type))
              return cell;
            const label = labels[index++] || "";
            return cloneElement(cell, {
              "data-label": label,
              "data-numeric":
                /^(price|subtotal|paid|outstanding|amount|balance|total|open tasks|active services)/i.test(
                  label,
                ) || undefined,
              ...(cell.type === "th" ? { scope: "col" } : {}),
            });
          }),
        );
      }
      return cloneElement(node, {}, decorate(node.props.children));
    });
  return (
    <table {...props} className={className + " admin-responsive-table"}>
      {decorate(children)}
    </table>
  );
}
export function AdminLongText({ children }) {
  return (
    <details className="admin-long-text">
      <summary>View scope / limits</summary>
      <div>{children}</div>
    </details>
  );
}
