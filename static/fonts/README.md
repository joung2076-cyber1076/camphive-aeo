# 폰트 — 여기에 파일을 넣으십시오

**현재 이 폴더는 비어 있습니다.** 폰트 파일이 없어도 사이트는 정상 동작하며,
시스템 한글 폰트(맑은 고딕 등)로 그려집니다. 아래 두 파일을 넣으면 그때부터
설계된 서체로 바뀝니다. 코드는 이미 그 이름을 찾도록 되어 있습니다.

| 넣을 파일 이름 | 무엇 | 어디서 |
|---|---|---|
| `PretendardVariable.woff2` | 본문·한글 전체 | Pretendard 공식 배포처의 `woff2` 가변 폰트 |
| `Archivo-Expanded.woff2` | 영문 헤딩(자폭 넓은 대문자) | Archivo 계열 Expanded |

## 왜 CDN을 쓰지 않는가

외부 CDN에서 폰트를 불러오면 **의존성이 0이 아니게 된다.** 그 서버가 죽으면
글자가 깨지고, 접속 국가에 따라 로딩이 느려진다. 무엇보다 AI 크롤러가 페이지를
읽는 시점에 외부 요청이 하나 더 붙는다. 폰트는 우리 서버에 둔다.

## 넣은 뒤 확인

```bash
npm run check
```

빌드가 통과하면 `npm run dev` 로 열어 헤딩이 바뀌었는지 눈으로 봅니다.
파일 이름이 위 표와 한 글자라도 다르면 조용히 무시되고 fallback으로 그려집니다.

## 지금 무엇으로 그려지고 있나

`src/styles.css` 의 `--sans` / `--head` 순서대로 찾습니다.

- 본문 `--sans`: Pretendard Variable → Pretendard → 시스템 → **맑은 고딕**
- 헤딩 `--head`: Archivo Expanded → Pretendard Variable → 본문과 동일

즉 지금은 본문·헤딩이 같은 서체로 보입니다. 의도한 "자폭 넓은 영문 헤딩 대비"는
`Archivo-Expanded.woff2` 를 넣어야 살아납니다.
