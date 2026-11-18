// Panel is a reusable white card with a title header
export default function Panel({ title, eyebrow, action, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
        </div>
        {action && <span className="panel-action">{action}</span>}
      </div>
      {children}
    </section>
  );
}
