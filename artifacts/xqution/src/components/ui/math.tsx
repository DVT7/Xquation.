import katex from "katex";
import { colorizeLatex } from "@/lib/colorize-latex";

interface MathProps {
  math: string;
  className?: string;
}

interface ColoredMathProps extends MathProps {
  variables?: string | null;
}

export function BlockMath({ math, className }: MathProps) {
  let html = "";
  try {
    html = katex.renderToString(math, { displayMode: true, throwOnError: false });
  } catch {
    html = `<span class="text-red-400 text-sm">${math}</span>`;
  }
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function ColoredBlockMath({ math, variables, className }: ColoredMathProps) {
  const coloredMath = colorizeLatex(math, variables);
  let html = "";
  try {
    html = katex.renderToString(coloredMath, { displayMode: true, throwOnError: false, trust: true, strict: false });
  } catch {
    // Fall back to uncolored if colorization breaks KaTeX
    try {
      html = katex.renderToString(math, { displayMode: true, throwOnError: false });
    } catch {
      html = `<span class="text-red-400 text-sm">${math}</span>`;
    }
  }
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function InlineMath({ math, className }: MathProps) {
  let html = "";
  try {
    html = katex.renderToString(math, { displayMode: false, throwOnError: false });
  } catch {
    html = `<span class="text-red-400 text-sm">${math}</span>`;
  }
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
