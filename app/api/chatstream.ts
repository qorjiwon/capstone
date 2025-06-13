export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function createChatSession(userId: string): Promise<string> {
  const res = await fetch(
    `${API_BASE_URL}/chat/session?userId=${encodeURIComponent(userId)}`,
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


// api/chatstream.ts
export function streamChatResponse(
  question: string,
  onMessage: (chunk: string) => void,      // ← 변경: setMessages → onMessage
  onError?: (err: unknown) => void,
  onComplete?: () => void,
) {
  const sessionId = localStorage.getItem('sessionId');
  const accessToken = localStorage.getItem('access');
  if (!sessionId) throw new Error('세션 ID가 없습니다.');
  if (!accessToken) throw new Error('액세스 토큰이 없습니다.');

  fetch(`${API_BASE_URL}/chat/stream?sessionId=${sessionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ question })
  })
    .then(res => {
      if (!res.ok) throw new Error(res.statusText);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let stopped = false;

      function read() {
        reader.read().then(({ done, value }) => {
          if (done || stopped) {
            onComplete?.();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop()!;

          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const raw = line.substring(5);       // data: 이후부터 그대로
            if (raw === '[DONE]') {
              stopped = true;
              onComplete?.();
              reader.cancel();
              return;
            }
            let chunk: string;
            try {
              const parsed = JSON.parse(raw);
              chunk = parsed.answer ?? raw;
            } catch {
              chunk = raw;
            }
            onMessage(chunk);                    // ← React 상태 업데이트는 여기서 하지 않음
          }
          read();
        }).catch(err => onError?.(err));
      }

      read();
    })
    .catch(err => onError?.(err));
}
