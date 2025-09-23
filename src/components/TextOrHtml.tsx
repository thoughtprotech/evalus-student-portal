import React from "react";
import parse, {
  domToReact,
  HTMLReactParserOptions,
  Element as HtmlElement,
  DOMNode,
} from "html-react-parser";

interface TextOrHtmlProps {
  content: string;
  className?: string;
  inheritColor?: boolean; // when true, do not force a text color; inherit from parent (e.g., link)
  unstyled?: boolean;     // when true, avoid prose/extra styling wrappers
}

export function TextOrHtml({ content, className = "", inheritColor = false, unstyled = false }: TextOrHtmlProps) {
  const containsHtml = /<\/?[a-z][\s\S]*>/i.test(content);
  // Helper: detect if content is a single root <p>...</p> so we can avoid double wrapping with prose styles
  const singleParagraph = /^\s*<p[ >][\s\S]*<\/p>\s*$/i.test(content.trim());
  // Strip outer <p> if we know we'll wrap in a block to prevent <p> inside <p> or nested block warnings.
  let normalized = content;
  if (singleParagraph) {
    // capture inner content of first-level p only
    const match = normalized.match(/^\s*<p[ ^>]*>([\s\S]*?)<\/p>\s*$/i);
    if (match) normalized = match[1];
  }
  const style = inheritColor ? { color: "inherit" as const } : undefined;

  if (containsHtml) {
    const options: HTMLReactParserOptions = {
      replace: (node) => {
        // Unwrap <p> inside <li> so prose styles apply
        if (node.type === "tag" && node.name === "li") {
          const liNode = node as HtmlElement;
          if (
            liNode.children.length === 1 &&
            (liNode.children[0] as HtmlElement).type === "tag" &&
            (liNode.children[0] as HtmlElement).name === "p"
          ) {
            const pNode = liNode.children[0] as HtmlElement;
            return <li>{domToReact(pNode.children as DOMNode[], options)}</li>;
          }
        }
        return undefined;
      },
    };

    const parsed = parse(normalized, options);
    if (unstyled) {
      return <span className={`whitespace-pre-wrap max-w-full ${className}`.trim()} style={style}>{parsed}</span>;
    }
    // If original was a single paragraph, render inline span to avoid an extra block wrapper that could cause nested <p>
    if (singleParagraph) {
      return <span className={`editor-content whitespace-pre-wrap max-w-full ${className}`.trim()} style={style}>{parsed}</span>;
    }
    const wrapperClass = `editor-content prose prose-sm whitespace-pre-wrap max-w-full ${className}`.trim();
    return <div className={wrapperClass} style={style}>{parsed}</div>;
  }

  const plainClass = unstyled
    ? `whitespace-pre-wrap max-w-full ${className}`.trim()
    : `whitespace-pre-wrap text-gray-800 max-w-full ${className}`.trim();
  if (unstyled) {
    return <span className={plainClass} style={style}>{content}</span>;
  }
  return <div className={plainClass} style={style}>{content}</div>;
}
