'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

export interface JsonColorViewerProps {
  content: any;
  editable?: boolean;
  onChange?: (value: string) => void;
  showLineNumbers?: boolean;
  searchFilter?: string;
  maxHeight?: string;
  className?: string;
  placeholder?: string;
  emptyMessage?: string;
}

interface Token {
  type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'bracket' | 'colon' | 'comma' | 'text' | 'space';
  text: string;
}

interface FoldRange {
  startLine: number;
  endLine: number;
  char: '{' | '[';
  hasComma: boolean;
}

/**
 * Tokenize a single line of JSON formatted text for Postman-style syntax highlighting
 */
function tokenizeJsonLine(line: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  const len = line.length;

  while (index < len) {
    const ch = line[index];

    // Whitespace
    if (/\s/.test(ch)) {
      let space = '';
      while (index < len && /\s/.test(line[index])) {
        space += line[index];
        index++;
      }
      tokens.push({ type: 'space', text: space });
      continue;
    }

    // String (Key or String Value)
    if (ch === '"') {
      let str = '"';
      index++;
      let escaped = false;
      while (index < len) {
        const c = line[index];
        str += c;
        index++;
        if (escaped) {
          escaped = false;
        } else if (c === '\\') {
          escaped = true;
        } else if (c === '"') {
          break;
        }
      }

      // Check if followed by colon (ignoring spaces) -> this is an object Key
      let lookahead = index;
      while (lookahead < len && /\s/.test(line[lookahead])) {
        lookahead++;
      }

      if (lookahead < len && line[lookahead] === ':') {
        tokens.push({ type: 'key', text: str });
      } else {
        tokens.push({ type: 'string', text: str });
      }
      continue;
    }

    // Number
    if (/[\d-]/.test(ch)) {
      const match = line.slice(index).match(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/);
      if (match) {
        tokens.push({ type: 'number', text: match[0] });
        index += match[0].length;
        continue;
      }
    }

    // Boolean or Null keyword
    const wordMatch = line.slice(index).match(/^(true|false|null)\b/);
    if (wordMatch) {
      const word = wordMatch[1];
      if (word === 'true' || word === 'false') {
        tokens.push({ type: 'boolean', text: word });
      } else {
        tokens.push({ type: 'null', text: word });
      }
      index += word.length;
      continue;
    }

    // Brackets
    if (ch === '{' || ch === '}' || ch === '[' || ch === ']') {
      tokens.push({ type: 'bracket', text: ch });
      index++;
      continue;
    }

    // Colon
    if (ch === ':') {
      tokens.push({ type: 'colon', text: ch });
      index++;
      continue;
    }

    // Comma
    if (ch === ',') {
      tokens.push({ type: 'comma', text: ch });
      index++;
      continue;
    }

    // Other characters (fallback)
    tokens.push({ type: 'text', text: ch });
    index++;
  }

  return tokens;
}

/**
 * Render string token, with custom highlighting for Postman {{variable}} expressions
 */
function renderStringValue(text: string, tokenIndex: number) {
  const varRegex = /(\{\{[^{}]+\}\})/g;
  if (!varRegex.test(text)) {
    return (
      <span key={tokenIndex} className="text-emerald-400">
        {text}
      </span>
    );
  }

  const parts = text.split(varRegex);
  return (
    <span key={tokenIndex} className="text-emerald-400">
      {parts.map((part, pIdx) => {
        if (part.startsWith('{{') && part.endsWith('}}')) {
          return (
            <span
              key={pIdx}
              className="text-amber-300 font-bold bg-amber-400/15 px-1 py-0.2 rounded border border-amber-400/30 font-mono text-[10px] inline-block shadow-sm"
              title={`Interpolated Variable: ${part}`}
            >
              {part}
            </span>
          );
        }
        return <span key={pIdx}>{part}</span>;
      })}
    </span>
  );
}

