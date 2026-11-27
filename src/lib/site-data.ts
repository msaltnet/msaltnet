import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

export type NavItem = { key: string; title: string; url: string; description?: string };
export type Project = { title: string; label: string; description: string; url: string; image: string; alt: string };
export type ImageAsset = {
  src: string; mobile: string; social: string; width: number; height: number; mobile_width: number;
};

export const CATEGORY_KEYS = ['reviews', 'thoughts', 'ax'] as const;
const DATA = join(process.cwd(), '_data');
const read = (file: string) => readFileSync(join(DATA, file), 'utf8');

export const navigation = (): NavItem[] => parse(read('navigation.yml'));
export const categories = (): NavItem[] =>
  navigation().filter((item) => (CATEGORY_KEYS as readonly string[]).includes(item.key));
export const projects = (): Project[] => parse(read('projects.yml'));
export const images = (): Record<string, ImageAsset> => JSON.parse(read('images.json'));
