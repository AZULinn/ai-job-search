import { NextRequest, NextResponse } from "next/server";

const MODEL_ENDPOINTS: Record<string, string> = {
  deepseek: "https://api.deepseek.com/chat/completions",
  openai: "https://api.openai.com/v1/chat/completions",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  zhipu: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
  moonshot: "https://api.moonshot.cn/v1/chat/completions",
};

const MODEL_NAMES: Record<string, string> = {
  deepseek: "deepseek-chat",
  openai: "gpt-4o-mini",
  qwen: "qwen-plus",
  zhipu: "glm-4-flash",
  moonshot: "moonshot-v1-8k",
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      provider: string;
      apiKey: string;
      model?: string;
    };

    const { provider, apiKey, model } = body;

    if (!provider || !apiKey) {
      return NextResponse.json({ ok: false, error: "缺少 provider 或 apiKey" });
    }

    const endpoint = MODEL_ENDPOINTS[provider];
    if (!endpoint) {
      return NextResponse.json({ ok: false, error: `不支持的提供商: ${provider}` });
    }

    const modelName = model || MODEL_NAMES[provider] || "deepseek-chat";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
      return NextResponse.json({
        ok: false,
        error: err.error?.message ?? `认证失败 (${res.status})`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message || "网络错误" });
  }
}
