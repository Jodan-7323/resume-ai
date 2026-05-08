"use client";

import { useState, useCallback, DragEvent } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    summary: string;
    suggestions: string[];
    optimized: string;
  } | null>(null);
  const [resumeText, setResumeText] = useState("");

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".pdf") || f.name.endsWith(".docx"))) {
      setFile(f);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setResult(null);

    try {
      // Step 1: Upload PDF to backend, extract text
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      });
      const { text } = await uploadRes.json();
      setResumeText(text);

      // Step 2: Analyze with AI
      const analyzeRes = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: text }),
      });
      const data = await analyzeRes.json();
      setResult(data);
    } catch (err) {
      console.error("分析失败:", err);
      alert("分析失败，请确保后端服务已启动");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="text-center pt-16 pb-8 px-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
          AI 简历优化
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          上传你的简历，AI 深度分析评分，精准优化每一处表达，让你的简历在HR面前脱颖而出
        </p>
      </header>

      {/* Upload Area */}
      <section className="max-w-2xl mx-auto px-4 pb-12">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
            ${dragging ? "border-blue-500 bg-blue-50 scale-[1.02]" : "border-slate-200 hover:border-slate-300 bg-white"}`}
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          <input
            id="fileInput"
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={handleFileChange}
          />

          {file ? (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-700 font-medium">{file.name}</p>
              <p className="text-slate-400 text-sm">{(file.size / 1024).toFixed(1)} KB · {file.name.split(".").pop()?.toUpperCase()}</p>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-sm text-slate-400 hover:text-red-500"
              >
                移除，重新选择
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">拖拽简历到这里</p>
              <p className="text-slate-400 text-sm">支持 PDF、Word (.docx) 格式</p>
            </div>
          )}
        </div>

        {/* Analyze Button */}
        {file && (
          <div className="mt-6 text-center">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium text-lg
                hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300"
            >
              {analyzing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  AI 正在分析中...
                </span>
              ) : (
                "🔍 开始 AI 分析"
              )}
            </button>
          </div>
        )}
      </section>

      {/* Results */}
      {result && (
        <section className="max-w-3xl mx-auto px-4 pb-20 space-y-6">
          {/* Score Card */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
            <p className="text-slate-500 mb-2">简历综合评分</p>
            <div className="text-6xl font-bold text-blue-600">
              {result.score}<span className="text-2xl text-slate-300">/100</span>
            </div>
            <div className="mt-2 w-full bg-slate-100 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-red-400 via-amber-400 to-green-500 h-2.5 rounded-full transition-all duration-1000"
                style={{ width: `${result.score}%` }}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">📋 整体评价</h2>
            <p className="text-slate-600 leading-relaxed">{result.summary}</p>
          </div>

          {/* Suggestions */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">💡 优化建议</h2>
            <ul className="space-y-3">
              {result.suggestions.map((s, i) => (
                <li key={i} className="flex gap-3 text-slate-600">
                  <span className="text-amber-500 font-bold shrink-0">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Optimized Resume */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">✨ 优化后简历</h2>
            <pre className="text-slate-600 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50 p-6 rounded-xl">
              {result.optimized}
            </pre>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(result.optimized)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                📋 复制
              </button>
              <button 
                onClick={() => {
                  const blob = new Blob([result.optimized], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "优化简历.txt"; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                ⬇️ TXT
              </button>
              <button 
                onClick={async () => {
                  const resp = await fetch("http://localhost:8000/api/download", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: result.optimized, format: "docx" }),
                  });
                  const blob = await resp.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "优化简历.docx"; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📄 下载 Word
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      {!result && (
        <section className="max-w-4xl mx-auto px-4 pb-20">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "🔍", title: "深度分析", desc: "AI 从内容、结构、关键词多维度分析简历质量" },
              { icon: "✍️", title: "智能改写", desc: "优化措辞表达，突出核心竞争力，匹配岗位要求" },
              { icon: "⚡", title: "秒级响应", desc: "上传简历，即刻获得分析报告和优化建议" },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 text-center">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="text-center py-8 text-slate-400 text-sm border-t border-slate-100">
        AI简历优化 · 让你的简历更出色
      </footer>
    </div>
  );
}
