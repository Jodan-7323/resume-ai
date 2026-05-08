import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

const RESUME_ANALYSIS_PROMPT = `你是一位资深HR和简历优化专家。请分析以下简历，并严格按JSON格式返回结果。

要求：
1. score: 综合评分0-100
2. summary: 100字以内的整体评价
3. suggestions: 3-5条具体优化建议
4. optimized: 优化后的完整简历文本

⚠️ 严格约束：优化版只能基于原文已有信息进行措辞优化和结构重组。绝对禁止编造以下内容：
- 不存在的工作经历、公司名称、职位
- 不存在的项目名称、项目成果、具体数据
- 不存在的技能、证书、学历信息
- 如果原文信息不足，宁可保留原文也不可编造

返回格式（只返回JSON，不要其他内容）：
{{
  "score": 85,
  "summary": "整体评价...",
  "suggestions": ["建议1", "建议2", "建议3"],
  "optimized": "优化后的完整简历..."
}}

以下是需要分析的简历：
---
{resume_text}
---`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const resumeText: string = body.resume_text || "";

    if (!resumeText || resumeText.length < 20) {
      return NextResponse.json(
        { error: "简历内容太少，请提供完整简历" },
        { status: 400 }
      );
    }

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "AI 服务未配置" },
        { status: 500 }
      );
    }

    const prompt = RESUME_ANALYSIS_PROMPT.replace("{resume_text}", resumeText);

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "你是资深HR和简历优化专家。只返回JSON。严格基于原文优化，不得编造任何新经历、项目、技能或数据。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek API 错误:", errText);
      return NextResponse.json(
        { error: "AI 服务暂时不可用" },
        { status: 502 }
      );
    }

    const data = await response.json();
    let content: string = data.choices?.[0]?.message?.content || "";

    if (!content) {
      return NextResponse.json({ error: "AI 返回为空" }, { status: 500 });
    }

    content = content.trim();

    // Strip markdown code blocks
    if (content.startsWith("```")) {
      const lines = content.split("\n");
      if (lines[0].startsWith("```")) lines.shift();
      if (lines.length && lines[lines.length - 1].trim() === "```") lines.pop();
      content = lines.join("\n").trim();
    }

    // Extract JSON object
    const firstBrace = content.indexOf("{");
    const lastBrace = content.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      content = content.slice(firstBrace, lastBrace + 1);
    }

    const result = JSON.parse(content);

    return NextResponse.json({
      score: result.score || 70,
      summary: result.summary || "无法生成评价",
      suggestions: result.suggestions || [],
      optimized: result.optimized || resumeText,
    });
  } catch (error: any) {
    console.error("分析失败:", error);
    return NextResponse.json(
      { error: `AI分析失败: ${error.message}` },
      { status: 500 }
    );
  }
}
