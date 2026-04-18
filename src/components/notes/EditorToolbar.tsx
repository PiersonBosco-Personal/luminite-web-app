import type { Editor } from "@tiptap/react";
import {
  Bold,
  Braces,
  ChevronDown,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  editor: Editor | null;
}

const CODE_LANGUAGES = [
  { value: "plaintext", label: "Plain text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "php", label: "PHP" },
  { value: "python", label: "Python" },
  { value: "json", label: "JSON" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
];

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        "h-7 w-7 p-0 text-muted-foreground hover:text-foreground",
        active && "bg-accent/30 text-primary"
      )}
    >
      {children}
    </Button>
  );
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const isInCodeBlock = editor?.isActive("codeBlock") ?? false;
  const currentLang =
    editor?.getAttributes("codeBlock").language ?? "plaintext";

  function formatCode() {
    if (!editor || currentLang !== "json") return;

    // Walk up the tree from the cursor to find the enclosing codeBlock node
    const $from = editor.state.doc.resolve(editor.state.selection.from);
    let codeNode = null;
    let codePos = -1;
    for (let depth = $from.depth; depth >= 0; depth--) {
      if ($from.node(depth).type.name === "codeBlock") {
        codeNode = $from.node(depth);
        codePos = $from.before(depth);
        break;
      }
    }
    if (!codeNode || codePos === -1) return;

    const raw = codeNode.textContent;
    let formatted: string;
    try {
      formatted = JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return;
    }

    if (formatted === raw) return;

    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.replaceWith(
          codePos + 1,
          codePos + codeNode!.nodeSize - 1,
          editor.schema.text(formatted)
        );
        return true;
      })
      .run();
  }

  return (
    <div className="flex items-center gap-0.5 flex-wrap px-3 py-1.5 bg-card/50 flex-1 min-w-0">
      {/* Text style */}
      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleBold().run()}
        active={editor?.isActive("bold")}
        disabled={!editor}
        title="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        active={editor?.isActive("italic")}
        disabled={!editor}
        title="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleStrike().run()}
        active={editor?.isActive("strike")}
        disabled={!editor}
        title="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor?.isActive("heading", { level: 1 })}
        disabled={!editor}
        title="Heading 1"
      >
        <Heading1 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor?.isActive("heading", { level: 2 })}
        disabled={!editor}
        title="Heading 2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor?.isActive("heading", { level: 3 })}
        disabled={!editor}
        title="Heading 3"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        active={editor?.isActive("bulletList")}
        disabled={!editor}
        title="Bullet list"
      >
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        active={editor?.isActive("orderedList")}
        disabled={!editor}
        title="Ordered list"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleTaskList().run()}
        active={editor?.isActive("taskList")}
        disabled={!editor}
        title="Task list"
      >
        <ListChecks className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Blocks */}
      <ToolbarButton
        onClick={() =>
          editor?.chain().focus().toggleCodeBlock({ language: "plaintext" }).run()
        }
        active={isInCodeBlock}
        disabled={!editor}
        title="Code block"
      >
        <Code className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        active={editor?.isActive("blockquote")}
        disabled={!editor}
        title="Blockquote"
      >
        <Quote className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        disabled={!editor}
        title="Horizontal rule"
      >
        <Minus className="h-3.5 w-3.5" />
      </ToolbarButton>

      {/* Language selector + Format — only when inside a code block */}
      {isInCodeBlock && (
        <>
          <Separator orientation="vertical" className="h-5 mx-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                {CODE_LANGUAGES.find((l) => l.value === currentLang)?.label ?? "Language"}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="text-xs">
              {CODE_LANGUAGES.map((l) => (
                <DropdownMenuItem
                  key={l.value}
                  className={cn("text-xs", currentLang === l.value && "text-primary")}
                  onClick={() =>
                    editor?.chain().focus().updateAttributes("codeBlock", { language: l.value }).run()
                  }
                >
                  {l.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {currentLang === "json" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={formatCode}
              title="Format JSON"
              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <Braces className="h-3 w-3" />
              Format
            </Button>
          )}
        </>
      )}
    </div>
  );
}
