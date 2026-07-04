type RecommendationResultCardProps = {
  title: string;
};

export function RecommendationResultCard({ title }: RecommendationResultCardProps) {
  return <article><h2>{title}</h2></article>;
}
