/* ─────────────────────────────────────────────────────────────
   점진적 향상 — 장식 전용

   이 파일은 글자를 만들지 않는다. 이미 HTML에 있는 것을 움직일 뿐이다.
   그래서 이 파일이 통째로 실패해도, 차단되어도, AI 크롤러가 실행하지
   않아도 페이지 내용은 100% 그대로 보인다.

   금지: innerHTML · createElement · insertAdjacentHTML · document.write
        (verify.mjs 가 매 빌드마다 이 파일에서 위 API 사용을 검사한다)

   카운트업은 예외적으로 textContent 를 건드리지만, 시작할 때 원본
   문자열을 저장해 두고 끝나면 반드시 같은 문자열로 되돌린다.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // JS가 살아 있을 때만 숨김 규칙이 켜진다.
  // 이 클래스가 없으면 .reveal 은 처음부터 보이는 상태다.
  if (!reduced) root.className += ' js-on';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    /* 1) 스크롤 진입 페이드업 — 카드 격자는 0.08s 시차
     *
     * ⚠ 이 블록은 "실패하면 아무것도 안 보이는" 구조라 안전장치를 세 겹 둔다.
     *   .reveal 은 opacity:0 으로 시작하므로, is-in 이 끝내 안 붙으면
     *   페이지가 통째로 빈 화면이 된다. IntersectionObserver 는 페이지가
     *   실제로 그려지지 않는 상황(숨은 탭, 프리렌더, 헤드리스)에서는
     *   콜백을 부르지 않는다. 그래서:
     *     ① 처음부터 화면 안에 있는 것은 옵저버를 기다리지 않고 바로 켠다
     *     ② 옵저버는 스크롤로 들어오는 것만 담당한다
     *     ③ 1.5초가 지나면 이유를 불문하고 전부 켠다
     *   애니메이션은 어디까지나 장식이고, 글이 보이는 것이 먼저다.
     */
    var targets = document.querySelectorAll('.reveal');

    function revealAll() {
      for (var a = 0; a < targets.length; a++) targets[a].classList.add('is-in');
    }

    if (reduced || !('IntersectionObserver' in window)) {
      revealAll();
    } else {
      // ① 첫 화면에 이미 들어와 있는 것
      for (var b = 0; b < targets.length; b++) {
        if (targets[b].getBoundingClientRect().top < window.innerHeight) {
          targets[b].classList.add('is-in');
        }
      }

      // ② 스크롤해서 들어오는 것
      var io = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
              entries[i].target.classList.add('is-in');
              io.unobserve(entries[i].target);
            }
          }
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
      );
      for (var c = 0; c < targets.length; c++) {
        if (!targets[c].classList.contains('is-in')) io.observe(targets[c]);
      }

      // ③ 마지막 안전장치 — 무슨 일이 있어도 글은 보인다
      window.setTimeout(revealAll, 1500);
    }

    /* 2) 헤더 스크롤 변형 (72px → 60px + 배경 흐림) */
    var header = document.querySelector('.site-header');
    var floating = document.querySelector('.floating');
    var ticking = false;

    function onScroll() {
      var y = window.pageYOffset || root.scrollTop;
      if (header) header.classList.toggle('is-scrolled', y > 24);
      /* 3) 플로팅 버튼 — 400px 지나면 등장 */
      if (floating) floating.classList.toggle('is-visible', y > 400);
      ticking = false;
    }
    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(onScroll);
        }
      },
      { passive: true }
    );
    onScroll();

    /* 4) 카운트업 — 원본 문자열을 반드시 되돌린다 */
    function countUp(el) {
      var original = el.textContent;
      var m = original.match(/-?[\d,.]+/);
      if (!m) return;
      var target = parseFloat(m[0].replace(/,/g, ''));
      if (!isFinite(target)) return;
      var decimals = (m[0].split('.')[1] || '').length;
      var head = original.slice(0, m.index);
      var tail = original.slice(m.index + m[0].length);
      var start = null;
      var DURATION = 1200;

      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / DURATION, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        if (p < 1) {
          var v = (target * eased).toFixed(decimals);
          if (decimals === 0) v = Number(v).toLocaleString('ko-KR');
          el.textContent = head + v + tail;
          window.requestAnimationFrame(frame);
        } else {
          el.textContent = original; // 원본 복원 — 이 값이 소스의 값이다
        }
      }
      window.requestAnimationFrame(frame);
    }

    var nums = document.querySelectorAll('[data-countup]');
    if (!reduced && 'IntersectionObserver' in window) {
      var io2 = new IntersectionObserver(
        function (entries) {
          for (var k = 0; k < entries.length; k++) {
            if (entries[k].isIntersecting) {
              countUp(entries[k].target);
              io2.unobserve(entries[k].target);
            }
          }
        },
        { threshold: 0.6 }
      );
      for (var n = 0; n < nums.length; n++) io2.observe(nums[n]);
    }

    /* 4-1) 커버 회전 — 이미지 3장 + 카피 3벌, 7초 간격
     *
     * 클래스만 토글한다. 글자도 요소도 만들지 않는다.
     * 카피 3벌은 이미 HTML 에 다 있고 CSS 가 opacity 로 감춰 둔 것이라,
     * 이 블록이 통째로 죽어도 첫 벌은 그대로 읽힌다.
     *
     * 이미지는 겹쳐서 교차 페이드(900ms). 카피는 시안과 같게
     * "먼저 사라지고(900ms) 다음 것이 나타나는" 순서로 간다.
     */
    var coverEl = document.querySelector('[data-cover]');
    if (coverEl && !reduced) {
      var cImgs = coverEl.querySelectorAll('.cover-img');
      var cLines = coverEl.querySelectorAll('.cover-line');
      var slides = Math.min(cImgs.length, cLines.length);

      if (slides > 1) {
        // 초기 상태는 마크업의 인라인 opacity 가 정한다(첫 장 1, 나머지 0).
        // JS 가 없거나 reduced-motion 이면 그 상태로 멈춰 첫 장이 보인다.
        // 인라인 값은 클래스로 못 이기므로 여기서도 style 을 직접 바꾼다.
        var at = 0;
        window.setInterval(function () {
          var next = (at + 1) % slides;

          // 이미지 — 교차 페이드 (transition 900ms 는 마크업에 있다)
          cImgs[at].style.opacity = '0';
          cImgs[next].style.opacity = '1';

          // 카피 — 사라진 뒤에 다음 것을 올린다 (시안과 같은 순서)
          cLines[at].style.opacity = '0';
          var show = next;
          window.setTimeout(function () {
            cLines[show].style.opacity = '1';
          }, 900);

          at = next;
        }, 7000);
      }
    }

    /* 4-2) 오프닝 AI 엔진 배지 — ChatGPT · Claude · Gemini 2.6초 순환
     *
     * 세 벌이 이미 마크업에 있다. 여기서는 is-on 을 옮길 뿐이고
     * 글자·색을 만들지 않는다. JS 가 죽으면 첫 벌(ChatGPT)이 그대로 남는다.
     * 간격은 시안 JS 의 2600ms 를 그대로 쓴다.
     */
    var engineSets = document.querySelectorAll('.engine-set');
    if (engineSets.length > 1 && !reduced) {
      var eAt = 0;
      window.setInterval(function () {
        var eNext = (eAt + 1) % engineSets.length;
        engineSets[eAt].classList.remove('is-on');
        engineSets[eNext].classList.add('is-on');
        eAt = eNext;
      }, 2600);
    }

    /* 4-3) 손님 질문 세 벌 — 커버 검색창과 데모 대화가 함께 돈다
     *
     * 질문(.demo-ask)과 답변 첫 줄(.demo-lead)은 짝이라 같은 번호를 켠다.
     * 어긋나면 "계곡 캠핑장" 질문에 "애견 동반" 답이 붙는다.
     * 여기서도 is-on 만 옮긴다. 글자는 이미 셋 다 마크업에 있다.
     *
     * 6초 — 시안은 타이핑(약 5초)+유지(5.2초)로 한 바퀴가 길지만,
     * 타이핑을 재현하지 않으므로 읽을 만한 간격으로 줄였다.
     */
    var askGroups = [
      document.querySelectorAll('.ask-set'),
      document.querySelectorAll('.demo-ask'),
      document.querySelectorAll('.demo-lead'),
    ].filter(function (g) { return g.length > 1; });

    if (askGroups.length && !reduced) {
      var qAt = 0;
      var qLen = askGroups[0].length;
      window.setInterval(function () {
        var qNext = (qAt + 1) % qLen;
        for (var g = 0; g < askGroups.length; g++) {
          var set = askGroups[g];
          if (set[qAt]) set[qAt].classList.remove('is-on');
          if (set[qNext]) set[qNext].classList.add('is-on');
        }
        qAt = qNext;
      }, 6000);
    }

    /* 5) 전환율 바 — 0에서 목표 %까지. % 숫자 자체는 정적 텍스트다 */
    var bars = document.querySelectorAll('.conv-fill');
    if (!reduced && 'IntersectionObserver' in window) {
      var io3 = new IntersectionObserver(
        function (entries) {
          for (var b = 0; b < entries.length; b++) {
            if (!entries[b].isIntersecting) continue;
            var el = entries[b].target;
            var pct = el.getAttribute('data-pct') || '0';
            el.style.transition = 'width 1s ease';
            el.style.width = pct + '%';
            io3.unobserve(el);
          }
        },
        { threshold: 0.5 }
      );
      for (var c = 0; c < bars.length; c++) {
        bars[c].style.width = '0%';
        io3.observe(bars[c]);
      }
    }
  });
})();
