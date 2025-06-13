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

  } catch (error: unknown) {
    console.error("로그인 중 오류 발생:", (error as Error).message);
    throw error;
  }
}