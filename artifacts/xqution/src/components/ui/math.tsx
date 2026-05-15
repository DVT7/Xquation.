import katex from "katex";

interface MathProps {
  math: string;
  className?: string;
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
