import { memo } from "react";
import { Streamdown } from "streamdown";

interface MemoizedMarkdownProps {
  content: string;
  id: string;
  isAnimating?: boolean;
}

export const MemoizedMarkdown = memo(
  ({ content, isAnimating = false }: MemoizedMarkdownProps) => (
    <div className="markdown-body">
      <Streamdown isAnimating={isAnimating}>{content}</Streamdown>
    </div>
  ),
  (prev, next) =>
    prev.content === next.content && prev.isAnimating === next.isAnimating,
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";
