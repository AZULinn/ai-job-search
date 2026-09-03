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
  openai: "gpt-5.6-luna",
  qwen: "qwen3.7-plus",
  zhipu: "glm-5.3-flash",
  moonshot: "kimi-k3",
};

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  provider: string;
  apiKey: string;
  model?: string;
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest;
    const { provider, apiKey, system, user, maxTokens = 3000, temperature = 0.3 } = body;

    if (!provider || !apiKey) {
      return NextResponse.json({ error: "缺少 provider 或 apiKey" }, { status: 400 });
    }

    const endpoint = MODEL_ENDPOINTS[provider];
    if (!endpoint) {
      return NextResponse.json({ error: `不支持的模型提供商: ${provider}` }, { status: 400 });
    }

    const modelName = body.model || MODEL_NAMES[provider] || "deepseek-chat";

    // Kimi K3 only allows temperature 1
    const finalTemperature = modelName === "kimi-k3" ? 1 : temperature;

    const messages: ChatMessage[] = [
      { role: "system", content: system },
      { role: "user", content: user.slice(0, 8000) },
    ];

    console.log("[AI] Sending request to:", endpoint);
    console.log("[AI] Model:", modelName);
    console.log("[AI] Temperature:", finalTemperature);
    console.log("[AI] System prompt length:", system.length);
    console.log("[AI] User message length:", user.length);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: finalTemperature,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.error("[AI] DeepSeek error:", res.status, errBody);
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
      return NextResponse.json(
        { error: err.error?.message ?? `AI 调用失败 (${res.status})` },
        { status: res.status },
      );
    }

    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    const content = data.choices[0]?.message?.content ?? "";

    if (!content) {
      console.error("[AI] Empty content:", JSON.stringify(data));
      return NextResponse.json(
        { error: "AI 返回内容为空", raw: JSON.stringify(data) },
        { status: 502 },
      );
    }

    console.log("[AI] Provider:", provider, "Model:", modelName, "Content length:", content.length);
    console.log("[AI] Raw content (first 300 chars):", content.slice(0, 300));
    console.log("[AI] Raw content (last 100 chars):", content.slice(-100));

    // 去除 markdown 代码块包裹
    let jsonStr = content
      .replace(/^```(?:json)?\s*\n?/g, "")
      .replace(/\n?```\s*$/g, "")
      .trim();

    // 尝试直接解析
    try {
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json(parsed);
    } catch (e) {
      console.error("[AI] JSON parse failed, attempting extraction. Error:", (e as Error).message);
    }

    // 尝试提取最外层 JSON 对象
    const braceStart = jsonStr.indexOf("{");
    const braceEnd = jsonStr.lastIndexOf("}");
    if (braceStart !== -1 && braceEnd > braceStart) {
      const extracted = jsonStr.slice(braceStart, braceEnd + 1);
      try {
        const parsed = JSON.parse(extracted);
        return NextResponse.json(parsed);
      } catch (e) {
        console.error("[AI] Extracted JSON parse failed. Error:", (e as Error).message);
      }
    }

    // 最后尝试：修复常见 JSON 问题（未闭合的字符串）
    if (braceStart !== -1 && braceEnd > braceStart) {
      let fixable = jsonStr.slice(braceStart, braceEnd + 1);
      // 如果最后一个 } 前面有未闭合的引号，尝试闭合
      const lastQuote = fixable.lastIndexOf('"');
      if (lastQuote > braceEnd - 10) {
        // 可能是被截断的 JSON
        fixable = fixable.slice(0, lastQuote + 1) + "}";
      }
      try {
        const parsed = JSON.parse(fixable);
        return NextResponse.json(parsed);
      } catch {}
    }

    return NextResponse.json(
      { error: "AI 返回格式异常，请重试", raw: content.slice(0, 500) },
      { status: 502 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "服务端错误" },
      { status: 500 },
    );
  }
}
