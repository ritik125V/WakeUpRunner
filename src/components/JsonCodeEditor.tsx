'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Sparkles, Trash2, Check, Copy } from 'lucide-react';

export interface JsonCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

interface FoldRange {
  startLine: number;
  endLine: number;
  char: '{' | '[';
  hasComma: boolean;
}

interface Token {
  type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'bracket' | 'colon' | 'comma' | 'text' | 'space';
  text: string;
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

    // Other characters
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

function renderToken(token: Token, tIdx: number) {
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
}

export function JsonCodeEditor({
  value,
  onChange,
  placeholder = '{\n  "key": "value"\n}',
  minHeight = '160px',
  className = '',
}: JsonCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const [copied, setCopied] = useState<boolean>(false);
  const [foldedLines, setFoldedLines] = useState<Set<number>>(new Set());

  // Cached hidden lines mapping: foldStartLine -> full hidden text
  const foldCacheRef = useRef<Record<number, string>>({});

  const rawLines = useMemo(() => {
    return (value || '').split('\n');
  }, [value]);

  // Compute multi-line object/array fold ranges from rawLines
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
                  hasComma: rawLines[i].trim().endsWith(','),
                };
              }
            }
          }
        }
      }
    }
    return ranges;
  }, [rawLines]);

  // Set of raw line indices hidden by active folds
  const hiddenLines = useMemo(() => {
    const hidden = new Set<number>();
    for (const foldStart of foldedLines) {
      const range = foldRanges[foldStart];
      if (range) {
        for (let l = range.startLine + 1; l <= range.endLine; l++) {
          hidden.add(l);
        }
      }
    }
    return hidden;
  }, [foldedLines, foldRanges]);

  // Display lines: rawLines filtered by active folds, with collapsed badges on foldStart lines
  const displayLinesData = useMemo(() => {
    const result: {
      rawIndex: number;
      text: string;
      isFolded: boolean;
      foldRange?: FoldRange;
      isFoldable: boolean;
    }[] = [];

    for (let i = 0; i < rawLines.length; i++) {
      if (hiddenLines.has(i)) {
        continue;
      }

      const isFolded = foldedLines.has(i);
      const foldRange = foldRanges[i];
      const isFoldable = foldRange !== undefined;

      let displayText = rawLines[i];
      if (isFolded && foldRange) {
        // Replace opening bracket with collapsed placeholder
        const bracketChar = foldRange.char;
        const lastBracketIdx = displayText.lastIndexOf(bracketChar);
        if (lastBracketIdx !== -1) {
          const prefix = displayText.substring(0, lastBracketIdx);
          const pill = bracketChar === '{' ? '{ ... }' : '[ ... ]';
          const comma = foldRange.hasComma ? ',' : '';
          displayText = `${prefix}${pill}${comma}`;
        }
      }

      result.push({
        rawIndex: i,
        text: displayText,
        isFolded,
        foldRange,
        isFoldable,
      });
    }

    return result;
  }, [rawLines, hiddenLines, foldedLines, foldRanges]);

  // Text string for the textarea editor
  const displayEditorValue = useMemo(() => {
    return displayLinesData.map((d) => d.text).join('\n');
  }, [displayLinesData]);

  const toggleFold = (rawLineIdx: number) => {
    setFoldedLines((prev) => {
      const next = new Set(prev);
      if (next.has(rawLineIdx)) {
        next.delete(rawLineIdx);
      } else {
        next.add(rawLineIdx);
      }
      return next;
    });
  };

  const expandAll = () => {
    setFoldedLines(new Set());
  };

  // Synchronize scroll between textarea, syntax highlight pre, and gutter
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  };

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormatJson = () => {
    if (!value || !value.trim()) return;
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      setFoldedLines(new Set());
    } catch {}
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;

    // If any lines are folded, expand before applying arbitrary edits to guarantee 0 data loss
    if (foldedLines.size > 0) {
      setFoldedLines(new Set());
    }

    onChange(newText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value: currentVal } = textarea;

    // If folded, any structural edit expands folds first so data is never truncated
    if (foldedLines.size > 0 && ['Enter', 'Backspace', 'Delete', 'Tab', '"', '{', '['].includes(e.key)) {
      setFoldedLines(new Set());
    }

    // 1. Tab key: insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const updated = currentVal.substring(0, selectionStart) + '  ' + currentVal.substring(selectionEnd);
      onChange(updated);
      setTimeout(() => {
        textarea.selectionStart = selectionStart + 2;
        textarea.selectionEnd = selectionStart + 2;
      }, 0);
      return;
    }

    // 2. Auto-pair double quotes
    if (e.key === '"') {
      if (selectionStart === selectionEnd && currentVal[selectionStart] === '"') {
        e.preventDefault();
        textarea.selectionStart = selectionStart + 1;
        textarea.selectionEnd = selectionStart + 1;
        return;
      }
      e.preventDefault();
      const updated = currentVal.substring(0, selectionStart) + '""' + currentVal.substring(selectionEnd);
      onChange(updated);
      setTimeout(() => {
        textarea.selectionStart = selectionStart + 1;
        textarea.selectionEnd = selectionStart + 1;
      }, 0);
      return;
    }

    // 3. Auto-pair braces
    if (e.key === '{') {
      e.preventDefault();
      const updated = currentVal.substring(0, selectionStart) + '{}' + currentVal.substring(selectionEnd);
      onChange(updated);
      setTimeout(() => {
        textarea.selectionStart = selectionStart + 1;
        textarea.selectionEnd = selectionStart + 1;
      }, 0);
      return;
    }

    // 4. Auto-pair brackets
    if (e.key === '[') {
      e.preventDefault();
      const updated = currentVal.substring(0, selectionStart) + '[]' + currentVal.substring(selectionEnd);
      onChange(updated);
      setTimeout(() => {
        textarea.selectionStart = selectionStart + 1;
        textarea.selectionEnd = selectionStart + 1;
      }, 0);
      return;
    }

    // 5. Smart Enter: maintain indentation
    if (e.key === 'Enter') {
      const lineStart = currentVal.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLine = currentVal.substring(lineStart, selectionStart);
      const matchIndent = currentLine.match(/^\s*/);
      let indent = matchIndent ? matchIndent[0] : '';

      const lastChar = currentLine.trim().slice(-1);
      const nextChar = currentVal[selectionStart];

      if ((lastChar === '{' && nextChar === '}') || (lastChar === '[' && nextChar === ']')) {
        e.preventDefault();
        const updated =
          currentVal.substring(0, selectionStart) +
          '\n' +
          indent +
          '  \n' +
          indent +
          currentVal.substring(selectionEnd);
        onChange(updated);
        setTimeout(() => {
          textarea.selectionStart = selectionStart + 1 + indent.length + 2;
          textarea.selectionEnd = selectionStart + 1 + indent.length + 2;
        }, 0);
        return;
      }

      if (lastChar === '{' || lastChar === '[') {
        indent += '  ';
      }

      e.preventDefault();
      const updated = currentVal.substring(0, selectionStart) + '\n' + indent + currentVal.substring(selectionEnd);
      onChange(updated);
      setTimeout(() => {
        textarea.selectionStart = selectionStart + 1 + indent.length;
        textarea.selectionEnd = selectionStart + 1 + indent.length;
      }, 0);
      return;
    }
  };

  // Shared font & geometry style to guarantee pixel-for-pixel alignment between PRE and TEXTAREA
  const editorSharedStyle: React.CSSProperties = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '12px',
    lineHeight: '21px',
    padding: '12px 14px',
    whiteSpace: 'pre',
    wordBreak: 'normal',
    tabSize: 2,
    boxSizing: 'border-box',
    outline: 'none',
    boxShadow: 'none',
  };

  return (
    <div
      className={`json-code-editor flex flex-col bg-[#0c0c0e] rounded-xl border border-neutral-850 focus-within:border-neutral-750 overflow-hidden font-mono text-xs outline-none ${className}`}
      style={{ minHeight, outline: 'none', boxShadow: 'none' }}
    >
      {/* Mini Postman Header / Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#09090b] border-b border-neutral-850 select-none text-[11px] text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-300">JSON</span>
          {foldedLines.size > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/25 text-[10px] flex items-center gap-1.5">
              <span>
                {foldedLines.size} {foldedLines.size === 1 ? 'section' : 'sections'} folded
              </span>
              <button
                type="button"
                onClick={expandAll}
                className="text-[10px] text-amber-200 underline hover:text-white cursor-pointer bg-transparent border-none p-0"
              >
                Expand all
              </button>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleFormatJson}
            className="px-2 py-1 hover:bg-[#1a1a20] text-neutral-300 hover:text-white rounded-md flex items-center gap-1 transition-colors cursor-pointer border-none bg-transparent"
            title="Prettify JSON payload"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Format</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-1 hover:bg-[#1a1a20] text-neutral-300 hover:text-white rounded-md flex items-center gap-1 transition-colors cursor-pointer border-none bg-transparent"
            title="Copy JSON payload"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-neutral-400" />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              onChange('');
              setFoldedLines(new Set());
            }}
            className="p-1 hover:bg-rose-950/30 text-neutral-500 hover:text-rose-400 rounded-md transition-colors cursor-pointer border-none bg-transparent"
            title="Clear JSON payload"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Code Editor Frame */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Gutter: Line Numbers & Expand/Collapse Chevrons */}
        <div
          ref={gutterRef}
          className="w-12 py-3 px-1 bg-[#09090b] border-r border-neutral-850 select-none overflow-hidden shrink-0 text-right text-neutral-600 font-mono text-[10px]"
          style={{ lineHeight: '21px' }}
        >
          {displayLinesData.map((item, idx) => {
            return (
              <div key={idx} className="h-[21px] flex items-center justify-end gap-1 pr-1">
                {item.isFoldable ? (
                  <button
                    type="button"
                    onClick={() => toggleFold(item.rawIndex)}
                    className="p-0.5 text-neutral-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                    title={item.isFolded ? 'Expand section' : 'Collapse section'}
                  >
                    {item.isFolded ? (
                      <ChevronRight className="w-3 h-3 text-[#FF6C37]" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-neutral-400" />
                    )}
                  </button>
                ) : (
                  <span className="w-3 inline-block" />
                )}
                <span className="w-5 text-right">{item.rawIndex + 1}</span>
              </div>
            );
          })}
        </div>

        {/* Right Code Container: Synchronized Syntax Highlight PRE & Transparent TEXTAREA */}
        <div className="flex-1 min-w-0 relative h-full">
          {/* Background Layer: Token-colored syntax highlighting */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 font-mono text-xs m-0 border-0 pointer-events-none select-none overflow-hidden text-neutral-300"
            style={editorSharedStyle}
          >
            {displayLinesData.map((item, lineIdx) => {
              const tokens = tokenizeJsonLine(item.text);
              return (
                <div key={lineIdx} className="h-[21px] leading-[21px] whitespace-pre">
                  {tokens.map((token, tIdx) => {
                    // Custom pill for collapsed placeholder
                    if (token.text === '{ ... }' || token.text === '[ ... ]') {
                      return (
                        <span
                          key={tIdx}
                          className="inline-flex items-center px-1.5 py-0.2 mx-1 bg-[#1c1c22] text-amber-300 rounded text-[10px] font-mono border border-amber-400/40 select-none align-middle shadow-sm"
                        >
                          {token.text}
                        </span>
                      );
                    }
                    return renderToken(token, tIdx);
                  })}
                </div>
              );
            })}
          </pre>

          {/* Foreground Layer: Native typing, cursor & selection */}
          <textarea
            ref={textareaRef}
            value={displayEditorValue}
            onChange={handleTextChange}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="json-editor-textarea absolute inset-0 font-mono text-xs m-0 border-0 bg-transparent text-transparent caret-white outline-none resize-none selection:bg-[#FF6C37]/30 scrollbar-thin overflow-auto focus:outline-none focus:ring-0 focus:border-none focus-visible:outline-none"
            style={{
              ...editorSharedStyle,
              outline: 'none',
              boxShadow: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}
