export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    CREATED: "생성됨",
    COLLECTING: "참여자 입력 중",
    RECOMMENDED: "추천 완료",
    DECIDED: "메뉴 확정",
    CLOSED: "종료"
  };
  return labels[status] ?? status;
}

export function isMeetingDone(status: string) {
  return status === "DECIDED" || status === "CLOSED";
}
