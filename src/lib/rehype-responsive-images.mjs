import { visit } from 'unist-util-visit';

const SIZES = '(max-width: 800px) calc(100vw - 48px), 760px';

/**
 * Responsive variants for Markdown images, using the metadata from _data/images.json
 * (same rules as the former scripts/optimize_html_images.py, plus decoding="async").
 * The first image of a document loads eagerly; images that already carry srcset are left alone.
 */
export default function rehypeResponsiveImages({ images }) {
  return (tree) => {
    let index = 0;
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img' || node.properties?.src === undefined) return;
      const priority = index === 0;
      index += 1;
      const props = node.properties;
      if (props.srcSet !== undefined) return;
      const asset = images[props.src];
      if (asset) {
        props.src = asset.src;
        props.srcSet = [`${asset.mobile} ${asset.mobile_width}w`, ...(asset.width > asset.mobile_width ? [`${asset.src} ${asset.width}w`] : [])].join(", ");
        props.sizes = SIZES;
        props.width = asset.width;
        props.height = asset.height;
      }
      if (props.loading === undefined) props.loading = priority ? 'eager' : 'lazy';
      if (priority && props.fetchPriority === undefined) props.fetchPriority = 'high';
      if (props.decoding === undefined) props.decoding = 'async';
    });
  };
}
