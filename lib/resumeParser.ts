import mammoth from "mammoth";
import type { Experience } from "./types";

export type ResumeFormat = "pdf" | "docx" | "txt" | "unknown";

export interface ParsedResume {
  text: string;
  format: ResumeFormat;
  fileName: string;
  school?: string;
  major?: string;
  degree?: string;
  skills: string[];
  targetRoles: string[];
  strengths: string[];
  weaknesses: string[];
  summary: string;
  experience?: string[];
  experiences?: Experience[];
}

export function detectFormat(fileName: string): ResumeFormat {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx") || lower.endsWith(".doc")) return "docx";
  if (lower.endsWith(".txt") || lower.endsWith(".md")) return "txt";
  return "unknown";
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    textParts.push(pageText);
  }
  return textParts.join("\n\n");
}

export function extractKeywordsLocal(text: string): string[] {
  const techKeywords = [
    "Python", "Java", "JavaScript", "TypeScript", "React", "Vue", "Node.js",
    "Go", "Rust", "C++", "C#", "Swift", "Kotlin", "Ruby", "PHP", "Scala",
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Linux", "Git",
    "TensorFlow", "PyTorch", "AI", "ML", "NLP", "CV", "数据分析",
    "机器学习", "深度学习", "计算机视觉", "自然语言处理",
    "产品", "产品设计", "用户体验", "UX", "UI", "Figma",
    "项目管理", "敏捷", "Scrum", "Agile",
    "沟通", "团队协作", "领导力", "问题解决", "分析能力",
  ];

  const found = new Set<string>();
  for (const kw of techKeywords) {
    if (text.toLowerCase().includes(kw.toLowerCase())) {
      found.add(kw);
    }
  }

  const chineseTerms = text.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
  const termCounts = new Map<string, number>();
  for (const term of chineseTerms) {
    termCounts.set(term, (termCounts.get(term) || 0) + 1);
  }
  const sortedTerms = [...termCounts.entries()]
    .filter(([term, count]) => count >= 2 && term.length >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([term]) => term);

  return [...found, ...sortedTerms].slice(0, 30);
}

export async function parseResumeWithAI(text: string): Promise<ParsedResume> {
  const { callDeepSeek } = await import("./deepseek");
  const systemPrompt = `你是一位简历分析助手。从简历文本中提取信息，输出 JSON 格式。

输出 JSON 结构：
{
  "school": "学校名",
  "major": "专业",
  "degree": "学位（本科/硕士/博士）",
  "skills": ["技能1", "技能2"],
  "targetRoles": ["推荐岗位1", "推荐岗位2"],
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["待提升1", "待提升2"],
  "summary": "一句话总结"
}`;

  const userPrompt = `简历内容：\n${text}\n\n请分析这份简历，输出 JSON。`;

  const result = await callDeepSeek<ParsedResume>(systemPrompt, userPrompt);
  return {
    text,
    format: "txt",
    fileName: "pasted-resume",
    school: result.school || "",
    major: result.major || "",
    degree: result.degree || "",
    skills: result.skills || [],
    targetRoles: result.targetRoles || [],
    strengths: result.strengths || [],
    weaknesses: result.weaknesses || [],
    summary: result.summary || "",
  };
}

export async function parseResumeFile(file: File): Promise<ParsedResume> {
  const format = detectFormat(file.name);
  let text: string;
  if (format === "pdf") {
    text = await extractPdfText(file);
  } else if (format === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    text = result.value;
  } else if (format === "txt") {
    text = await file.text();
  } else {
    throw new Error("不支持的文件格式，请上传 PDF、DOCX 或 TXT 文件");
  }
  if (!text || text.trim().length < 50) {
    throw new Error("文件内容过少或解析失败，请检查文件");
  }
  return { text: text.trim(), format, fileName: file.name, skills: [], targetRoles: [], strengths: [], weaknesses: [], summary: "" };
}
