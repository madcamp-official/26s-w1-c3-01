type ScreenTitleProps = {
  title: string;
  description: string;
};

export function ScreenTitle({ title, description }: ScreenTitleProps) {
  return (
    <div className="screen-title">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
