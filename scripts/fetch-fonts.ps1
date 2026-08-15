# 시안 폰트 3종을 자체 호스팅용으로 내려받는다.
# CDN 링크를 쓰지 않는다 — 구글이 쪼개 둔 서브셋 woff2 를 파일로 가져와
# url() 만 로컬 경로로 바꾼다. Pretendard 가 쓰던 방식과 같다.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
$AEO = "D:\Desktop\Claude_개발\홈피제작\aeo"

$families = @(
  @{ key = 'noto-sans-kr';   dir = 'noto-sans-kr';   url = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100..900&display=swap' },
  @{ key = 'noto-serif-kr';  dir = 'noto-serif-kr';  url = 'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@200..900&display=swap' },
  @{ key = 'jetbrains-mono'; dir = 'jetbrains-mono'; url = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100..800&display=swap' }
)

foreach ($f in $families) {
  $outDir = Join-Path $AEO "static\fonts\$($f.dir)"
  if (-not (Test-Path -LiteralPath $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

  $css = (Invoke-WebRequest -Uri $f.url -UseBasicParsing -UserAgent $UA -TimeoutSec 60).Content
  $urls = [regex]::Matches($css, 'url\((https://[^)]+\.woff2)\)') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique

  $i = 0
  foreach ($u in $urls) {
    $name = "$($f.key).$i.woff2"
    $dest = Join-Path $outDir $name
    if (-not (Test-Path -LiteralPath $dest)) {
      Invoke-WebRequest -Uri $u -UseBasicParsing -UserAgent $UA -TimeoutSec 60 -OutFile $dest
    }
    # CSS 안의 원격 주소를 로컬 상대경로로 바꾼다
    $css = $css.Replace($u, "fonts/$($f.dir)/$name")
    $i++
  }

  $header = @"
/* ─────────────────────────────────────────────────────────────
   $($f.key) — 동적 서브셋 (자동 생성 파일 · 직접 고치지 말 것)

   글자 범위별로 쪼갠 woff2 $($urls.Count)개. 브라우저가 실제로 쓰는 글자의
   조각만 내려받는다.

   출처: Google Fonts CSS2 API (가변축 wght)
   라이선스: SIL Open Font License 1.1 → static/fonts/OFL-$($f.key).txt
   갱신법: scratchpad/fetch-fonts.ps1 을 다시 실행한다.
   ───────────────────────────────────────────────────────────── */
"@
  Set-Content -LiteralPath (Join-Path $AEO "src\fonts-$($f.key).css") -Value ($header + "`n" + $css) -Encoding utf8
  "DONE $($f.key): $($urls.Count) files"
}

# OFL 라이선스 동봉
$licenses = @{
  'OFL-noto-sans-kr.txt'   = 'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/LICENSE'
  'OFL-noto-serif-kr.txt'  = 'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Serif/LICENSE'
  'OFL-jetbrains-mono.txt' = 'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/OFL.txt'
}
foreach ($k in $licenses.Keys) {
  try {
    Invoke-WebRequest -Uri $licenses[$k] -UseBasicParsing -TimeoutSec 30 -OutFile (Join-Path $AEO "static\fonts\$k")
    "LICENSE $k ok"
  } catch { "LICENSE $k FAILED: $($_.Exception.Message)" }
}
"ALL DONE"
