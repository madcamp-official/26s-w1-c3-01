import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";

type PageProps = {
  className?: string;
  title?: string;
  description?: string;
  children: ReactNode;
};

export function Page({ className = "", title, description, children }: PageProps) {
  return (
    <section className={`screen ${className}`.trim()}>
      {title && description ? <PageHeader title={title} description={description} /> : null}
      {children}
    </section>
  );
}
