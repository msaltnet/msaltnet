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
