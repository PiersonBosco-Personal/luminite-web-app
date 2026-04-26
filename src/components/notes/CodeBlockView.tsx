import { useState } from "react";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CodeBlockView({ node }: ReactNodeViewProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(node.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <NodeViewWrapper
      as="pre"
      className="code-block-wrapper relative group/codeblock"
    >
      <button
        contentEditable={false}
        onClick={handleCopy}
        className={cn(
          "absolute top-2 right-2 p-1 rounded opacity-0 group-hover/codeblock:opacity-100",
          "transition-opacity bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground",
          "text-xs flex items-center gap-1 cursor-pointer"
        )}
        title="Copy code"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3 text-primary" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" />
            Copy
          </>
        )}
      </button>
      <NodeViewContent as="code" />
    </NodeViewWrapper>
  );
}
