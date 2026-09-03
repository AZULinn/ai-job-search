import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

let isCrawling = false;
let lastCrawlResult: { success: boolean; message: string; timestamp: number } | null = null;

export async function POST() {
  // 防止重复执行
  if (isCrawling) {
    return NextResponse.json(
      { ok: false, error: "爬虫正在运行中，请稍后再试" },
      { status: 409 }
    );
  }

  isCrawling = true;
  const startTime = Date.now();

  try {
    const result = await new Promise<{ success: boolean; message: string }>((resolve, reject) => {
      const child = spawn("npx", ["tsx", "scripts/crawl.ts"], {
        cwd: path.resolve(process.cwd()),
        shell: true,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve({ success: true, message: stdout || "爬虫执行完成" });
        } else {
          reject(new Error(stderr || `爬虫退出码: ${code}`));
        }
      });

      child.on("error", (err) => {
        reject(err);
      });

      // 超时处理 (5 分钟)
      setTimeout(() => {
        child.kill();
        reject(new Error("爬虫执行超时（5 分钟）"));
      }, 5 * 60 * 1000);
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    lastCrawlResult = {
      success: true,
      message: `爬虫执行成功，耗时 ${duration} 秒`,
      timestamp: Date.now(),
    };

    return NextResponse.json({
      ok: true,
      message: lastCrawlResult.message,
      duration: `${duration}s`,
    });
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    lastCrawlResult = {
      success: false,
      message: (error as Error).message,
      timestamp: Date.now(),
    };

    return NextResponse.json(
      { ok: false, error: lastCrawlResult.message, duration: `${duration}s` },
      { status: 500 }
    );
  } finally {
    isCrawling = false;
  }
}

export async function GET() {
  return NextResponse.json({
    isCrawling,
    lastResult: lastCrawlResult,
  });
}
