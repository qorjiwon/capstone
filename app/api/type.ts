export interface ChatStreamOptions {
  prompt: string;
  userId: string; // access → 사용자 ID 또는 이름으로 대체된 경우
  onMessage: (data: string) => void;
  onError?: (error: Event) => void;
}
