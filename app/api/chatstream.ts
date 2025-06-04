import { ChatStreamOptions } from "./type";
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  const userId = data.response.userId;
  const accessToken = res.headers.get("access");

  const sessionRes = await fetch(
    `${API_BASE_URL}/chat/session?userId=${userId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
    });

  const sessionData = await sessionRes.json();
  const sessionId = sessionData.response.sessionId;

  localStorage.setItem("access", accessToken ?? "");
  localStorage.setItem("userId", userId);
  localStorage.setItem("sessionId", sessionId);
}


export function connectToChatStream({
  prompt,
  onMessage,
}: ChatStreamOptions): EventSource {
  const accessToken = localStorage.getItem("access");
  const encodedPrompt = encodeURIComponent(prompt);
  const encodedAccess = encodeURIComponent(accessToken ?? "");

  const url = `${API_BASE_URL}/chat/stream?prompt=${encodedPrompt}&access=${encodedAccess}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event: MessageEvent) => {
    onMessage(event.data);
  };

  eventSource.onerror = (event) => {
    if (eventSource.readyState === EventSource.CLOSED) {
      console.log("✅ SSE 정상 종료");
    } else {
      console.error("❌ SSE 종료", event);
    }
    eventSource.close();
  };
  

  return eventSource;
}