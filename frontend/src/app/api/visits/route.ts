// 简易访问统计 - 显示在页面底部
// 用 globalThis 存储（同一部署内共享，重新部署会重置）
const COUNTER_KEY = "resume-ai-visits";

declare global {
  var __visitCount: number | undefined;
}

export async function GET() {
  // 使用 globalThis 持久化计数（同一 serverless 实例内有效）
  if (typeof globalThis.__visitCount === "undefined") {
    globalThis.__visitCount = 0;
  }
  globalThis.__visitCount++;

  return Response.json({
    visits: globalThis.__visitCount,
    message: "✅ AI简历优化运行中",
  });
}
