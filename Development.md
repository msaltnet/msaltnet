# msalt.net

Jekyll로 생성되는 맛소금의 개인 웹 페이지입니다.

## 글 쓰기

`_posts/YYYY-MM-DD-title.md` 형식으로 파일을 만들고 다음 front matter 뒤에 Markdown 본문을 작성합니다.

```yaml
---
title: "글 제목"
date: 2026-08-10
description: "홈과 공유 메타데이터에 표시할 한두 문장"
section: reviews
---
```

`section`은 `reviews`(감상문), `thoughts`(생각), `ai-development`(AI와 개발) 중 하나로 지정합니다. 글은 해당 주제의 독립 목록에 표시되며 기존 `/article/:slug/` 주소는 유지합니다. 주요 메뉴의 이름과 주소는 `_data/navigation.yml`에서 관리합니다. 프로젝트와 소개는 `/projects/`, `/about/`에서 제공합니다.

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

## 이미지와 웹폰트 관리

이미지와 폰트 파생 파일은 Git에 포함하므로 GitHub Pages에서 별도 Python 플러그인 없이 빌드합니다. 원본 이미지와 원본 폰트는 기존 URL 호환성과 재생성을 위해 유지합니다.

```bash
python -m venv --system-site-packages .venv
# Windows: .venv/Scripts/python.exe / macOS·Linux: .venv/bin/python
.venv/Scripts/python.exe -m pip install -r scripts/asset-requirements.txt
.venv/Scripts/python.exe scripts/prepare_assets.py
```

새 이미지가 생기거나 글을 추가·수정하면 위 생성 명령을 다시 실행하고 `_data/images.json`, `_data/font_subsets.json`, `assets/img/optimized`, `assets/fonts/subsets`, `assets/css/fonts.css`를 함께 반영합니다. 기존 글자 전체를 분할한 폰트도 제공하므로 아직 공통 묶음에 없는 한글·한자도 표시할 수 있습니다. 각 공통 폰트는 200KB 이하, 각 이미지 파생 파일은 350KB 이하로 검증합니다.

본문 이미지에는 다음 include를 사용합니다. 첫 이미지는 `priority=true`, 나머지는 생략합니다. 설명은 이미지의 실제 내용으로 작성합니다.

```liquid
{% include responsive-image.html src="/assets/img/example.jpg" alt="이미지 설명" priority=true %}
```

원본 종횡비와 EXIF 회전을 유지하며 긴 변을 최대 1600px와 800px로 제한한 WebP를 생성합니다. include가 `srcset`, `sizes`, 실제 `width`·`height`를 넣어 모바일 다운로드와 레이아웃 이동을 줄입니다. 첫 이미지는 즉시 로드하고 나머지는 지연 로드합니다. 소셜 공유 메타데이터에는 최대 1200px JPEG를 사용합니다. 글 front matter의 `image`는 원본 URL을 유지하며 SEO 출력 시 최적화된 공유 이미지 URL로 변환합니다.

### 실제 수정일의 근거

최초 발행일은 바꾸지 않습니다. 2026-08-17 커밋 `14953de`에서 여행 글과 추상화 글에 내용과 관련된 사진을 추가한 이력이 있어 두 글의 `last_modified_at`을 해당 시각으로 기록했습니다. 과거 글의 사이트 이전, 원문 링크 제거, 이미지 압축 및 폰트 변경만으로 수정일을 오늘 날짜로 갱신하지 않습니다. 실제 본문을 수정할 때 `last_modified_at`을 명시하면 글의 수정일 표시, JSON-LD `dateModified`, sitemap `lastmod`, Atom `updated`, llms.txt에 반영됩니다.

### 배포 이후 확인

Search Console에서 sitemap 제출 상태, 페이지 색인, 대표 URL, 검색 노출·클릭을 확인합니다. 모바일 PageSpeed Insights와 Core Web Vitals에서 LCP·CLS·INP를 확인하고 변경 전후를 비교합니다. 네이버·Bing도 각 관리 도구에서 색인 상태를 확인합니다. 로컬 테스트와 파일 크기 감소만으로 실제 검색 순위나 Core Web Vitals 통과를 주장하지 않습니다.

검증은 실제 Jekyll 빌드 후 실행합니다.

```bash
JEKYLL_ENV=production bundle exec jekyll build
python3 -m unittest discover -s tests -p 'test_*.py' -v
```

배포 후 Google Search Console, Bing Webmaster Tools, 네이버 서치어드바이저에서 `https://msalt.net/sitemap.xml`을 제출하고 홈과 새 글의 색인 상태를 확인하세요. 확인 파일은 삭제하지 않습니다. Google의 AI 검색도 일반 SEO와 크롤링·색인 요건을 따릅니다.

참고: [Google AI 검색 안내](https://developers.google.com/search/docs/appearance/ai-features), [OpenAI 크롤러 안내](https://developers.openai.com/api/docs/bots), [llms.txt 제안](https://llmstxt.org/).
