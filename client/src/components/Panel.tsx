import type { ReactNode } from "react";
import "./Panel.css";

export function Panel({
  title,
  right,
  children,
  className,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className ?? ""}`}>
      <header className="panel-header">
        <span className="panel-title">{title}</span>
        {right && <span className="panel-header-right">{right}</span>}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}
