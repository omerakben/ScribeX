"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import CharacterCount from "@tiptap/extension-character-count";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { useEditorStore } from "@/lib/store/editor-store";
import { streamChatCompletion, applyEdit } from "@/lib/mercury/client";
import { SlashCommandMenu } from "@/components/editor/slash-command-menu";
import type { SlashCommand } from "@/lib/types";
import type { Editor } from "@tiptap/react";

interface EditorCanvasProps {
  onEditorReady: (editor: Editor) => void;
}

export function EditorCanvas({ onEditorReady }: EditorCanvasProps) {
  const currentPaper = useEditorStore((s) => s.currentPaper);
  const setIsDirty = useEditorStore((s) => s.setIsDirty);
  const setWordCount = useEditorStore((s) => s.setWordCount);
  const setSelectedText = useEditorStore((s) => s.setSelectedText);
  const setActiveWritingMode = useEditorStore((s) => s.setActiveWritingMode);
  const setIsAIStreaming = useEditorStore((s) => s.setIsAIStreaming);
  const addAIMessage = useEditorStore((s) => s.addAIMessage);
  const updateLastAIMessage = useEditorStore((s) => s.updateLastAIMessage);
  const editorReadyRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      Placeholder.configure({
        placeholder: "Start writing, or press / for commands...",
      }),
      Highlight.configure({ multicolor: true }),
      Typography,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image,
      HorizontalRule,
      CharacterCount,
      Color,
      TextStyle,
    ],
    content: currentPaper?.content || "",
    editorProps: {
      attributes: {
        class: "tiptap",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor }) => {
      setIsDirty(true);
      const words = editor.storage.characterCount.words();
      setWordCount(words);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, " ");
        setSelectedText(text, { from, to });
      } else {
        setSelectedText("");
      }
    },
  });

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && !editorReadyRef.current) {
      editorReadyRef.current = true;
      onEditorReady(editor);
      // Set initial word count
      const words = editor.storage.characterCount.words();
      setWordCount(words);
    }
  }, [editor, onEditorReady, setWordCount]);

  // Handle slash commands
  const handleSlashCommand = useCallback(
    async (command: SlashCommand) => {
      if (!editor) return;

      const content = editor.getText();
      const { from } = editor.state.selection;

      switch (command.action) {
        case "generate":
        case "expand":
        case "outline":
        case "counter":
        case "evidence":
        case "transition":
        case "abstract": {
          setActiveWritingMode("compose");
          setIsAIStreaming(true);

          const prompts: Record<string, string> = {
            generate:
              "Generate the next paragraph continuing from the current content. Maintain the same style and tone.",
            expand:
              "Expand the current section with more detail, examples, and supporting evidence.",
            outline:
              "Generate a detailed outline for the next section of this paper.",
            counter:
              "Generate a thoughtful counter-argument to the main thesis presented.",
            evidence:
              "Find and present supporting evidence for the claims made in this paper.",
            transition:
              "Write a smooth transition paragraph connecting the current and next sections.",
            abstract:
              "Generate a concise, well-structured abstract summarizing this paper.",
          };

          let accumulated = "";
          const assistantMsg = {
            id: crypto.randomUUID(),
            role: "assistant" as const,
            content: "",
            model: "mercury-2" as const,
            timestamp: new Date().toISOString(),
            isStreaming: true,
          };
          addAIMessage(assistantMsg);

          await streamChatCompletion(
            [
              {
                role: "user",
                content: `${prompts[command.action]}\n\nCurrent paper:\n${content}`,
              },
            ],
            {
              onChunk: (text) => {
                accumulated += text;
                updateLastAIMessage(accumulated);
              },
              onDone: () => {
                setIsAIStreaming(false);
                setActiveWritingMode(null);
                // Insert generated content at cursor
                if (accumulated && editor) {
                  editor
                    .chain()
                    .focus()
                    .setTextSelection(from)
                    .insertContent(accumulated)
                    .run();
                }
              },
              onError: () => {
                setIsAIStreaming(false);
                setActiveWritingMode(null);
              },
            }
          );
          break;
        }

        case "simplify":
        case "academic": {
          // These work on selected text or current paragraph
          const { from: selFrom, to: selTo } = editor.state.selection;
          let target: string;
          let range: { from: number; to: number };

          if (selFrom !== selTo) {
            target = editor.state.doc.textBetween(selFrom, selTo, " ");
            range = { from: selFrom, to: selTo };
          } else {
            // Get current paragraph
            const $pos = editor.state.doc.resolve(selFrom);
            const parentStart = $pos.start($pos.depth);
            const parentEnd = $pos.end($pos.depth);
            target = editor.state.doc.textBetween(parentStart, parentEnd, " ");
            range = { from: parentStart, to: parentEnd };
          }

          if (!target.trim()) break;

          setActiveWritingMode("quick-edit");
          setIsAIStreaming(true);

          const instruction =
            command.action === "simplify"
              ? "Simplify this text while preserving meaning. Use clearer, shorter sentences."
              : "Elevate this text to formal academic register. Use precise terminology and proper academic conventions.";

          try {
            const result = await applyEdit(target, instruction);
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContentAt(range.from, result)
              .run();
          } catch {
            // silently fail
          }
          setIsAIStreaming(false);
          setActiveWritingMode(null);
          break;
        }

        case "cite": {
          // Open the citations tab in the AI panel
          useEditorStore.getState().setAIPanelMode("citations");
          if (!useEditorStore.getState().aiPanelOpen) {
            useEditorStore.getState().toggleAIPanel();
          }
          break;
        }

        default:
          break;
      }
    },
    [
      editor,
      setActiveWritingMode,
      setIsAIStreaming,
      addAIMessage,
      updateLastAIMessage,
    ]
  );

  if (!editor) return null;

  return (
    <div className="relative flex-1 overflow-y-auto editor-scroll-area">
      <div className="max-w-[720px] mx-auto px-8 py-12">
        <EditorContent editor={editor} />
        <SlashCommandMenu editor={editor} onCommand={handleSlashCommand} />
      </div>

      {/* Word count footer */}
      <div className="sticky bottom-0 flex justify-end px-4 py-1.5 bg-surface/80 backdrop-blur-sm border-t border-ink-100 dark:bg-surface/80 dark:border-ink-800">
        <span className="text-[11px] text-ink-400 tabular-nums">
          {editor.storage.characterCount.words().toLocaleString()} words
          {" / "}
          {editor.storage.characterCount.characters().toLocaleString()} characters
        </span>
      </div>
    </div>
  );
}
