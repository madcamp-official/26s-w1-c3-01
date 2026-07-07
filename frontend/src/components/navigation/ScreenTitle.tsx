import { PageHeader } from "../layout/PageHeader";

type ScreenTitleProps = {
  title: string;
  description: string;
};

export function ScreenTitle({ title, description }: ScreenTitleProps) {
  return <PageHeader title={title} description={description} />;
}
