# msalt.net

Astro로 생성되는 맛소금의 개인 웹 페이지입니다.

## 글 쓰기

`src/content/posts/<slug>.md` 파일을 만들고 다음 front matter 뒤에 Markdown 본문을 작성합니다. 파일 이름이 주소가 됩니다(`/article/<slug>/`). slug는 영문 소문자·숫자와 `-`만 씁니다.

```yaml
---
title: "글 제목"
date: "2026-08-10"
description: "홈과 공유 메타데이터에 표시할 한두 문장"
category: reviews
---
```

`category`는 `reviews`(감상문), `thoughts`(생각), `ax`(AX Notes) 중 하나입니다. 예전 `/ai-development/` 주소는 `/ax/`로 이동합니다. 분류의 이름·설명·주소와 주요 메뉴는 `_data/navigation.yml` 한 곳에서 관리합니다. 태그는 없습니다.

선택 항목:

- `image: /assets/img/example.jpg` — 공유 미리보기에 쓸 대표 이미지. 없으면 기본 이미지를 씁니다.
- `last_modified_at: "2026-09-30"` — 실제로 본문을 수정했을 때만 적습니다(아래 참고).
- `sidebar_feature: true` — 홈 사이드바에 글 전문을 표시합니다. 한 편만 지정할 수 있으며 두 편 이상이면 빌드가 실패합니다.
- `series: <id>`와 `series_order: 1` — 연재로 묶을 때 함께 씁니다. 연재는 `src/content/series/<id>.md`(`title`, `description`)로 만듭니다.
- `draft: true` — 목록·sitemap·feed·llms.txt·검색·앱 피드에서 모두 제외합니다.

허용되지 않은 분류, 없는 연재, 순서 누락·중복, 잘못된 slug는 빌드 오류입니다.

## 로컬 실행과 검증

Node.js 22와 Python 3이 필요합니다.

```bash
npm ci
npm run dev        # http://localhost:4321
npm run verify     # astro check → 빌드(_site) + Pagefind 색인 → Vitest + Python 출력 계약 테스트
npm run test:e2e   # Playwright 브라우저 테스트 (빌드된 _site 사용)
```


## 검색과 AI 콘텐츠 탐색

`src/lib/site.ts`의 사이트 정보는 검색 메타데이터와 글의 `BlogPosting` 구조화 데이터에 사용합니다. 제목, 한두 문장의 `description`, 대표 `image`를 글마다 지정하세요.

- `/sitemap.xml`: 홈, 분류·프로젝트·소개 페이지와 공개 글. 검색·앱 페이지는 제외합니다.
- `/robots.txt`: `public/robots.txt`. 공개 페이지를 검색 및 AI 크롤러에 허용하고 sitemap 주소를 안내합니다.
- `/ads.txt`: 기존 AdSense 게시자 ID를 유지합니다.
- `/feed.xml`: 최근 50개 글과 본문을 Atom 형식으로 제공합니다(기존 주소 유지).
- `/llms.txt`: 글 목록과 프로젝트를 같은 데이터에서 생성하는 AI용 콘텐츠 안내입니다.
- `/search/`: Pagefind 검색. 글 본문만 색인하며 검색 페이지 자체는 `noindex`입니다.

Google·네이버 소유권 확인 파일은 `public/`에 그대로 둡니다.

## 이미지와 웹폰트

이미지 파일을 `public/assets/img`에 추가하고 글에 일반 Markdown으로 첨부합니다.

```markdown
![이미지 설명](/assets/img/example.jpg)
```

빌드는 `_data/images.json`에 등록된 이미지를 반응형 변환본(srcset·크기)으로 바꿉니다. 첫 이미지는 바로 불러오고 나머지는 지연 로딩합니다. 등록되지 않은 이미지는 원본 그대로 표시됩니다. 기존 글의 `{% include responsive-image.html src="..." alt="..." %}` 구문과 kramdown 클래스 표기(`{: .poem-quote }`)도 계속 동작합니다.

새 이미지나 새 한글 글자를 추가하면 변환본과 폰트 subset을 다시 만들고 결과를 커밋합니다. CI에서는 이 단계를 실행하지 않습니다.

```bash
python -m pip install -r scripts/asset-requirements.txt
python scripts/prepare_assets.py
```

## AX Notes 앱 피드

빌드는 `/app/v1/manifest.json`을 만듭니다(계약: `docs/app-feed-contract.md`). 앱에 보낼 글은 `src/lib/app-feed-source.ts`의 `selectAppFeedPosts`가 정하며, 공개된 AX Notes(`category: ax`) 글을 모두 보냅니다. 앱 개인정보처리방침은 `/app-privacy/`입니다.

## 배포

`.github/workflows/pages.yml`이 기본 브랜치 push에서 `npm run verify` 후 `_site`를 GitHub Pages에 배포합니다. 저장소 Settings → Pages → Build and deployment의 Source가 **GitHub Actions**여야 합니다.

### 실제 수정일의 근거

최초 발행일은 바꾸지 않습니다. 2026-08-17 커밋 `14953de`에서 여행 글과 추상화 글에 내용과 관련된 사진을 추가한 이력이 있어 두 글의 `last_modified_at`을 해당 시각으로 기록했습니다. 과거 글의 사이트 이전, 원문 링크 제거, 이미지 압축 및 폰트 변경만으로 수정일을 오늘 날짜로 갱신하지 않습니다. 실제 본문을 수정할 때 `last_modified_at`을 명시하면 글의 수정일 표시, JSON-LD `dateModified`, sitemap `lastmod`, Atom `updated`, llms.txt에 반영됩니다.

### 배포 이후 확인

Search Console에서 sitemap 제출 상태, 페이지 색인, 대표 URL, 검색 노출·클릭을 확인합니다. 모바일 PageSpeed Insights와 Core Web Vitals에서 LCP·CLS·INP를 확인하고 변경 전후를 비교합니다. 네이버·Bing도 각 관리 도구에서 색인 상태를 확인합니다. 로컬 테스트와 파일 크기 감소만으로 실제 검색 순위나 Core Web Vitals 통과를 주장하지 않습니다.

참고: [Google AI 검색 안내](https://developers.google.com/search/docs/appearance/ai-features), [OpenAI 크롤러 안내](https://developers.openai.com/api/docs/bots), [llms.txt 제안](https://llmstxt.org/).
