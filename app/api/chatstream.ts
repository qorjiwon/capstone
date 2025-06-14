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
      let emptyCount = 0; // 연속 빈 data: 카운트
      let isFirstChunk = true; // 첫 청크 여부 체크
      
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

            const raw = line.slice('data:'.length);

            if (raw === '[DONE]') {
              stopped = true;
              onComplete?.();
              reader.cancel();
              return;
            }

            let chunk: string;
            if (raw.startsWith('-')) {
              chunk = '\n' + raw;
              emptyCount = 0;
            }
            else if (/^[0-9]$/.test(raw)) {
              chunk = '\n' + raw;
              emptyCount = 0;
            } else if (raw === '') {
              chunk = '\n';
            } else {
              if (emptyCount >= 2) {
                chunk = '\n' + raw;
                emptyCount = 0;
              } else {
                try {
                  const parsed = JSON.parse(raw);
                  chunk = parsed.answer ?? raw;
                } catch {
                  chunk = raw;
                }
              }
            }
            if (isFirstChunk) {
              if (chunk.startsWith('\n')) {
                chunk = chunk.slice(1);
              }
              isFirstChunk = false;
            }

            onMessage(chunk);
          }
          read();
        }).catch(err => onError?.(err));
      }

      read();
    })
    .catch(err => onError?.(err));
}
