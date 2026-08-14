# 폰트 — 자체 호스팅 (설치 완료)

이 폴더의 파일이 그대로 사이트에 실린다. **외부 CDN을 부르지 않는다.**

| 파일 | 크기 | 무엇 | 라이선스 |
|---|---|---|---|
| `PretendardVariable.woff2` | 2.0MB | 본문·한글 전체 (가변 45~920) | OFL 1.1 → `OFL-Pretendard.txt` |
| `Archivo-Variable.woff2` | 88KB | 영문 헤딩 (가변 wdth 62.5~125 / wght 100~900) | OFL 1.1 → `OFL-Archivo.txt` |

둘 다 **SIL Open Font License 1.1** 이라 자체 호스팅 재배포가 허용된다.
라이선스 전문을 같은 폴더에 함께 둔다 — OFL이 요구하는 조건이다.

## "Expanded" 는 별도 파일이 아니다

Archivo는 **자폭(wdth) 축을 가진 가변 폰트 한 개**다. 넓은 헤딩은
`font-stretch: 125%` 로 뽑아 쓴다. `styles.css` 에서 h1·h2·브랜드·큰 숫자에
그 값을 걸어 두었다. 별도의 `Archivo-Expanded` 파일을 찾지 않는다.

## 한글은 Archivo 로 그리지 않는다

`Archivo-Variable.woff2` 는 **라틴 문자만 담긴 서브셋**이다. `@font-face` 에
`unicode-range` 를 걸어 두었으므로 한글 헤딩은 브라우저가 자동으로
Pretendard 로 넘긴다. 그래서 88KB로 끝난다.

## Pretendard 2MB가 부담이면

지금은 전 글자를 담은 한 파일이다. `font-display: swap` 이라 글자는 즉시
보이고 폰트는 나중에 바뀌므로 화면이 비는 시간은 없다.

더 줄이려면 Pretendard 가 제공하는 **동적 서브셋**(unicode-range 로 쪼갠
woff2 수백 개)으로 바꿀 수 있다. 실제로 쓰는 글자만 내려받으므로 첫 화면
전송량이 크게 줄지만, 파일이 수백 개로 늘고 `@font-face` 선언도 그만큼
늘어난다. **필요해지면 그때 바꾼다.** 지금 구조로도 외부 요청은 0이다.

## 출처

- Pretendard — `github.com/orioncactus/pretendard` (dist/web/variable/woff2)
- Archivo — `github.com/google/fonts` (ofl/archivo), 라틴 서브셋 woff2

폰트를 갱신할 때는 위에서 파일을 다시 받아 같은 이름으로 덮어쓰고
`npm run check` 를 돌린다. 파일명이 바뀌면 `styles.css` 도 함께 고친다.