export function JsonColorViewer({
  content,
  editable = false,
  onChange,
  showLineNumbers = true,
  searchFilter = '',
  maxHeight = '420px',
  className = '',
  placeholder = '{\n  "key": "value"\n}',
  emptyMessage = 'No payload data available.',
}: JsonColorViewerProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [foldedLines, setFoldedLines] = useState<Set<number>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // Normalize string content
  const formattedString = useMemo(() => {
    if (content === undefined || content === null || content === '') {
      return '';
    }

    if (typeof content === 'object') {
      try {
        return JSON.stringify(content, null, 2);
      } catch {
        return String(content);
      }
    }

    if (typeof content === 'string') {
      if (!editable) {
        try {
          const parsed = JSON.parse(content);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return content;
        }
      }
      return content;
    }

    return String(content);
  }, [content, editable]);

  const rawLines = useMemo(() => {
    if (!formattedString) return [];
    return formattedString.split('\n');
  }, [formattedString]);

  // Compute fold ranges for every multi-line { ... } and [ ... ]
  const foldRanges = useMemo(() => {
    const ranges: Record<number, FoldRange> = {};
    const stack: { char: '{' | '['; lineIdx: number }[] = [];

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      let inString = false;
      let escaped = false;

      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (ch === '\\') {
          escaped = true;
          continue;
        }
        if (ch === '"') {
          inString = !inString;
          continue;
        }
        if (inString) continue;

        if (ch === '{' || ch === '[') {
          stack.push({ char: ch, lineIdx: i });
        } else if (ch === '}' || ch === ']') {
          if (stack.length > 0) {
            const top = stack[stack.length - 1];
            if ((ch === '}' && top.char === '{') || (ch === ']' && top.char === '[')) {
              stack.pop();
              if (top.lineIdx !== i) {
                ranges[top.lineIdx] = {
                  startLine: top.lineIdx,
                  endLine: i,
                  char: top.char,
                  hasComma: line.trim().endsWith(','),
                };
              }
            }
          }
        }
      }
    }
    return ranges;
  }, [rawLines]);

  const toggleFold = (lineIdx: number) => {
    setFoldedLines((prev) => {
      const next = new Set(prev);
      if (next.has(lineIdx)) {
        next.delete(lineIdx);
      } else {
        next.add(lineIdx);
      }
      return next;
    });
  };

  const handleCopy = () => {
    if (!formattedString) return;
    navigator.clipboard.writeText(formattedString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Synchronize scroll between textarea and syntax highlight pre
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;

    // 1. Tab key: insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const updated = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd);
      if (onChange) onChange(updated);
      setTimeout(() => {
        textarea.selectionStart = selectionStart + 2;
        textarea.selectionEnd = selectionStart + 2;
      }, 0);
      return;
    }

    // 2. Auto-pair double quotes
    if (e.key === '"') {
      if (selectionStart === selectionEnd && value[selectionStart] === '"') {
        e.preventDefault();
        textarea.selectionStart = selectionStart + 1;
        textarea.selectionEnd = selectionStart + 1;
        return;
      }
      e.preventDefault();
      const updated = value.substring(0, selectionStart) + '""' + value.substring(selectionEnd);
      if (onChange) onChange(updated);
      setTimeout(() => {
        textarea.selectionStart = selectionStart + 1;
        textarea.selectionEnd = selectionStart + 1;
      }, 0);
      return;
    }

    // 3. Auto-pair braces
    if (e.key === '{') {
      e.preventDefault();
      const updated = value.substring(0, selectionStart) + '{}' + value.substring(selectionEnd);
      if (onChange) onChange(updated);
      setTimeout(() => {
        textarea.selectionStart = selectionStart + 1;
        textarea.selectionEnd = selectionStart + 1;
      }, 0);
      return;
    }

    // 4. Auto-pair brackets
    if (e.key === '[') {
      e.preventDefault();
      const updated = value.substring(0, selectionStart) + '[]' + value.substring(selectionEnd);
      if (onChange) onChange(updated);
      setTimeout(() => {
        textarea.selectionStart = selectionStart + 1;
        textarea.selectionEnd = selectionStart + 1;
      }, 0);
      return;
    }
  };

  if (!formattedString && !editable) {
    return (
      <div className="p-6 bg-[#0c0c0e] rounded-xl text-center text-neutral-500 font-mono text-xs border border-neutral-850">
        {emptyMessage}
      </div>
    );
  }

  // Determine which lines should be hidden due to folding
  const hiddenLines = new Set<number>();
  for (const foldStart of foldedLines) {
    const range = foldRanges[foldStart];
    if (range) {
      for (let l = range.startLine + 1; l <= range.endLine; l++) {
        hiddenLines.add(l);
      }
    }
  }

  return (
    <div
      className={`flex flex-col bg-[#09090b] rounded-xl border border-neutral-850 overflow-hidden font-mono text-xs ${className}`}
    >
      {/* Code Container */}
      <div
        className="overflow-auto flex-1 select-text scrollbar-thin relative"
        style={{ maxHeight }}
      >
        <table className="w-full border-collapse font-mono text-[11px] leading-relaxed select-text">
          <tbody>
            {rawLines.map((line, lineIdx) => {
              if (hiddenLines.has(lineIdx)) {
                return null;
              }

              const isFoldable = foldRanges[lineIdx] !== undefined;
              const isFolded = foldedLines.has(lineIdx);
              const foldRange = foldRanges[lineIdx];

              const lineMatchesSearch =
                searchFilter.trim() !== '' &&
                line.toLowerCase().includes(searchFilter.toLowerCase());

              const tokens = tokenizeJsonLine(line);

              return (
                <tr
                  key={lineIdx}
                  className={`transition-colors ${
                    lineMatchesSearch
                      ? 'bg-amber-950/40 text-amber-200'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Line Number & Collapse/Expand Arrow Gutter */}
                  {showLineNumbers && (
                    <td className="w-12 pr-2 py-0.5 text-right text-neutral-600 select-none font-mono text-[10px] border-r border-neutral-850 sticky left-0 bg-[#09090b] align-top whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {isFoldable ? (
                          <button
                            type="button"
                            onClick={() => toggleFold(lineIdx)}
                            className="p-0.5 text-neutral-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                            title={isFolded ? 'Expand section' : 'Collapse section'}
                          >
                            {isFolded ? (
                              <ChevronRight className="w-3 h-3 text-[#FF6C37]" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-neutral-400" />
                            )}
                          </button>
                        ) : (
                          <span className="w-3 inline-block" />
                        )}
                        <span className="w-5 text-right">{lineIdx + 1}</span>
                      </div>
                    </td>
                  )}

                  {/* Token Colored Content Line */}
                  <td className="pl-3 py-0.5 font-mono text-[11px] whitespace-pre select-text align-top">
                    {(() => {
                      const renderToken = (token: Token, tIdx: number) => {
                        switch (token.type) {
                          case 'key':
                            return (
                              <span key={tIdx} className="text-sky-400 font-semibold">
                                {token.text}
                              </span>
                            );
                          case 'string':
                            return renderStringValue(token.text, tIdx);
                          case 'number':
                            return (
                              <span key={tIdx} className="text-orange-400 font-semibold">
                                {token.text}
                              </span>
                            );
                          case 'boolean':
                            return (
                              <span key={tIdx} className="text-purple-400 font-semibold">
                                {token.text}
                              </span>
                            );
                          case 'null':
                            return (
                              <span key={tIdx} className="text-rose-400 italic font-medium">
                                {token.text}
                              </span>
                            );
                          case 'bracket':
                            return (
                              <span key={tIdx} className="text-slate-300 font-bold">
                                {token.text}
                              </span>
                            );
                          case 'colon':
                            return (
                              <span key={tIdx} className="text-neutral-400 font-bold">
                                {token.text}
                              </span>
                            );
                          case 'comma':
                            return (
                              <span key={tIdx} className="text-neutral-500">
                                {token.text}
                              </span>
                            );
                          case 'space':
                            return <span key={tIdx}>{token.text}</span>;
                          default:
                            return (
                              <span key={tIdx} className="text-neutral-300">
                                {token.text}
                              </span>
                            );
                        }
                      };

                      if (isFolded && foldRange) {
                        let bracketIdx = -1;
                        for (let t = tokens.length - 1; t >= 0; t--) {
                          if (tokens[t].type === 'bracket' && (tokens[t].text === '{' || tokens[t].text === '[')) {
                            bracketIdx = t;
                            break;
                          }
                        }

                        return (
                          <>
                            {tokens.map((token, tIdx) => {
                              if (tIdx === bracketIdx) {
                                return (
                                  <span
                                    key={tIdx}
                                    onClick={() => toggleFold(lineIdx)}
                                    className="inline-flex items-center px-1.5 py-0.2 mx-1 bg-[#1c1c22] hover:bg-[#282832] text-amber-300 hover:text-white rounded text-[10px] font-mono cursor-pointer border border-amber-400/40 select-none align-middle transition-colors shadow-sm"
                                    title="Click to expand"
                                  >
                                    {foldRange.char === '{' ? '{ ... }' : '[ ... ]'}
                                    {foldRange.hasComma && <span className="text-neutral-400">,</span>}
                                  </span>
                                );
                              }
                              if (bracketIdx !== -1 && tIdx > bracketIdx) {
                                return null;
                              }
                              return renderToken(token, tIdx);
                            })}
                          </>
                        );
                      }

                      return tokens.map((token, tIdx) => renderToken(token, tIdx));
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
