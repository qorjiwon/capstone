import { ChatStreamOptions } from "./type";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function login(username: string, password: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`로그인 실패: ${errorData.message || res.statusText}`);
    }

    const data = await res.json();
    const userId = data.response.userId;
    const accessToken = res.headers.get("access");

    if (!accessToken) {
      throw new Error("서버가 JWT 토큰을 반환하지 않았습니다.");
    }

    const sessionRes = await fetch(
      `${API_BASE_URL}/chat/session?userId=${userId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
      }
    );

    if (!sessionRes.ok) {
      const errorData = await sessionRes.json().catch(() => ({}));
      throw new Error(`세션 생성 실패: ${errorData.message || sessionRes.statusText}`);
    }

    const sessionData = await sessionRes.json();
    const sessionId = sessionData.response.sessionId;

    localStorage.setItem("access", accessToken);
    localStorage.setItem("userId", userId);
    localStorage.setItem("sessionId", sessionId);

    console.log("로그인 성공!");

  } catch (error: any) {
    console.error("로그인 중 오류 발생:", error.message);
    throw error;
  }
}

export function connectToChatStream({
  prompt,
  onMessage,
}: ChatStreamOptions): EventSource {
  const encodedPrompt = encodeURIComponent(prompt);
  const sessionId = localStorage.getItem("sessionId");
  const accessToken = localStorage.getItem("access");

  const url = `${API_BASE_URL}/chat/stream?prompt=${encodedPrompt}&access=${accessToken}`;
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

export async function sendBasicChat(question: string): Promise<{
  chatId: string;
  answer: string;
  createdAt: string;
}> {
  try {
    const sessionId = localStorage.getItem("sessionId");
    const accessToken = localStorage.getItem("access");

    if (!sessionId) {
      throw new Error("세션 ID가 없습니다. 먼저 로그인해주세요.");
    }
    if (!accessToken) {
      throw new Error("액세스 토큰이 없습니다. 먼저 로그인해주세요.");
    }

    const res = await fetch(`${API_BASE_URL}/chat/basic?sessionId=${sessionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        question,
        accessKey: accessToken
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`채팅 요청 실패: ${errorData.message || res.statusText}`);
    }

    const data = await res.json();

    if (!data.isSuccess) {
      throw new Error(`API 오류: ${data.message || 'Unknown error'}`);
    }

    return data.response;

  } catch (error: any) {
    console.error("채팅 요청 중 오류 발생:", error.message);
    throw error;
  }
}