<div align="center">

# 배틀 드론 한국어판 (Battle Drones KO)

**비공식 한국어판 — 모바일 웹 RTS 「Battle Drones」의 화면 문구를 한국어로**

[▶ 플레이하기](https://sigco3111.github.io/battledrones-ko/) · [원작 저장소](https://github.com/simonw/battledrones) · [원작 데모](https://simonw.github.io/battledrones/)

</div>

## 소개

「Battle Drones」는 simonw가 만든 모바일 웹 RTS입니다. 드론과 로봇 부대로 고철을 캐고, 기지를 세우고, 적 본부와 골리앗을 부수는 게임입니다. 설치도 계정도 필요 없습니다.

이 저장소는 원작 소스(Apache-2.0)를 그대로 가져와 **화면에 보이는 영어 문구만 한국어로 바꾼 비공식 한국어판**입니다. 오른쪽 아래 **한국어 / English** 버튼으로 언제든 원문으로 돌아갈 수 있고, 선택은 브라우저에 저장됩니다.

## 번역 방식

- 원작이 TypeScript에 문자열을 하드코딩하고 HUD를 DOM으로 그리는 구조라, 소스를 문장마다 고치는 대신 **표시 시점 번역 오버레이**를 씁니다(1번 작업 cadle-ko와 같은 방식).
  - `src/i18n/overlay.ts` — DOM 텍스트 노드와 title/aria-label/placeholder 속성을 관찰해 사전에 있는 문구만 바꿉니다. 원문은 노드별로 보존해 두었다가 English 모드에서 되돌립니다.
  - `src/i18n/ko/*.json` — 원문 → 한국어 사전(약 550개 항목)과 숫자가 섞인 문구용 정규식 규칙.
  - `index.html` — 오버레이 스크립트 한 줄만 추가했습니다.
- 한글 글꼴은 시스템 글꼴 우선(Apple SD Gothic Neo, Malgun Gothic, Noto Sans KR)이며 웹폰트를 내려받지 않습니다.
- 용어는 [docs/glossary.md](docs/glossary.md)에 고정했습니다.

### 번역 범위

- 유닛 16종·건물·맵 목표물의 이름과 역할 설명, 상성 표기
- 인게임 HUD(자원·업링크·지휘 게이지·생산 버튼·지원 호출), 오프너 선택, 일시정지·설정
- 전투 알림과 토스트(본부 피격, 골리앗 견인, 생산 불가 등), 승패·무승부·작전 결과
- 메인 메뉴, 맵 이름과 지형, 난이도, 데일리 작전·변형 규칙, 경력 등급 이름
- 전투 결과 화면 지표 이름, 리플레이·관전 버튼

### 남은 부분

- 「플레이 방법」 안내문의 긴 본문 문단은 아직 영어입니다. 소제목과 핵심 용어는 번역했습니다.
- 온라인 대전 로비 문구 일부와 원작 개발 문서(*.md)는 번역하지 않았습니다.
- 차량·3D 모델 참고 페이지와 리플레이 뷰어에는 오버레이를 넣지 않았습니다.

## 원작과 다른 점 (번역 외 변경)

- `index.html`: 오버레이 스크립트 1줄, lang="ko", 변경 고지 주석 추가.
- `src/i18n/`, `docs/glossary.md`, `NOTICE`, `tools/ko_scan2.py`, Pages 워크플로 추가.
- 원작의 `.github/workflows`는 가져오지 않았습니다(배포 워크플로만 새로 둠).
- 원작 게임 로직·밸런스·에셋은 건드리지 않았습니다.

## 외부 서비스

- 원작은 친구와의 온라인 대전에 자체 릴레이 서버(wss://battledrones-relay.fly.dev)를 씁니다. 이 한국어판은 그 서버를 쓰지 않도록 코드를 고치지 않았지만, 버전 해시가 달라 실제 대전은 성립하지 않습니다. 온라인 대전 메뉴는 남아 있으며 연결되지 않습니다.
- 분석·통계·의견 팝업·광고는 원작에 없어 제거한 외부 기능은 없습니다.

## 라이선스·크레딧

- 원작 README와 개발 문서는 원작 저장소에 그대로 있습니다: https://github.com/simonw/battledrones
- 원작: **Battle Drones** © simonw — https://github.com/simonw/battledrones, Apache License 2.0. 원문 LICENSE를 그대로 두었고 NOTICE에 변경 사실을 적었습니다.
- 한국어 번역·오버레이: sigco3111 (비공식, 원작자와 무관).

## 빌드

```bash
npm install
npx vite build --base=/battledrones-ko/
```

GitHub Actions(ko-build)가 같은 명령으로 빌드해 Pages에 올리고, 빌드 산출물에 루트 절대 경로가 남았는지 검사합니다.

## 검증 기록

| 항목 | 결과 |
| --- | --- |
| Pages 주소 | 확인 (메뉴 렌더) |
| 한국어 표시 | 확인 (메뉴·맵 목록·HUD·생산 버튼·오프너·일시정지·전투 알림) |
| English 전환 | 확인 (원문 복귀, 선택 저장) |
| 하위 경로 배포 | 확인 (base=/battledrones-ko/) |
| 실제 플레이 | 부분 확인 (스커미시 시작·HUD·오프너·일시정지·도움말까지) |
| 스크린샷 | 미확인 — 클라우드 브라우저 캡처 실패, 소유자 캡처 필요 |
