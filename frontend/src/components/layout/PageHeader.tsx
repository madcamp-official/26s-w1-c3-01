import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description: string;
  className?: string;
  children?: ReactNode;
};

export function PageHeader({ title, description, className = "", children }: PageHeaderProps) {
  return (
    <div className={`screen-title page-header ${className}`.trim()}>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children ? <div className="page-header-actions">{children}</div> : null}
    </div>
  );
}
