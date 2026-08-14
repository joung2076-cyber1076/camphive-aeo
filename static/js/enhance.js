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
    /* 1) 스크롤 진입 페이드업 — 카드 격자는 0.08s 시차 */
    var targets = document.querySelectorAll('.reveal');
    if (!reduced && 'IntersectionObserver' in window) {
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
      for (var i = 0; i < targets.length; i++) io.observe(targets[i]);
    } else {
      for (var j = 0; j < targets.length; j++) targets[j].classList.add('is-in');
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
