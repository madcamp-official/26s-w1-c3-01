import type { ReactNode } from "react";

type PageGridProps = {
  className?: string;
  children: ReactNode;
};

export function PageGrid({ className = "", children }: PageGridProps) {
  return <section className={`page-grid ${className}`.trim()}>{children}</section>;
}
