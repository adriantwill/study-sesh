import { JSX } from "react";

export function parseMarkdown(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  let key = 0;

  // First handle **bold**
  const boldRegex = /\*\*(.+?)\*\*/g;
  const segments = text.split(boldRegex);

  segments.forEach((segment, index) => {
    if (index % 2 === 1) {
      // This is bold text
      parts.push(<strong key={key++}>{segment}</strong>);
    } else {
      // This might contain italic, parse it
      const italicRegex = /\*(.+?)\*/g;
      const italicSegments = segment.split(italicRegex);

      italicSegments.forEach((italicSeg, italicIndex) => {
        if (italicIndex % 2 === 1) {
          parts.push(<em key={key++}>{italicSeg}</em>);
        } else if (italicSeg) {
          parts.push(italicSeg);
        }
      });
    }
  });

  return parts.length > 0 ? parts : [text];
}
