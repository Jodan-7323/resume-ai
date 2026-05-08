import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph } from "docx";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text: string = body.text || "";
    const format: string = body.format || "txt";

    if (format === "docx") {
      const paragraphs = text
        .split("\n")
        .filter((line) => line.trim())
        .map(
          (line) =>
            new Paragraph({
              text: line,
              spacing: { after: 120 },
            })
        );

      const doc = new Document({
        sections: [{ properties: {}, children: paragraphs }],
      });

      const buffer = await Packer.toBuffer(doc);
      const uint8 = new Uint8Array(buffer);

      return new NextResponse(uint8, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": "attachment; filename*=UTF-8''%E4%BC%98%E5%8C%96%E7%AE%80%E5%8E%86.docx",
        },
      });
    } else {
      // TXT
      const txtBuffer = Buffer.from(text, "utf-8");
      const txtUint8 = new Uint8Array(txtBuffer);
      return new NextResponse(txtUint8, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": "attachment; filename*=UTF-8''%E4%BC%98%E5%8C%96%E7%AE%80%E5%8E%86.txt",
        },
      });
    }
  } catch (error: any) {
    console.error("下载生成失败:", error);
    return NextResponse.json(
      { error: `文件生成失败: ${error.message}` },
      { status: 500 }
    );
  }
}
