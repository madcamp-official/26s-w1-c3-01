import { useCallback, useRef, useState } from "react";
import { meetingsApi } from "../../api/meetings.api";
import { mapCreatedMeeting, mapRecommendations, type DisplayMeeting, type DisplayRecommendation } from "../../domain/mapper";

export function useMeetings() {
  const meetingRecommendationsCacheRef = useRef(new Map<number, DisplayRecommendation[]>());
  const [meetingItems, setMeetingItems] = useState<DisplayMeeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<DisplayMeeting | null>(null);
  const [guestPreviewMeeting, setGuestPreviewMeeting] = useState<DisplayMeeting | null>(null);
  const [meetingRecommendations, setMeetingRecommendations] = useState<DisplayRecommendation[]>([]);
  const [selectedMeetingRecommendation, setSelectedMeetingRecommendation] =
    useState<DisplayRecommendation | null>(null);
  const [excludedMeetingUserIds, setExcludedMeetingUserIds] = useState<number[]>([]);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [meetingSaving, setMeetingSaving] = useState(false);
  const [meetingActionLoading, setMeetingActionLoading] = useState(false);

  const replaceMeetings = useCallback((meetings: DisplayMeeting[]) => {
    setMeetingItems(meetings);
  }, []);

  const upsertMeeting = useCallback((meeting: DisplayMeeting) => {
    if (!meeting.id) return;
    setMeetingItems((current) => {
      const exists = current.some((item) => item.id === meeting.id);
      if (!exists) return [meeting, ...current];
      return current.map((item) => (item.id === meeting.id ? { ...item, ...meeting } : item));
    });
  }, []);

  const clearMeetingRecommendations = useCallback(() => {
    setMeetingRecommendations([]);
    setSelectedMeetingRecommendation(null);
  }, []);

  const clearActiveMeetingState = useCallback(() => {
    setSelectedMeeting(null);
    meetingRecommendationsCacheRef.current.clear();
    setGuestPreviewMeeting(null);
    setMeetingRecommendations([]);
    setSelectedMeetingRecommendation(null);
    setExcludedMeetingUserIds([]);
  }, []);

  const resetMeetingState = useCallback(() => {
    clearActiveMeetingState();
    setMeetingItems([]);
    setMeetingDialogOpen(false);
    setMeetingSaving(false);
    setMeetingActionLoading(false);
  }, [clearActiveMeetingState]);

  const applySelectedMeetingPayload = useCallback(
    (payload: unknown) => {
      const meeting = mapCreatedMeeting((payload as any)?.meeting ?? payload);
      setSelectedMeeting(meeting.id ? meeting : null);
      upsertMeeting(meeting);
      return meeting;
    },
    [upsertMeeting]
  );

  const restoreMeetingDetail = useCallback(async (meetingId: number, selectedMenuId?: number) => {
    const meeting = mapCreatedMeeting(await meetingsApi.get(meetingId));
    setSelectedMeeting(meeting.id ? meeting : null);
    setMeetingRecommendations([]);
    setSelectedMeetingRecommendation(null);
    setExcludedMeetingUserIds([]);

    try {
      const latest = mergeRecommendationScores(
        mapRecommendations(await meetingsApi.getLatestRecommendation(meetingId)),
        meetingRecommendationsCacheRef.current.get(meetingId) ?? []
      );
      meetingRecommendationsCacheRef.current.set(meetingId, latest);
      setMeetingRecommendations(latest);
      setSelectedMeetingRecommendation(latest.find((item) => item.menuId === selectedMenuId) ?? null);
    } catch {
      setMeetingRecommendations([]);
    }

    return meeting;
  }, []);

  const openMeeting = useCallback(async (meeting: DisplayMeeting) => {
    setSelectedMeeting(meeting);
    setMeetingRecommendations([]);
    setSelectedMeetingRecommendation(null);
    setExcludedMeetingUserIds([]);
    if (!meeting.id) return;

    const cachedRecommendations = meetingRecommendationsCacheRef.current.get(meeting.id);
    if (cachedRecommendations) {
      setMeetingRecommendations(cachedRecommendations);
      return;
    }

    try {
      const latest = mergeRecommendationScores(
        mapRecommendations(await meetingsApi.getLatestRecommendation(meeting.id)),
        meetingRecommendationsCacheRef.current.get(meeting.id) ?? []
      );
      meetingRecommendationsCacheRef.current.set(meeting.id, latest);
      setMeetingRecommendations(latest);
    } catch {
      setMeetingRecommendations([]);
    }
  }, []);

  const previewGuestMeeting = useCallback(async (meetingId: number) => {
    const meeting = mapCreatedMeeting(await meetingsApi.preview(meetingId));
    setGuestPreviewMeeting(meeting);
    return meeting;
  }, []);

  const syncSelectedMeetingDetail = useCallback(async () => {
    if (!selectedMeeting?.id) return null;

    const previousMeeting = selectedMeeting;
    const nextMeeting = mapCreatedMeeting(await meetingsApi.get(selectedMeeting.id));
    setSelectedMeeting(nextMeeting.id ? nextMeeting : null);
    setMeetingItems((current) =>
      current.map((meeting) => (meeting.id === nextMeeting.id ? { ...meeting, ...nextMeeting } : meeting))
    );

    try {
      const latest = mergeRecommendationScores(
        mapRecommendations(await meetingsApi.getLatestRecommendation(selectedMeeting.id)),
        meetingRecommendationsCacheRef.current.get(selectedMeeting.id) ?? meetingRecommendations
      );
      meetingRecommendationsCacheRef.current.set(selectedMeeting.id, latest);
      setMeetingRecommendations(latest);
      setSelectedMeetingRecommendation((current) =>
        current?.menuId ? latest.find((item) => item.menuId === current.menuId) ?? current : current
      );
    } catch {
      if (nextMeeting.status === "CREATED") {
        setMeetingRecommendations([]);
        setSelectedMeetingRecommendation(null);
      }
    }

    return { previousMeeting, nextMeeting };
  }, [selectedMeeting]);

  const applyMeetingRecommendationPayload = useCallback((meetingId: number, payload: unknown) => {
    const nextRecommendations = mapRecommendations(payload);
    meetingRecommendationsCacheRef.current.set(meetingId, nextRecommendations);
    setMeetingRecommendations(nextRecommendations);
    setSelectedMeetingRecommendation(null);
    setSelectedMeeting((current) =>
      current ? { ...current, status: nextRecommendations.length ? "RECOMMENDED" : current.status } : current
    );
    setMeetingItems((current) =>
      current.map((meeting) =>
        meeting.id === meetingId
          ? { ...meeting, status: nextRecommendations.length ? "RECOMMENDED" : meeting.status }
          : meeting
      )
    );
    return nextRecommendations;
  }, []);

  const applyDecidedMeetingPayload = useCallback((meetingId: number, payload: unknown, selectedMenuId: number) => {
    meetingRecommendationsCacheRef.current.delete(meetingId);
    const updatedMeeting = mapCreatedMeeting(payload);
    setSelectedMeeting((current) =>
      current
        ? {
            ...current,
            ...updatedMeeting,
            status: "DECIDED",
            selectedMenuId
          }
        : updatedMeeting
    );
    setMeetingItems((current) =>
      current.map((meeting) =>
        meeting.id === meetingId
          ? { ...meeting, ...updatedMeeting, status: "DECIDED", selectedMenuId }
          : meeting
      )
    );
    return updatedMeeting;
  }, []);

  return {
    meetingItems,
    replaceMeetings,
    selectedMeeting,
    setSelectedMeeting,
    guestPreviewMeeting,
    meetingRecommendations,
    selectedMeetingRecommendation,
    setSelectedMeetingRecommendation,
    excludedMeetingUserIds,
    setExcludedMeetingUserIds,
    meetingDialogOpen,
    setMeetingDialogOpen,
    meetingSaving,
    setMeetingSaving,
    meetingActionLoading,
    setMeetingActionLoading,
    upsertMeeting,
    clearMeetingRecommendations,
    clearActiveMeetingState,
    resetMeetingState,
    applySelectedMeetingPayload,
    restoreMeetingDetail,
    openMeeting,
    previewGuestMeeting,
    syncSelectedMeetingDetail,
    applyMeetingRecommendationPayload,
    applyDecidedMeetingPayload
  };
}

function mergeRecommendationScores(next: DisplayRecommendation[], previous: DisplayRecommendation[]) {
  if (!previous.length) return next;
  const previousByMenuId = new Map(previous.map((item) => [item.menuId, item]));

  return next.map((item) => {
    if (hasScoreBreakdown(item)) return item;
    const previousItem = previousByMenuId.get(item.menuId);
    return previousItem?.scores ? { ...item, scores: previousItem.scores } : item;
  });
}

function hasScoreBreakdown(item: DisplayRecommendation) {
  return Boolean(
    item.scores &&
      Object.values(item.scores).some((value) => typeof value === "number")
  );
}
