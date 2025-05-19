// chatStream.ts
import { ChatStreamOptions } from "./type";

export function connectToChatStream({
  prompt,
  userId,
  onMessage,
  onError,
}: ChatStreamOptions): EventSource {
  const encodedPrompt = encodeURIComponent(prompt);
  const encodedUserId = encodeURIComponent(userId);
  const url = `/chat/stream?prompt=${encodedPrompt}&access=${encodedUserId}`;

  const eventSource = new EventSource(url);

  eventSource.onmessage = (event: MessageEvent) => {
    onMessage(event.data);
  };

  eventSource.onerror = (error: Event) => {
    console.error("SSE 오류:", error);
    if (onError) onError(error);
    eventSource.close(); // 필요 시 자동 종료
  };

  return eventSource;
}