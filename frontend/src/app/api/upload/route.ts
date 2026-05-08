import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

export const runtime = "nodejs";

// pdf-parse has issues with Next.js edge runtime, use dynamic import with Buffer polyfill
let pdfParse: any = null;

async function getPdfParse() {
  if (!pdfParse) {
    const mod = await import("pdf-parse");
    // Handle both CJS (default) and ESM exports
    pdfParse = (mod as any).default || mod;
  }
  return pdfParse;
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parse = await getPdfParse();
  const data = await parse(buffer);
  const text = data.text || "";
  // Clean up excessive whitespace
  return text.replace(/\n{3,}/g, "\n\n").replace(/ {2,}/g, " ").trim();
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请上传文件" }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    if (!filename.endsWith(".pdf") && !filename.endsWith(".docx")) {
      return NextResponse.json({ error: "仅支持 PDF 和 Word (.docx) 文件" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length === 0) {
      return NextResponse.json({ error: "文件为空" }, { status: 400 });
    }

    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "文件过大，请上传小于10MB的文件" }, { status: 400 });
    }

    let text: string;
    if (filename.endsWith(".pdf")) {
      text = await extractTextFromPdf(buffer);
    } else {
      text = await extractTextFromDocx(buffer);
    }

    if (!text || text.length < 20) {
      return NextResponse.json(
        { error: `简历内容太少（仅${text.length}字），请上传完整简历` },
        { status: 400 }
      );
    }

    return NextResponse.json({ text, length: text.length, filename: file.name });
  } catch (error: any) {
    console.error("上传处理失败:", error);
    return NextResponse.json(
      { error: `文件处理失败: ${error.message}` },
      { status: 500 }
    );
  }
}
