import { Mark, mergeAttributes } from "@tiptap/core";

export type FontSizeValue = "0.8em" | "1.2em" | "1.5em" | null;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: FontSizeValue) => ReturnType;
    };
  }
}

export const FontSize = Mark.create({
  name: "fontSize",

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
        renderHTML: (attrs) =>
          attrs.size ? { style: `font-size: ${attrs.size}` } : {},
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (el) => {
          const s = (el as HTMLElement).style.fontSize;
          return s ? { size: s } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontSize:
        (size) =>
        ({ chain }) =>
          size
            ? chain().setMark(this.name, { size }).run()
            : chain().unsetMark(this.name).run(),
    };
  },
});
