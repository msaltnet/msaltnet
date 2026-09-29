# msalt.net

Jekyll로 생성되는 맛소금의 개인 웹 페이지입니다.

## 글 쓰기

`_posts/YYYY-MM-DD-title.md` 형식으로 파일을 만들고 다음 front matter 뒤에 Markdown 본문을 작성합니다.

```yaml
---
title: "글 제목"
date: 2026-08-10
description: "홈과 공유 메타데이터에 표시할 한두 문장"
---
```

홈 왼쪽 사이드바에 글 전문을 함께 표시하려면 front matter에 `sidebar_feature: true`를 추가합니다. 한 편만 지정합니다.

## 로컬 실행

Ruby와 Bundler가 있는 환경에서는 다음 명령을 사용합니다.

```bash
bundle install
bundle exec jekyll serve
```

사이트는 `http://localhost:4000`에서 확인할 수 있습니다.

## 테스트

Jekyll 빌드 뒤 소스·출력 계약과 브라우저 테스트를 실행합니다.

```bash
npm test
npm run test:e2e
```

## 검색과 AI 콘텐츠 탐색

`_config.yml`의 `author`는 검색 메타데이터와 글의 `BlogPosting` 구조화 데이터에 사용합니다. 제목, 한두 문장의 `description`, 대표 `image`를 글마다 지정하세요. 최초 작성일인 `date`는 유지하고, 내용에 실질적인 수정이 있을 때만 `last_modified_at: 2026-09-30`처럼 실제 수정일을 추가합니다. sitemap과 검색 메타데이터가 이를 반영합니다.

- `/sitemap.xml`: jekyll-sitemap이 홈과 공개 글 URL을 자동 생성합니다. 개발 문서는 배포에서 제외하고, Google·네이버 소유권 확인 파일은 접근을 유지하면서 sitemap에서 제외합니다.
- `/robots.txt`: 공개 페이지를 검색 및 AI 크롤러에 허용하고 정식 sitemap 주소를 안내합니다. AI 검색 접근과 모델 학습 정책은 별개입니다. 현재는 기존 공개 크롤링 정책을 유지합니다.
- `/ads.txt`: 기존 AdSense 게시자 ID를 유지합니다. 광고 판매자 인증용이며 검색 순위나 AI 노출을 결정하는 파일은 아닙니다.
- `/feed.xml`: jekyll-feed가 최대 50개의 최근 글과 본문을 Atom 형식으로 제공합니다.
- `/llms.txt`: 글 목록과 프로젝트를 같은 데이터에서 자동 생성하는 AI용 콘텐츠 안내입니다. 제안된 형식이며 검색 순위나 AI 인용을 보장하지 않습니다.

글을 추가하면 sitemap, feed, llms.txt도 다음 빌드에서 갱신됩니다. 중복된 수동 sitemap을 만들지 마세요. 검색 제목·canonical·Open Graph·작성자 데이터는 jekyll-seo-tag가 생성하므로 중복해서 추가하지 않습니다.

검증은 실제 Jekyll 빌드 후 실행합니다.

```bash
JEKYLL_ENV=production bundle exec jekyll build
python3 -m unittest discover -s tests -p 'test_*.py' -v
```

배포 후 Google Search Console, Bing Webmaster Tools, 네이버 서치어드바이저에서 `https://msalt.net/sitemap.xml`을 제출하고 홈과 새 글의 색인 상태를 확인하세요. 확인 파일은 삭제하지 않습니다. Google의 AI 검색도 일반 SEO와 크롤링·색인 요건을 따릅니다.

참고: [Google AI 검색 안내](https://developers.google.com/search/docs/appearance/ai-features), [OpenAI 크롤러 안내](https://developers.openai.com/api/docs/bots), [llms.txt 제안](https://llmstxt.org/).
