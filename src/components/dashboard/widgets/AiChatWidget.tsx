import { Bot } from "lucide-react";
import type { WidgetProps } from "../widgetRegistry";

export function AiChatWidget(_props: WidgetProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto px-3 pt-2 space-y-3">
        <div className="flex gap-2 items-start">
          <div className="h-6 w-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
            <Bot className="h-3 w-3 text-primary" />
          </div>
          <div className="rounded-lg rounded-tl-none bg-muted/40 border border-border/50 px-3 py-2 max-w-[80%]">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hi! I'm your project assistant. Ask me anything about this project's tasks, notes, or tech stack.
            </p>
          </div>
        </div>
      </div>
      <div className="px-3 pb-3 pt-2 border-t border-border/50">
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 h-8">
          <span className="text-xs text-muted-foreground/50 flex-1">Ask a question…</span>
        </div>
      </div>
    </div>
  );
}
