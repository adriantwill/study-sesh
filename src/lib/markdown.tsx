import type { JSX } from "react";

export function parseMarkdown(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  let key = 0;

  const highlightRegex = /==(.+?)==/g;
  const highlightSegments = text.split(highlightRegex);

  highlightSegments.forEach((segment, index) => {
    if (index % 2 === 1) {
      parts.push(<mark key={key++} className="rounded bg-yellow-200 px-0.5 text-inherit">{segment}</mark>);
    } else {
      const boldRegex = /\*\*(.+?)\*\*/g;
      const boldSegments = segment.split(boldRegex);

      boldSegments.forEach((boldSeg, boldIndex) => {
        if (boldIndex % 2 === 1) {
          parts.push(<strong key={key++}>{boldSeg}</strong>);
        } else if (boldSeg) {
          const italicRegex = /\*(.+?)\*/g;
          const italicSegments = boldSeg.split(italicRegex);

          italicSegments.forEach((italicSeg, italicIndex) => {
            if (italicIndex % 2 === 1) {
              parts.push(<em key={key++}>{italicSeg}</em>);
            } else if (italicSeg) {
              parts.push(italicSeg);
            }
          });
        }
      });
    }
  });

  return parts.length > 0 ? parts : [text];
}
