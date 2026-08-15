# 폰트 — 자체 호스팅

시안(`캠핑하이브 AEO 홈페이지.dc.html`)이 쓰는 3종을 그대로 쓴다.
**CDN 링크를 넣지 않는다.** 파일이 이 저장소 안에 있다.

| 용도 | 폰트 | 폴더 | 파일 수 |
|---|---|---|---|
| 본문·제목 | Noto Sans KR (가변 wght 100~900) | `noto-sans-kr/` | 124 |
| 강조 | Noto Serif KR (가변 wght 200~900) | `noto-serif-kr/` | 124 |
| 수치·라벨 | JetBrains Mono (가변 wght 100~800) | `jetbrains-mono/` | 6 |

## 왜 파일이 254개인가

한글은 글자 수가 많아 한 벌이 수 MB다. 통으로 받게 하면 첫 화면이 늦다.
그래서 글자 범위(`unicode-range`)별로 쪼갠 조각을 두고, **브라우저가 그
페이지에 실제로 쓰인 글자의 조각만** 내려받는다. 한 페이지가 실제로 받는
양은 보통 5~10개, 수백 KB 수준이다.

저장소에 들어가는 총량과 방문자가 받는 양은 다르다. 파일 수를 줄이려고
통짜 파일로 바꾸지 말 것 — 그러면 방문자가 더 많이 받는다.

## @font-face 선언은 어디에 있나

`src/fonts-noto-sans-kr.css` · `src/fonts-noto-serif-kr.css` ·
`src/fonts-jetbrains-mono.css` 세 파일이다. 자동 생성 파일이므로 손으로
고치지 않는다. `build.mjs` 가 이 셋을 `src/styles.css` 앞에 붙여
`dist/styles.css` 하나로 내보낸다. `<link>` 를 하나로 유지하기 위해서다.

## 갱신법

```bash
powershell -ExecutionPolicy Bypass -File scripts/fetch-fonts.ps1
```

Google Fonts CSS2 API 에서 서브셋 woff2 를 내려받아 `url()` 만 로컬
경로로 바꾼다. 스크립트 파일은 **UTF-8 BOM** 으로 저장해야 한다 —
BOM 이 없으면 PowerShell 5.1 이 한글 경로를 깨뜨린다.

## 라이선스

셋 다 SIL Open Font License 1.1. 원문을 이 폴더에 동봉했다.

- `OFL-noto-sans-kr.txt`
- `OFL-noto-serif-kr.txt`
- `OFL-jetbrains-mono.txt`

## 폐기 기록

2026-08-15 이전에는 Pretendard Variable + Archivo 를 썼다. 시안 디자인으로
전환하면서 걷어냈다. 되살리지 말 것 — 시안이 정본이다.
