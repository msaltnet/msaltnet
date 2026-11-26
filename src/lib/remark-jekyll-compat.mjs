import { visit, SKIP } from 'unist-util-visit';

// Compatibility for the two Jekyll/kramdown constructs the existing posts use.

const CLASS_MARKER = /\n?\{:\s*((?:\.[A-Za-z][\w-]*\s*)+)\}\s*$/;

/** kramdown block IAL "{: .a .b }" on the line after a block: adds the classes to that block. */
export function remarkKramdownClasses() {
  return (tree) => {
    visit(tree, 'paragraph', (node, index, parent) => {
      const last = node.children.at(-1);
      if (last?.type !== 'text') return;
      const match = last.value.match(CLASS_MARKER);
      if (!match) return;
      last.value = last.value.slice(0, match.index);
      if (!last.value) node.children.pop();
      const classes = match[1].trim().split(/\s+/).map((name) => name.slice(1));
      const target = parent?.type === 'blockquote' && index === parent.children.length - 1 ? parent : node;
      target.data = { ...target.data, hProperties: { ...target.data?.hProperties, className: classes } };
    });
  };
}

const INCLUDE = /^\{%\s*include\s+responsive-image\.html\s+(.*?)\s*%\}$/s;
const ARG = /(\w+)=(?:["“”]([^"“”]*)["“”]|(\S+))/g;
const SIZES = '(max-width: 608px) calc(100vw - 48px), 560px';
const escape = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** {% include responsive-image.html src="..." alt="..." [priority=true] %} as its own paragraph. */
export function remarkResponsiveImageInclude({ images }) {
  return (tree) => {
    visit(tree, 'paragraph', (node, index, parent) => {
      const text = node.children.length === 1 && node.children[0].type === 'text' ? node.children[0].value.trim() : '';
      const match = text.match(INCLUDE);
      if (!match || !parent) return;
      const args = Object.fromEntries([...match[1].matchAll(ARG)].map((m) => [m[1], m[2] ?? m[3]]));
      const asset = images[args.src];
      if (!asset) throw new Error(`Missing responsive image metadata for ${args.src}`);
      const priority = args.priority === 'true';
      const srcset = `${asset.mobile} ${asset.mobile_width}w${asset.width > asset.mobile_width ? `, ${asset.src} ${asset.width}w` : ''}`;
      const html = `<img src="${escape(asset.src)}" srcset="${escape(srcset)}" sizes="${SIZES}" width="${asset.width}" height="${asset.height}" alt="${escape(args.alt ?? '')}" loading="${priority ? 'eager' : 'lazy'}"${priority ? ' fetchpriority="high"' : ''} decoding="async">`;
      parent.children[index] = { type: 'html', value: html };
      return SKIP;
    });
  };
}
