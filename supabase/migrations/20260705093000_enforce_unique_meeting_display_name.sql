-- 모임 안에서만 표시 이름이 중복되지 않도록 보장합니다.
alter table public.meeting_participants
  add constraint meeting_participants_meeting_display_name_unique unique (meeting_id, display_name);
