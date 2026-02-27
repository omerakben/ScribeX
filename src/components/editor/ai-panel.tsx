"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  ListTree,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils/cn";
import { streamChatCompletion } from "@/lib/mercury/client";
import { useEditorStore } from "@/lib/store/editor-store";
import { CitationSearch } from "@/components/editor/citation-search";
import type { AIMessage, AIPanelMode, Citation } from "@/lib/types";
import type { Editor } from "@tiptap/react";

interface AIPanelProps {
  editor: Editor | null;
}

const tabIcons: Record<AIPanelMode, React.ComponentType<{ className?: string }>> = {
  chat: MessageSquare,
  review: ClipboardCheck,
  citations: BookOpen,
  outline: ListTree,
};

function ChatTab({ editor }: { editor: Editor | null }) {
  const aiMessages = useEditorStore((s) => s.aiMessages);
  const isStreaming = useEditorStore((s) => s.isAIStreaming);
  const addAIMessage = useEditorStore((s) => s.addAIMessage);
  const updateLastAIMessage = useEditorStore((s) => s.updateLastAIMessage);
  const setIsAIStreaming = useEditorStore((s) => s.setIsAIStreaming);
  const clearAIMessages = useEditorStore((s) => s.clearAIMessages);

  const [input, setInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const editorContent = editor?.getText() ?? "";

    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    addAIMessage(userMessage);

    const assistantMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      model: "mercury-2",
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };
    addAIMessage(assistantMessage);

    setInput("");
    setIsAIStreaming(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = "";

    const contextMessages = [
      ...aiMessages
        .filter((message) => !message.isStreaming)
        .map((message) => ({
          role: message.role as "user" | "assistant",
          content: message.content,
        })),
      {
        role: "user" as const,
        content: editorContent
          ? `[Manuscript context]\n${editorContent}\n\n[Prompt]\n${trimmed}`
          : trimmed,
      },
    ];

    await streamChatCompletion(contextMessages, {
      onChunk: (chunk) => {
        accumulated += chunk;
        updateLastAIMessage(accumulated);
      },
      onDone: () => {
        setIsAIStreaming(false);
      },
      onError: (error) => {
        updateLastAIMessage(accumulated || `Error: ${error.message}`);
        setIsAIStreaming(false);
      },
      signal: controller.signal,
    });
  }, [
    input,
    isStreaming,
    editor,
    aiMessages,
    addAIMessage,
    updateLastAIMessage,
    setIsAIStreaming,
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {aiMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-ink-200 bg-surface px-4 text-center">
            <Sparkles className="h-8 w-8 text-mercury-500" />
            <p className="mt-3 text-sm font-semibold text-ink-900">Ask Mercury about this manuscript</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">
              The full document is added as context for drafting guidance and review.
            </p>
          </div>
        ) : (
          aiMessages.map((message) => (
            <article
              key={message.id}
              className={cn(
                "flex flex-col gap-1",
                message.role === "user" ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[92%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-brand-600 text-white"
                    : "border border-ink-200 bg-white text-ink-800"
                )}
              >
                {message.content || (
                  <span className="inline-flex items-center gap-1 text-ink-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Thinking
                  </span>
                )}
              </div>

              {message.role === "assistant" && message.model ? (
                <Badge
                  variant="mercury"
                  className="border border-mercury-200 bg-mercury-50 px-1.5 py-0 text-[10px] uppercase tracking-[0.1em]"
                >
                  {message.model}
                </Badge>
              ) : null}
            </article>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-ink-200 bg-white px-4 py-3">
        {aiMessages.length > 0 ? (
          <div className="mb-2 flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-xs"
              onClick={clearAIMessages}
              disabled={isStreaming}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask for rewrites, critique, or evidence suggestions..."
            rows={2}
            className="min-h-[64px] flex-1 resize-none rounded-xl border border-ink-300 bg-surface px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-300/30"
          />

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            aria-label="Send"
            className="h-10 w-10"
          >
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

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

  const runReview = useCallback(async () => {
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
          content: `Review this academic manuscript and return exactly valid JSON array with four items. Use this schema:
[
  {"label": "Structure", "score": <1-10>, "feedback": "<2-3 sentences>"},
  {"label": "Argument Flow", "score": <1-10>, "feedback": "<2-3 sentences>"},
  {"label": "Tone", "score": <1-10>, "feedback": "<2-3 sentences>"},
  {"label": "Citations", "score": <1-10>, "feedback": "<2-3 sentences>"}
]

Manuscript:\n${content}`,
        },
      ],
      {
        onChunk: (chunk) => {
          accumulated += chunk;
        },
        onDone: () => {
          try {
            const jsonMatch = accumulated.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("No JSON");
            const parsed = JSON.parse(jsonMatch[0]);
            setResults(parsed);
          } catch {
            setResults([
              {
                label: "Parse Error",
                score: 0,
                feedback: "Could not parse structured review output. Please run review again.",
              },
            ]);
          } finally {
            setIsReviewing(false);
            setIsAIStreaming(false);
            setActiveWritingMode(null);
          }
        },
        onError: () => {
          setResults([
            {
              label: "Request Error",
              score: 0,
              feedback: "Review request failed. Please try again.",
            },
          ]);
          setIsReviewing(false);
          setIsAIStreaming(false);
          setActiveWritingMode(null);
        },
      }
    );
  }, [editor, setActiveWritingMode, setIsAIStreaming]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-success";
    if (score >= 5) return "text-warning";
    return "text-error";
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-4">
        <Button onClick={runReview} loading={isReviewing} variant="mercury" className="w-full" size="sm">
          <ClipboardCheck className="mr-1.5 h-4 w-4" />
          {isReviewing ? "Reviewing manuscript" : "Run manuscript review"}
        </Button>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto px-4 pb-4">
        {results.length === 0 && !isReviewing ? (
          <div className="rounded-2xl border border-ink-200 bg-surface p-5 text-center">
            <p className="text-sm font-semibold text-ink-900">No review yet</p>
            <p className="mt-2 text-xs text-ink-500">
              Evaluate structure, tone, argument progression, and citation coverage.
            </p>
          </div>
        ) : null}

        {results.map((result) => (
          <article key={result.label} className="rounded-xl border border-ink-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-900">{result.label}</p>
              {result.score > 0 ? (
                <p className={cn("text-sm font-semibold tabular-nums", getScoreColor(result.score))}>{result.score}/10</p>
              ) : null}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-600">{result.feedback}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

interface HeadingItem {
  level: number;
  text: string;
  pos: number;
}

function OutlineTab({ editor }: { editor: Editor | null }) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);

  useEffect(() => {
    if (!editor) return;

    const extract = () => {
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

    extract();
    editor.on("update", extract);

    return () => {
      editor.off("update", extract);
    };
  }, [editor]);

  const jumpTo = (pos: number) => {
    if (!editor) return;

    editor.chain().focus().setTextSelection(pos).run();
    const dom = editor.view.domAtPos(pos).node as Element;
    dom?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      {headings.length === 0 ? (
        <div className="rounded-2xl border border-ink-200 bg-surface p-5 text-center">
          <p className="text-sm font-semibold text-ink-900">No headings detected</p>
          <p className="mt-2 text-xs text-ink-500">Add H1/H2/H3 headings to build a navigable outline.</p>
        </div>
      ) : (
        <nav className="space-y-1" aria-label="Document outline">
          {headings.map((heading, index) => (
            <button
              key={`${heading.pos}-${index}`}
              onClick={() => jumpTo(heading.pos)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition",
                "hover:bg-surface-secondary",
                heading.level === 1 && "font-semibold text-ink-900",
                heading.level === 2 && "pl-5 text-ink-700",
                heading.level === 3 && "pl-8 text-ink-600"
              )}
            >
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-400" />
              <span className="truncate">{heading.text || "Untitled section"}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

export function AIPanel({ editor }: AIPanelProps) {
  const aiPanelOpen = useEditorStore((s) => s.aiPanelOpen);
  const aiPanelMode = useEditorStore((s) => s.aiPanelMode);
  const setAIPanelMode = useEditorStore((s) => s.setAIPanelMode);

  const handleInsertCitation = useCallback(
    (citation: Citation) => {
      if (!editor) return;

      const authors = citation.authors;
      let authorText = "Unknown";
      if (authors.length === 1) authorText = authors[0].name;
      if (authors.length === 2) authorText = `${authors[0].name} & ${authors[1].name}`;
      if (authors.length > 2) authorText = `${authors[0].name} et al.`;

      editor.chain().focus().insertContent(`(${authorText}, ${citation.year || "n.d."})`).run();
    },
    [editor]
  );

  return (
    <AnimatePresence mode="wait">
      {aiPanelOpen ? (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 430, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="hidden h-full shrink-0 overflow-hidden border-l border-ink-200 bg-white lg:flex lg:flex-col"
          aria-label="AI panel"
        >
          <Tabs
            value={aiPanelMode}
            onValueChange={(value) => setAIPanelMode(value as AIPanelMode)}
            className="flex h-full flex-col"
          >
            <div className="border-b border-ink-200 px-3 pt-3">
              <TabsList className="w-full justify-start border-0">
                {(Object.keys(tabIcons) as AIPanelMode[]).map((mode) => {
                  const Icon = tabIcons[mode];
                  return (
                    <TabsTrigger
                      key={mode}
                      value={mode}
                      className="gap-1.5 rounded-md border-b-0 data-[state=active]:bg-surface-secondary data-[state=active]:text-brand-700"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {mode}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <TabsContent value="chat" className="mt-0 flex-1 overflow-hidden">
              <ChatTab editor={editor} />
            </TabsContent>

            <TabsContent value="review" className="mt-0 flex-1 overflow-hidden">
              <ReviewTab editor={editor} />
            </TabsContent>

            <TabsContent value="citations" className="mt-0 flex-1 overflow-hidden px-4 py-4">
              <CitationSearch onInsert={handleInsertCitation} />
            </TabsContent>

            <TabsContent value="outline" className="mt-0 flex-1 overflow-hidden">
              <OutlineTab editor={editor} />
            </TabsContent>
          </Tabs>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
