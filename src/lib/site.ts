export const SITE = {
  title: '맛소금',
  tagline: '지구별에서 소프트웨어를 만들고, 때때로 생각을 적습니다.',
  description: '소프트웨어를 만들고 가끔 생각을 기록하는 맛소금의 개인 웹 페이지',
  origin: 'https://msalt.net',
  authorUrl: 'https://msalt.net/',
  sameAs: ['https://github.com/msaltnet', 'https://blog.msalt.net/'],
  defaultImage: '/assets/img/hero-bg.jpg',
  gtm: 'GTM-N3Z7SSC',
} as const;
export const absolute = (path: string) => new URL(path, SITE.origin).href;
