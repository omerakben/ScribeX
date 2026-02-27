"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  ClipboardCheck,
  BookOpen,
  ListTree,
  Send,
  Loader2,
  Sparkles,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils/cn";
import { useEditorStore } from "@/lib/store/editor-store";
import { streamChatCompletion } from "@/lib/mercury/client";
import { CitationSearch } from "@/components/editor/citation-search";
import type { AIPanelMode, AIMessage, Citation } from "@/lib/types";
import type { Editor } from "@tiptap/react";

interface AIPanelProps {
  editor: Editor | null;
}

// ─── Chat Tab ───────────────────────────────────────────────

function ChatTab({ editor }: { editor: Editor | null }) {
  const aiMessages = useEditorStore((s) => s.aiMessages);
  const isAIStreaming = useEditorStore((s) => s.isAIStreaming);
  const addAIMessage = useEditorStore((s) => s.addAIMessage);
  const updateLastAIMessage = useEditorStore((s) => s.updateLastAIMessage);
  const setIsAIStreaming = useEditorStore((s) => s.setIsAIStreaming);
  const clearAIMessages = useEditorStore((s) => s.clearAIMessages);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isAIStreaming) return;

    const editorContent = editor?.getText() ?? "";

    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    addAIMessage(userMessage);
    setInput("");

    const assistantMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      model: "mercury-2",
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };
    addAIMessage(assistantMessage);
    setIsAIStreaming(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = "";

    const contextMessages = [
      ...aiMessages
        .filter((m) => !m.isStreaming)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      {
        role: "user" as const,
        content: editorContent
          ? `[Current paper content]:\n${editorContent}\n\n[User question]:\n${trimmed}`
          : trimmed,
      },
    ];

    await streamChatCompletion(contextMessages, {
      onChunk: (text) => {
        accumulated += text;
        updateLastAIMessage(accumulated);
      },
      onDone: () => {
        setIsAIStreaming(false);
      },
      onError: (error) => {
        updateLastAIMessage(
          accumulated || `Error: ${error.message}`
        );
        setIsAIStreaming(false);
      },
      signal: controller.signal,
    });
  }, [
    input,
    isAIStreaming,
    editor,
    aiMessages,
    addAIMessage,
    updateLastAIMessage,
    setIsAIStreaming,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {aiMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-ink-400">
            <Sparkles className="h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm font-medium">Ask Mercury anything</p>
            <p className="text-xs mt-1 text-center max-w-[240px]">
              Your full paper is included as context for every message.
            </p>
          </div>
        )}

        {aiMessages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col gap-1",
              msg.role === "user" ? "items-end" : "items-start"
            )}
          >
            <div
              className={cn(
                "rounded-lg px-3 py-2 text-sm max-w-[90%] whitespace-pre-wrap break-words",
                msg.role === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-ink-100 text-ink-900 dark:bg-ink-800 dark:text-ink-100"
              )}
            >
              {msg.content || (
                <span className="flex items-center gap-1.5 text-ink-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking...
                </span>
              )}
            </div>
            {msg.role === "assistant" && msg.model && (
              <Badge variant="mercury" className="text-[9px] px-1 py-0">
                {msg.model === "mercury-2" ? "Mercury 2" : "Mercury Edit"}
              </Badge>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Clear + Input */}
      <div className="border-t border-ink-200 dark:border-ink-700 p-3 space-y-2">
        {aiMessages.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-ink-500 gap-1"
              onClick={clearAIMessages}
              disabled={isAIStreaming}
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your paper..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-ink-300 bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:border-ink-600 dark:bg-surface-secondary dark:text-ink-100 placeholder:text-ink-400"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isAIStreaming}
            className="h-9 w-9 shrink-0"
            aria-label="Send message"
          >
            {isAIStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Review Tab ─────────────────────────────────────────────

interface ReviewCategory {
  label: string;
  score: number;
  feedback: string;
}

function ReviewTab({ editor }: { editor: Editor | null }) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [results, setResults] = useState<ReviewCategory[]>([]);
  const setActiveWritingMode = useEditorStore((s) => s.setActiveWritingMode);
  const setIsAIStreaming = useEditorStore((s) => s.setIsAIStreaming);

  const handleReview = useCallback(async () => {
    if (!editor) return;
    const content = editor.getText();
    if (!content.trim()) return;

    setIsReviewing(true);
    setActiveWritingMode("review");
    setIsAIStreaming(true);

    let accumulated = "";
    await streamChatCompletion(
      [
        {
          role: "user",
          content: `Review this academic paper and provide feedback in exactly this JSON format (no other text):
[
  {"label": "Structure", "score": <1-10>, "feedback": "<2-3 sentences>"},
  {"label": "Argument Flow", "score": <1-10>, "feedback": "<2-3 sentences>"},
  {"label": "Tone", "score": <1-10>, "feedback": "<2-3 sentences>"},
  {"label": "Citations", "score": <1-10>, "feedback": "<2-3 sentences>"}
]

Paper:
${content}`,
        },
      ],
      {
        onChunk: (text) => {
          accumulated += text;
        },
        onDone: () => {
          try {
            // Try to extract JSON from the response
            const jsonMatch = accumulated.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              setResults(parsed);
            }
          } catch {
            setResults([
              {
                label: "Review",
                score: 0,
                feedback: "Could not parse review results. Please try again.",
              },
            ]);
          }
          setIsReviewing(false);
          setIsAIStreaming(false);
          setActiveWritingMode(null);
        },
        onError: () => {
          setResults([
            {
              label: "Error",
              score: 0,
              feedback: "Failed to complete review. Please try again.",
            },
          ]);
          setIsReviewing(false);
          setIsAIStreaming(false);
          setActiveWritingMode(null);
        },
      }
    );
  }, [editor, setActiveWritingMode, setIsAIStreaming]);

  const scoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 5) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="p-3 space-y-3 overflow-y-auto h-full">
      <Button
        onClick={handleReview}
        disabled={isReviewing}
        loading={isReviewing}
        variant="mercury"
        className="w-full"
        size="sm"
      >
        <ClipboardCheck className="h-4 w-4 mr-1.5" />
        {isReviewing ? "Reviewing..." : "Review Paper"}
      </Button>

      {results.length === 0 && !isReviewing && (
        <div className="flex flex-col items-center justify-center py-8 text-ink-400">
          <ClipboardCheck className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No review yet</p>
          <p className="text-xs mt-1 text-center">
            Get AI feedback on structure, tone, and citations
          </p>
        </div>
      )}

      {results.map((cat) => (
        <div
          key={cat.label}
          className="rounded-lg border border-ink-200 bg-surface p-3 space-y-1.5 dark:border-ink-700"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-ink-900 dark:text-ink-100">
              {cat.label}
            </h4>
            {cat.score > 0 && (
              <span
                className={cn(
                  "text-sm font-bold tabular-nums",
                  scoreColor(cat.score)
                )}
              >
                {cat.score}/10
              </span>
            )}
          </div>
          <p className="text-xs text-ink-600 leading-relaxed dark:text-ink-400">
            {cat.feedback}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Outline Tab ────────────────────────────────────────────

interface HeadingItem {
  level: number;
  text: string;
  pos: number;
}

function OutlineTab({ editor }: { editor: Editor | null }) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);

  useEffect(() => {
    if (!editor) return;

    const extractHeadings = () => {
      const items: HeadingItem[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          items.push({
            level: node.attrs.level as number,
            text: node.textContent,
            pos,
          });
        }
      });
      setHeadings(items);
    };

    extractHeadings();
    editor.on("update", extractHeadings);
    return () => {
      editor.off("update", extractHeadings);
    };
  }, [editor]);

  const scrollTo = useCallback(
    (pos: number) => {
      if (!editor) return;
      editor.chain().focus().setTextSelection(pos).run();
      // Scroll the heading into view
      const element = editor.view.domAtPos(pos);
      const node = element.node as Element;
      node?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    },
    [editor]
  );

  return (
    <div className="p-3 overflow-y-auto h-full">
      {headings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-ink-400">
          <ListTree className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No headings found</p>
          <p className="text-xs mt-1 text-center">
            Add headings to your paper to build an outline
          </p>
        </div>
      )}

      <nav aria-label="Document outline" className="space-y-0.5">
        {headings.map((heading, i) => (
          <button
            key={`${heading.pos}-${i}`}
            onClick={() => scrollTo(heading.pos)}
            className={cn(
              "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-left",
              "text-ink-700 hover:bg-ink-100 transition-colors",
              "dark:text-ink-300 dark:hover:bg-ink-800",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              heading.level === 1 && "font-semibold",
              heading.level === 2 && "pl-5",
              heading.level === 3 && "pl-8 text-xs"
            )}
          >
            <ChevronRight className="h-3 w-3 shrink-0 text-ink-400" />
            <span className="truncate">{heading.text || "Untitled"}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── AI Panel ───────────────────────────────────────────────

const TAB_ICONS: Record<AIPanelMode, React.ComponentType<{ className?: string }>> = {
  chat: MessageSquare,
  review: ClipboardCheck,
  citations: BookOpen,
  outline: ListTree,
};

export function AIPanel({ editor }: AIPanelProps) {
  const aiPanelOpen = useEditorStore((s) => s.aiPanelOpen);
  const aiPanelMode = useEditorStore((s) => s.aiPanelMode);
  const setAIPanelMode = useEditorStore((s) => s.setAIPanelMode);

  const handleInsertCitation = useCallback(
    (citation: Citation) => {
      if (!editor) return;
      const authors = citation.authors;
      let authorStr = "Unknown";
      if (authors.length === 1) authorStr = authors[0].name;
      else if (authors.length === 2)
        authorStr = `${authors[0].name} & ${authors[1].name}`;
      else if (authors.length > 2)
        authorStr = `${authors[0].name} et al.`;

      const citationText = `(${authorStr}, ${citation.year || "n.d."})`;

      editor.chain().focus().insertContent(citationText).run();
    },
    [editor]
  );

  return (
    <AnimatePresence mode="wait">
      {aiPanelOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 400, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="flex flex-col h-full border-l border-ink-200 bg-surface-secondary overflow-hidden dark:border-ink-700 dark:bg-surface-secondary"
          aria-label="AI Assistant Panel"
        >
          <Tabs
            value={aiPanelMode}
            onValueChange={(v) => setAIPanelMode(v as AIPanelMode)}
            className="flex flex-col h-full"
          >
            <TabsList className="w-full px-2 shrink-0">
              {(
                Object.keys(TAB_ICONS) as AIPanelMode[]
              ).map((mode) => {
                const Icon = TAB_ICONS[mode];
                return (
                  <TabsTrigger
                    key={mode}
                    value={mode}
                    className="flex-1 gap-1.5 text-xs capitalize"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {mode}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="chat" className="flex-1 min-h-0">
              <ChatTab editor={editor} />
            </TabsContent>

            <TabsContent value="review" className="flex-1 min-h-0 overflow-hidden">
              <ReviewTab editor={editor} />
            </TabsContent>

            <TabsContent value="citations" className="flex-1 min-h-0 overflow-hidden p-3">
              <CitationSearch onInsert={handleInsertCitation} />
            </TabsContent>

            <TabsContent value="outline" className="flex-1 min-h-0 overflow-hidden">
              <OutlineTab editor={editor} />
            </TabsContent>
          </Tabs>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
