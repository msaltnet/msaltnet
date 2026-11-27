import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { feedEntry, sanitizeArticle, feedSchemaVersion } from '../lib/app-feed.mjs';

export async function exportAppFeed(directory) {
  const sourcePath = join(directory, 'app-feed-build-source.json');
  const source = JSON.parse(await readFile(sourcePath, 'utf8'));
  const notes = [];
  for (const metadata of source.notes) {
    // IDs come from the content schema, but validate again before filesystem access.
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.id)) throw new Error(`Unsafe note ID: ${metadata.id}`);
    const pageHtml = await readFile(join(directory, 'article', metadata.id, 'index.html'), 'utf8');
    const body = await sanitizeArticle(pageHtml, metadata.canonicalUrl, source.siteRoot);
    if (!body.bodyText) throw new Error(`Empty app article: ${metadata.id}`);
    const { summary, detail } = feedEntry(metadata, body, source.siteRoot);
    const detailDirectory = join(directory, 'app/v1/notes', metadata.id);
    await mkdir(detailDirectory, { recursive: true });
    await writeFile(join(detailDirectory, `${detail.revision}.json`), `${JSON.stringify(detail, null, 2)}\n`);
    notes.push(summary);
  }
  const manifest = { schemaVersion: feedSchemaVersion, generatedAt: new Date().toISOString(), author: source.author, notes };
  await mkdir(join(directory, 'app/v1'), { recursive: true });
  await writeFile(join(directory, 'app/v1/manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await unlink(sourcePath);
  return manifest;
}

export default function appFeed() {
  return {
    name: 'msalt-app-feed',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const manifest = await exportAppFeed(fileURLToPath(dir));
        logger.info(`Exported app/v1/manifest.json and ${manifest.notes.length} revision-addressed articles`);
      },
    },
  };
}
