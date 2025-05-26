// chatStream.ts
import { ChatStreamOptions } from "./type";

// 로그인 + 세션 생성
export async function login(username: string, password: string) {
  const res = await fetch("http://52.79.85.132:8080/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  const userId = data.response.userId;
  const accessToken = res.headers.get("access");


  const sessionRes = await fetch(
    `http://52.79.85.132:8080/api/chat/session?userId=${userId}`,
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


// 챗봇 스트리밍 연결
export function connectToChatStream({
  prompt,
  onMessage,
}: ChatStreamOptions): EventSource {
  const accessToken = localStorage.getItem("access");
  const encodedPrompt = encodeURIComponent(prompt);
  const encodedAccess = encodeURIComponent(accessToken ?? "");

  const url = `http://52.79.85.132:8080/api/chat/stream?prompt=${encodedPrompt}&access=${encodedAccess}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event: MessageEvent) => {
    // const cleaned = event.data.replace(/^"|"$/g, '');
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