import React from 'react';
import parse from 'html-react-parser';

interface TextOrHtmlProps {
  content: string;
}

export function TextOrHtml({ content }: TextOrHtmlProps) {
  const containsHtml = /<\/?[a-z][\s\S]*>/i.test(content);

  if (containsHtml) {
    // HTML branch: parse & preserve lists, blockquotes, etc.
    return (
      <div
        className="whitespace-pre-wrap max-w-full prose prose-sm"
        // html-react-parser will convert strings like "<p>Hi</p><ul>…" into real React elements
      >
        {parse(content)}
      </div>
    );
  } else {
    // Plain-text branch: just show line-breaks and spaces
    return (
      <div className="whitespace-pre-wrap text-gray-800">
        {content}
      </div>
    );
  }
}
