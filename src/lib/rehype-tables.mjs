/** Wrap tables after sanitization, preserving native table semantics. */
export default function rehypeTables() {
  /** @param {import('hast').Root | import('hast').Element} node */
  function wrapTables(node) {
    node.children = node.children.map((child) => {
      if (child.type !== 'element') return child;
      if (child.tagName === 'table') {
        return {
          type: 'element',
          tagName: 'div',
          properties: {
            className: ['article-table'],
            tabIndex: 0,
            role: 'region',
            ariaLabel: '본문 표',
          },
          children: [child],
        };
      }
      wrapTables(child);
      return child;
    });
  }
  return wrapTables;
}
