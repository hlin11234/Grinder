import type { Settings, WeekSummary, WeekSummaryBase, WorkSession } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getActiveSession: () => request<WorkSession | null>("/sessions/active"),
  getSession: (id: string) => request<WorkSession>(`/sessions/${id}`),
  listSessionsInRange: (from: string, to: string) =>
    request<WorkSession[]>(`/sessions?from=${from}&to=${to}`),
  startSession: (data: { category: string; description?: string; startTime?: string }) =>
    request<WorkSession>("/sessions", { method: "POST", body: JSON.stringify(data) }),
  updateSession: (
    id: string,
    data: Partial<Pick<WorkSession, "category" | "description" | "startTime" | "endTime">>
  ) => request<WorkSession>(`/sessions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteSession: (id: string) => request<void>(`/sessions/${id}`, { method: "DELETE" }),
  pauseSession: (id: string) => request<WorkSession>(`/sessions/${id}/pause`, { method: "POST" }),
  resumeSession: (id: string) =>
    request<WorkSession>(`/sessions/${id}/resume`, { method: "POST" }),
  editPause: (id: string, pauseId: string, data: { start?: string; end?: string | null }) =>
    request<WorkSession>(`/sessions/${id}/pauses/${pauseId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deletePause: (id: string, pauseId: string) =>
    request<WorkSession>(`/sessions/${id}/pauses/${pauseId}`, { method: "DELETE" }),
  addNegation: (id: string, data: { seconds: number; reason: string }) =>
    request<WorkSession>(`/sessions/${id}/negations`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteNegation: (id: string, negId: string) =>
    request<WorkSession>(`/sessions/${id}/negations/${negId}`, { method: "DELETE" }),
  endSession: (id: string, endTime?: string) =>
    request<WorkSession>(`/sessions/${id}/end`, {
      method: "POST",
      body: JSON.stringify({ endTime }),
    }),

  getWeek: (weekId: string) => request<WeekSummary>(`/weeks/${weekId}`),
  listWeeks: () => request<WeekSummaryBase[]>("/weeks"),
  getCurrentWeekId: () => request<{ weekId: string }>("/weeks/current/id"),

  getSettings: () => request<Settings>("/settings"),
  updateSettings: (data: Partial<Settings>) =>
    request<Settings>("/settings", { method: "PATCH", body: JSON.stringify(data) }),
};
