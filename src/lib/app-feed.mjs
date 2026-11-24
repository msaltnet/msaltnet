import { createHash } from 'node:crypto';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { toText } from 'hast-util-to-text';

export const feedSchemaVersion = 1;
const safeTags = [
  'a', 'abbr', 'aside', 'b', 'blockquote', 'br', 'caption', 'code', 'dd', 'del', 'details',
  'div', 'dl', 'dt', 'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hr', 'i', 'img', 'kbd', 'li', 'ol', 'p', 'pre', 's', 'samp', 'small', 'span', 'strong',
  'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'ul',
];
export const safeArticleSchema = {
  tagNames: safeTags,
  attributes: {
    '*': ['id', 'title'],
    a: ['href'],
    img: ['src', 'alt', 'width', 'height'],
    ol: ['start', 'reversed'],
    li: ['value'],
    th: ['colSpan', 'rowSpan', 'scope'],
    td: ['colSpan', 'rowSpan'],
    details: ['open'],
  },
  protocols: { href: ['https'], src: ['https'] },
  // IDs have no DOM-clobbering effect: the app displays a script-free article only.
  clobber: [],
  strip: [
    'script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea',
    'select', 'option', 'noscript', 'template', 'svg', 'math', 'video', 'audio', 'source',
    'canvas', 'meta', 'link', 'base',
  ],
};

function visit(node, callback) {
  callback(node);
  for (const child of node.children ?? []) visit(child, callback);
}

/** All surviving links are absolute HTTPS URLs, respecting the site's mount point. */
export function absoluteArticleUrl(value, canonicalUrl, siteRoot) {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const raw = value.trim();
  // Do not let browser URL normalization disguise control characters or backslashes.
  if (/[\u0000-\u0020\u007f\\]/.test(raw)) return undefined;
  let resolved;
  try {
    const root = new URL(siteRoot);
    if (raw.startsWith('/') && !raw.startsWith('//')) {
      const base = root.pathname.replace(/\/$/, '');
      const path = base && !(raw === base || raw.startsWith(`${base}/`)) ? `${base}${raw}` : raw;
      resolved = new URL(path, root);
    } else {
      resolved = new URL(raw, canonicalUrl);
    }
  } catch {
    return undefined;
  }
  if (!['http:', 'https:'].includes(resolved.protocol) || resolved.username || resolved.password) return undefined;
  resolved.protocol = 'https:';
  return resolved.href;
}

/** Extract the website's final, image-resolved article, never its navigation or scripts. */
export async function sanitizeArticle(pageHtml, canonicalUrl, siteRoot, { preserveEmailLinks = false, selector = 'div.post-content' } = {}) {
  const [tagName, className] = selector.split('.');
  const parser = unified().use(rehypeParse);
  const page = parser.parse(pageHtml);
  const articles = [];
  visit(page, (node) => {
    if (node.type === 'element' && node.tagName === tagName && node.properties.className?.includes(className)) articles.push(node);
  });
  if (articles.length !== 1) throw new Error(`Expected one ${selector} at ${canonicalUrl}, found ${articles.length}`);
  const article = { type: 'root', children: articles[0].children };
  visit(article, (node) => {
    if (node.type !== 'element') return;
    for (const attribute of ['href', 'src']) {
      if (!(attribute in node.properties)) continue;
      if (preserveEmailLinks && attribute === 'href' && /^mailto:[^\u0000-\u0020\u007f\\]+$/i.test(node.properties[attribute])) continue;
      const url = absoluteArticleUrl(node.properties[attribute], canonicalUrl, siteRoot);
      if (url) node.properties[attribute] = url;
      else delete node.properties[attribute];
    }
  });
  const schema = preserveEmailLinks
    ? { ...safeArticleSchema, protocols: { ...safeArticleSchema.protocols, href: ['https', 'mailto'] } }
    : safeArticleSchema;
  const processor = unified().use(rehypeSanitize, schema).use(rehypeStringify);
  const clean = processor.runSync(article);
  return { bodyHtml: processor.stringify(clean).trim(), bodyText: toText(clean).trim() };
}

/** Recursively sorted JSON keys and UTF-8 bytes make hashes reproducible across clients. */
export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function noteRevision(metadata, body) {
  // detailUrl/revision and generatedAt are deliberately not part of the hash input.
  const { id, title, description, publishedAt, updatedAt, canonicalUrl, collectionId, projectUrl } = metadata;
  const { bodyHtml, bodyText } = body;
  // Preserve legacy v1 hashing when optional taxonomy fields are absent.
  const taxonomy = Object.fromEntries(
    ['projectId', 'projectTitle', 'projectOrder', 'seriesId', 'seriesTitle', 'seriesOrder']
      .filter((key) => Object.hasOwn(metadata, key)).map((key) => [key, metadata[key]]),
  );
  return createHash('sha256').update(canonicalJson({
    schemaVersion: feedSchemaVersion, id, title, description, publishedAt, updatedAt,
    canonicalUrl, collectionId, projectUrl, ...taxonomy, bodyHtml, bodyText,
  }), 'utf8').digest('hex');
}

export function feedEntry(metadata, body, siteRoot) {
  const revision = noteRevision(metadata, body);
  const detailUrl = new URL(`app/v1/notes/${metadata.id}/${revision}.json`, siteRoot).href;
  return {
    summary: { ...metadata, detailUrl, revision },
    detail: { schemaVersion: feedSchemaVersion, id: metadata.id, revision, ...body },
  };
}
