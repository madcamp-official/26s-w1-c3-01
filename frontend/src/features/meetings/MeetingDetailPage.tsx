import { MeetingRecommendationPanel } from "./MeetingRecommendationPanel";
import { ParticipantList } from "./ParticipantList";

export function MeetingDetailPage() {
  return (
    <section>
      <h1>모임 상세</h1>
      <ParticipantList />
      <MeetingRecommendationPanel />
    </section>
  );
}
