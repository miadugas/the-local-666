import { marked } from "marked";
import DOMPurify from "dompurify";

// Product descriptions are authored as markdown (admin-only input) and rendered
// to HTML for the storefront modal. Even though the author is trusted, the
// output is always sanitized — defense in depth and it keeps the allowed set
// to a calm prose subset (no headings to fight the modal title, no media).
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "del",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
];
const ALLOWED_ATTR = ["href"];

// Force every link to open safely in a new tab.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.nodeName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer nofollow");
  }
});

export function renderMarkdown(source: string): string {
  const html = marked.parse(source ?? "", {
    async: false,
    gfm: true,
    breaks: true,
  }) as string;
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}
