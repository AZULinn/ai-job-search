// 本地模式 - 不需要登录,所有数据存储在浏览器 localStorage

export interface GhUser {
  login: string;
  avatar_url: string;
  name: string | null;
  email?: string;
}

export async function signInWithGitHub() {
  // 本地模式无需登录
  console.log("本地模式无需登录");
}

export async function sendOtpCode(email: string) {
  // 本地模式无需登录
  console.log("本地模式无需登录");
}

export async function verifyOtpCode(email: string, token: string) {
  // 本地模式无需登录
  console.log("本地模式无需登录");
}

export async function signOut() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("career-search:prefs:v1");
    window.localStorage.removeItem("career-search:tracking");
    window.localStorage.removeItem("career-search:interviews");
  }
}

export async function getSession() {
  return null;
}

export async function getUser(): Promise<GhUser | null> {
  return null;
}
