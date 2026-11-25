## 1. 시스템 목적

라즈베리파이에서 동작하는 **개인 경제 정보 비서**

기능

* 한국 / 미국 시장 관련 **뉴스 수집**
* **SNS / 유튜브 자료 수집**
* **요약 + 원문 링크 제공**
* **채팅으로 데이터 소스 관리**

투자 추천은 하지 않고 **정보 수집/정리 도구**로 사용

---

## 2. 핵심 구성 요소

시스템은 아래 4개 요소로 구성

1. **Chat Interface**
2. **nanobot**
3. **Source Registry**
4. **Collector + Summarizer**

---

## 3. 전체 동작 구조

```text
사용자
   │
   │  채팅
   ▼
nanobot
   │
   ├─ source_manager
   ├─ collector
   └─ summarizer
   │
   ▼
sources.yaml
   │
   ▼
뉴스 / SNS / 유튜브 수집
   │
   ▼
요약 + 링크 제공
```

---

## 4. 파일 구조

```text
~/.nanobot/
└─ workspace/
   ├─ AGENTS.md
   ├─ data/
   │  ├─ sources.yaml
   │  ├─ collected/
   │  ├─ briefings/
   │  └─ logs/
   └─ skills/
      ├─ source_manager
      ├─ collector
      └─ summarizer
```

---

## 5. 핵심 데이터 파일

### `sources.yaml`

이 시스템의 **현재 사용 중인 소스 목록**

```yaml
sources:
  - name: Reuters
    value: https://www.reuters.com/

  - name: 한국경제
    value: https://www.hankyung.com/

  - name: 어떤 유튜브 채널
    value: https://www.youtube.com/@example
    note: 미국 금리 참고용
```

필드는 최소로 유지

* `name`: 소스 이름
* `value`: URL 또는 채널 주소
* `note`: 선택 메모

즉, `sources.yaml`에는 **지금 실제로 사용하는 소스만 남깁니다.**

---

## 6. 소스 관리 방식

소스 관리는 전부 채팅으로 수행

예시

### 추가

`이 유튜브 채널 추가해`

→ `sources.yaml`에 새 항목 추가

### 제거

`이 블로그 빼`

→ `sources.yaml`에서 해당 항목 삭제

### 조회

`현재 소스 목록 보여줘`

→ `sources.yaml` 목록 출력

### 메모 수정

`Reuters 메모를 글로벌 기본 뉴스 소스로 바꿔`

→ 해당 항목의 `note` 수정

---

## 7. 수집 규칙

collector는 매우 단순하게 동작

```text
sources.yaml 읽기
→ 등록된 모든 소스 사용
→ 뉴스 / SNS / 유튜브 수집
→ collected 폴더 저장
```

즉, `sources.yaml`에 있으면 사용하고
없으면 사용하지 않습니다.

---

## 8. 요약 처리

summarizer 역할

* 수집 자료 정리
* 핵심 이슈 요약
* 링크 포함 결과 생성

출력 예

```text
오늘 시장 주요 이슈

1. 미국 금리 관련 발언 증가
2. AI 반도체 투자 논의 확대

참고자료
- Reuters 기사
- 유튜브 영상
```

---

## 9. 소스 변경 기록

소스를 파일에서 삭제하더라도, 변경 이력은 남기는 것이 좋습니다.

파일: `logs/source_events.jsonl`

예시

```json
{"time":"2026-03-08","action":"add","name":"Reuters","value":"https://www.reuters.com/"}
{"time":"2026-03-08","action":"remove","name":"Some Blog","value":"https://example.com/blog"}
```

즉

* 현재 상태는 `sources.yaml`
* 과거 이력은 `logs/source_events.jsonl`

로 분리합니다.

---

## 10. 핵심 원칙

1. **소스 관리는 채팅으로만 수행**
2. **DB 없이 파일 기반**
3. **`sources.yaml`은 현재 사용 중인 소스만 저장**
4. **소스를 제거하면 파일에서 아예 삭제**
5. **모든 결과는 링크 포함**

---

## 최종 한 줄 설계

**nanobot이 채팅 명령으로 `sources.yaml`을 직접 수정하고, 거기에 등록된 소스들만 대상으로 뉴스/SNS/유튜브 자료를 수집해 요약과 레퍼런스를 제공하는 라즈베리파이 기반 개인 경제 정보 비서 시스템**
