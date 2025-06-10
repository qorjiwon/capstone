export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function login(username: string, password: string) {
  try {
    const res = await fetch(`${API_BASE_URL}api/login`, {
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
      `${API_BASE_URL}api/chat/session?userId=${userId}`,
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

  } catch (error: unknown) {
    console.error("로그인 중 오류 발생:", (error as Error).message);
    throw error;
  }
}

export async function createChatSession(userId: string): Promise<string> {
  const res = await fetch(
    `${API_BASE_URL}api/chat/session?userId=${encodeURIComponent(userId)}`,
    { method: 'POST' }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`세션 생성 실패: ${res.status} ${err}`);
  }

  const data = await res.json();
  if (!data.isSuccess) {
    throw new Error(`API 오류: ${data.message}`);
  }

  const sessionId = data.response.sessionId;
  localStorage.setItem('sessionId', sessionId);
  return sessionId;
}


export function streamChatResponse(
  question: string,
  onMessage: (msg: string) => void,
  onError?: (err: unknown) => void,
  onComplete?: () => void,
) {
  const sessionId = localStorage.getItem('sessionId');
  const accessToken = localStorage.getItem('access');

  if (!sessionId) throw new Error('세션 ID가 없습니다. 먼저 세션을 생성해주세요.');
  if (!accessToken) throw new Error('액세스 토큰이 없습니다. 로그인 후 다시 시도해주세요.');

  fetch(`${API_BASE_URL}api/chat/stream?sessionId=${encodeURIComponent(sessionId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      chatUserRequest: { question }
    })
  })
    .then(res => {
      if (!res.ok) throw new Error(`스트리밍 요청 실패: ${res.statusText}`);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      function read() {
        reader.read().then(({ done, value }) => {
          if (done) {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            onComplete && onComplete();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          // SSE 형식(data: ...) 파싱
          const lines = buffer.split('\n');
          buffer = lines.pop()!;  // 마지막 줄은 불완전할 수 있으므로 다음 청크로 남겨둠

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const payload = line.replace(/^data:\s*/, '');
              if (payload === '[DONE]') {
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                onComplete && onComplete();
                return;
              }
              try {
                const json = JSON.parse(payload);
                // 예: { timeout: 0 } 또는 { chatId, answer, createdAt } 구조
                onMessage(JSON.stringify(json));
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              } catch (e) {
                console.warn('파싱 실패:', payload);
              }
            }
          }
          read();
        }).catch(err => {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          onError && onError(err);
        });
      }

      read();
    })
    .catch(err => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      onError && onError(err);
    });
}