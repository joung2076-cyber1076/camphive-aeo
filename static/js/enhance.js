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

          // 카피 — 두 줄이 같이 사라진 뒤(900ms), 다음 벌은 1줄 먼저,
          // 2줄은 700ms 뒤에 올라와 두 줄이 완성된다(2026-08-22 사장님 지시).
          // 7초 주기 안: 퇴장 0.9s → 1줄 1.4s(흐림→선명·28px 부상) → 2줄 +0.55s 겹쳐 → 두 줄 완성 약 4.2s 노출.
          var hideSpans = cLines[at].querySelectorAll('span');
          var k;
          for (k = 0; k < hideSpans.length; k++) {
            hideSpans[k].style.transitionDelay = '0ms';
            hideSpans[k].style.opacity = '0';
            hideSpans[k].style.transform = 'translateY(10px)';
            hideSpans[k].style.filter = 'blur(6px)';
          }
          var hide = at, show = next;
          window.setTimeout(function () {
            cLines[hide].style.opacity = '0';
            var showSpans = cLines[show].querySelectorAll('span');
            var j;
            for (j = 0; j < showSpans.length; j++) {
              // 마크업의 transition 값을 보관해 두고 되살린다(지우면 전환이 사라진다)
              if (!showSpans[j].dataset.tr) showSpans[j].dataset.tr = showSpans[j].style.transition;
              showSpans[j].style.transition = 'none';
              showSpans[j].style.opacity = '0';
              showSpans[j].style.transform = 'translateY(28px)';
              showSpans[j].style.filter = 'blur(10px)';
            }
            cLines[show].style.opacity = '1';
            // 시작값을 강제로 반영(리플로우)한 뒤 전환을 되살려 1줄 → 2줄 순으로 올린다.
            // rAF 는 숨은 탭에서 멈추므로 쓰지 않는다.
            void cLines[show].offsetHeight;
            for (var m = 0; m < showSpans.length; m++) {
              showSpans[m].style.transition = showSpans[m].dataset.tr;
              showSpans[m].style.transitionDelay = m === 0 ? '0ms' : '550ms';
              showSpans[m].style.opacity = '1';
              showSpans[m].style.transform = 'translateY(0)';
              showSpans[m].style.filter = 'blur(0)';
            }
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

    /* 6) 진단 리포트 샘플 창 (2026-11-01 · 11-02 전면 개편) — sample-viewer.mjs 가 만든 마크업
     *
     * 창 · 10쪽(2026-11-05 v66 · 새 리포트) · 「N / 10」 · 썸네일 · 잠금 안내 · 확대 보기 그림은 이미 마크업에
     * 다 있다. 여기서는 열고 닫고, is-on 을 옮겨 한 쪽씩 보이고, 쪽을 누르면
     * 확대 보기를 켜고, 끌어서 움직이게만 한다. 이 블록이 실패하면 단추가
     * #sample-report 로 이동해 :target 으로 열리고 쪽이 세로로 이어 보인다.
     * 열 때 주소에 #을 남기지 않는다 — 닫은 뒤 :target 이 다시 창을 열지 않게.
     */
    var sv = document.getElementById('sample-report');
    if (sv) {
      root.classList.add('sv-js');
      var svBox = sv.querySelector('.sv-box');
      var svMeta = sv.querySelector('.sv-meta');
      var svStage = sv.querySelector('.sv-stage');
      var svSlides = sv.querySelectorAll('.sv-slide');
      var svAts = sv.querySelectorAll('.sv-at span');
      var svThumbs = sv.querySelectorAll('.sv-thumb');
      var svPrev = sv.querySelector('.sv-prev');
      var svNext = sv.querySelector('.sv-next');
      var svClose = sv.querySelector('.sv-close-meta');
      var svPane = sv.querySelector('.sv-zoom-pane');
      var svZimgs = sv.querySelectorAll('.sv-zimg');
      var svZx = sv.querySelector('.sv-zoom-x');
      var svAt = 0;
      var svFrom = null;
      var svZoomFrom = null;

      var svShow = function (i) {
        svAt = Math.max(0, Math.min(svSlides.length - 1, i));
        for (var s = 0; s < svSlides.length; s++) svSlides[s].classList.toggle('is-on', s === svAt);
        for (var a = 0; a < svAts.length; a++) svAts[a].classList.toggle('is-on', a === svAt);
        for (var d = 0; d < svThumbs.length; d++) {
          svThumbs[d].setAttribute('aria-current', String(Number(svThumbs[d].getAttribute('data-sv-go')) === svAt));
        }
        if (svPrev) svPrev.disabled = svAt === 0;
        if (svNext) svNext.disabled = svAt === svSlides.length - 1;
        // 새 쪽의 첫머리가 보이게 — 머리띠를 보고 있을 때는 그대로 둔다
        // (위에 붙는 .sv-meta 는 붙은 자리를 재므로, 붙지 않는 .sv-stage 로 잰다)
        if (svBox && svMeta && svStage) {
          var svTop = svStage.offsetTop - svMeta.offsetHeight;
          if (svBox.scrollTop > svTop) svBox.scrollTop = svTop;
        }
      };

      var svOpen = function (e) {
        if (e) { e.preventDefault(); svFrom = e.currentTarget; }
        svShow(0);
        sv.classList.add('is-open');
        root.classList.add('sv-open');
        if (svBox) svBox.scrollTop = 0;
        if (svClose) svClose.focus({ preventScroll: true });
      };

      var svZoomShut = function () {
        sv.classList.remove('is-zoom');
        if (svZoomFrom) svZoomFrom.focus();
      };

      var svShut = function (e) {
        if (e) e.preventDefault();
        sv.classList.remove('is-zoom');
        sv.classList.remove('is-open');
        root.classList.remove('sv-open');
        if (location.hash === '#sample-report' && window.history && history.replaceState) {
          history.replaceState(null, '', location.pathname + location.search);
        }
        if (svFrom) svFrom.focus();
      };

      // 쪽을 누르면 확대 보기 — 누른 자리가 화면 가운데 오게
      var svZoomOpen = function (e) {
        e.preventDefault();
        var idx = this.getAttribute('data-sv-zoom');
        var r = this.getBoundingClientRect();
        var fx = e.clientX ? (e.clientX - r.left) / r.width : 0.5;
        var fy = e.clientY ? (e.clientY - r.top) / r.height : 0;
        var img = null;
        for (var z = 0; z < svZimgs.length; z++) {
          var on = svZimgs[z].getAttribute('data-sv-z') === idx;
          svZimgs[z].classList.toggle('is-on', on);
          if (on) img = svZimgs[z];
        }
        svZoomFrom = this;
        sv.classList.add('is-zoom');
        if (img && svPane) {
          svPane.scrollLeft = Math.max(0, fx * img.offsetWidth - svPane.clientWidth / 2);
          svPane.scrollTop = Math.max(0, fy * img.offsetHeight - svPane.clientHeight / 2);
        }
        if (svZx) svZx.focus();
      };

      var svOpeners = document.querySelectorAll('[data-sample-open]');
      for (var o = 0; o < svOpeners.length; o++) svOpeners[o].addEventListener('click', svOpen);

      var svExits = sv.querySelectorAll('.sv-close, .sv-exit');
      for (var x = 0; x < svExits.length; x++) svExits[x].addEventListener('click', svShut);

      var svPapers = sv.querySelectorAll('[data-sv-zoom]');
      for (var p = 0; p < svPapers.length; p++) svPapers[p].addEventListener('click', svZoomOpen);
      if (svZx) svZx.addEventListener('click', svZoomShut);

      if (svPrev) svPrev.addEventListener('click', function () { svShow(svAt - 1); });
      if (svNext) svNext.addEventListener('click', function () { svShow(svAt + 1); });
      for (var t = 0; t < svThumbs.length; t++) {
        svThumbs[t].addEventListener('click', function () {
          svShow(Number(this.getAttribute('data-sv-go')));
        });
      }

      // 확대 보기 — 마우스로 끌어서 움직인다(손가락은 브라우저가 밀어 준다)
      var svDrag = null;
      if (svPane) {
        svPane.addEventListener('pointerdown', function (e) {
          if (e.pointerType !== 'mouse' || e.button !== 0) return;
          svDrag = { x: e.clientX, y: e.clientY, l: svPane.scrollLeft, t: svPane.scrollTop };
          svPane.classList.add('is-drag');
          if (svPane.setPointerCapture) svPane.setPointerCapture(e.pointerId);
          e.preventDefault();
        });
        svPane.addEventListener('pointermove', function (e) {
          if (!svDrag) return;
          svPane.scrollLeft = svDrag.l - (e.clientX - svDrag.x);
          svPane.scrollTop = svDrag.t - (e.clientY - svDrag.y);
        });
        var svDragEnd = function () { svDrag = null; svPane.classList.remove('is-drag'); };
        svPane.addEventListener('pointerup', svDragEnd);
        svPane.addEventListener('pointercancel', svDragEnd);
      }

      // 휴대폰 — 쪽을 옆으로 밀어 넘긴다(두 손가락으로 키운 동안은 넘기지 않음)
      var svSwipe = null;
      if (svStage) {
        svStage.addEventListener('touchstart', function (e) {
          svSwipe = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
        }, { passive: true });
        svStage.addEventListener('touchend', function (e) {
          if (!svSwipe || !e.changedTouches.length) return;
          var dx = e.changedTouches[0].clientX - svSwipe.x;
          var dy = e.changedTouches[0].clientY - svSwipe.y;
          svSwipe = null;
          if (window.visualViewport && window.visualViewport.scale > 1.05) return;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) svShow(svAt + (dx < 0 ? 1 : -1));
        }, { passive: true });
      }

      // 바깥 어두운 곳을 누르면 닫는다
      sv.addEventListener('click', function (e) { if (e.target === sv) svShut(e); });

      document.addEventListener('keydown', function (e) {
        if (!sv.classList.contains('is-open')) return;
        if (e.key === 'Escape') {
          if (sv.classList.contains('is-zoom')) { e.preventDefault(); svZoomShut(); }
          else svShut(e);
        } else if (sv.classList.contains('is-zoom')) {
          return;
        } else if (e.key === 'ArrowLeft') svShow(svAt - 1);
        else if (e.key === 'ArrowRight') svShow(svAt + 1);
      });

      // #sample-report 주소로 바로 들어온 경우 — 같은 창을 쪽 넘김으로 연다
      if (location.hash === '#sample-report') svOpen(null);
    }

    /* 7) 홈 FAQ 갈래 탭 · 더보기 (2026-11-01 v64)
     *
     * 16문항은 전부 마크업에 있다. 여기서는 is-hidden 만 옮긴다.
     * 「전체 보기」는 앞 6문항을 먼저 보이고 「더 보기」로 나머지를 연다.
     * 갈래 탭은 data-faq-cat 이 같은 문항만 보인다(더 보기 없이 전부).
     * 이 블록이 실패하면 faq-js 가 붙지 않아 탭 · 더 보기는 숨고 16문항이 다 보인다.
     */
    var faqTabs = document.querySelectorAll('[data-faq-tab]');
    var faqItems = document.querySelectorAll('#faq details[data-faq-cat]');
    var faqMore = document.querySelector('[data-faq-more]');
    if (faqTabs.length && faqItems.length) {
      root.classList.add('faq-js');
      var FAQ_FIRST = 6;
      var faqOpenAll = false;
      var faqCur = 'all';

      var faqApply = function () {
        for (var i = 0; i < faqItems.length; i++) {
          var hide = faqCur === 'all'
            ? (!faqOpenAll && i >= FAQ_FIRST)
            : faqItems[i].getAttribute('data-faq-cat') !== faqCur;
          faqItems[i].classList.toggle('is-hidden', hide);
        }
        if (faqMore) faqMore.classList.toggle('is-hidden', !(faqCur === 'all' && !faqOpenAll));
        for (var k = 0; k < faqTabs.length; k++) {
          faqTabs[k].setAttribute('aria-pressed', String(faqTabs[k].getAttribute('data-faq-tab') === faqCur));
        }
      };

      for (var ft = 0; ft < faqTabs.length; ft++) {
        faqTabs[ft].addEventListener('click', function () {
          faqCur = this.getAttribute('data-faq-tab');
          faqApply();
        });
      }
      if (faqMore) {
        faqMore.addEventListener('click', function () {
          faqOpenAll = true;
          faqApply();
          // 더 보기로 연 첫 문항(7번째)으로 초점을 옮긴다 — 키보드로 이어 읽게
          var firstNew = faqItems[FAQ_FIRST] && faqItems[FAQ_FIRST].querySelector('summary');
          if (firstNew) firstNew.focus();
        });
      }
      faqApply();
    }

    /* 8) 홈 첫 화면 위젯 (2026-11-05 v66 · 기준 화면 시안 A v3 그대로)
     *
     * 위젯이 화면에 들어올 때 «1회만» 돈다: 0~1.2초 줄 등장 → 1.5초 숫자 · 상태 전환 → 3초 그린 빛.
     * 그 뒤 숫자는 멈추고 코어(링 회전 · 파동 · 레이더)만 CSS 로 계속 돈다.
     * 숫자는 카운트업 동안 textContent 를 바꾸고 끝 값(마크업의 data-to · 94)에서 멈춘다 — 글자를 새로 만들지 않는다.
     * 움직임 줄이기 설정이면 완성 장면(94 · 목표 시나리오)을 바로 정지 화면으로 보여 준다.
     * 스크립트가 없으면 처음 상태(31 · 예시 화면)가 그대로 보인다(줄은 숨기지 않는다 — armed 는 여기서만 붙는다).
     */
    var hw = document.getElementById('hw');
    if (hw) {
      var hwSv = document.getElementById('hw-sv');
      var hwG = document.getElementById('hw-g');
      var hwLab = document.getElementById('hw-lab');
      var hwEx = document.getElementById('hw-ex');
      var hwRows = hw.querySelectorAll('.h-row');
      var hwBars = hw.querySelectorAll('.h-bar');
      var hwCount = function (el, from, to, ms) {
        if (reduced || !window.requestAnimationFrame) { el.textContent = String(to); return; }
        var t0 = performance.now();
        var step = function (t) {
          var p = Math.min(1, (t - t0) / ms);
          var e = 1 - Math.pow(1 - p, 3);
          el.textContent = String(Math.round(from + (to - from) * e));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };
      var hwRun = function () {
        var T = reduced ? 0 : 1;
        hw.classList.add('go');
        setTimeout(function () {
          if (hwSv) hwCount(hwSv, 31, 94, 1500);
          if (hwG) hwG.style.width = '94%';
          for (var b = 0; b < hwBars.length; b++) {
            var pv = hwBars[b].querySelector('.h-pv');
            if (!pv) continue;
            var to = Number(pv.getAttribute('data-to'));
            hwBars[b].style.setProperty('--w', to + '%');
            hwCount(pv, Number(pv.textContent), to, 1500);
          }
          for (var r = 0; r < hwRows.length; r++) {
            (function (row, k) { setTimeout(function () { row.classList.add('flip'); }, k * 250 * T); })(hwRows[r], r);
          }
        }, 1500 * T);
        setTimeout(function () {
          if (hwG) hwG.style.background = 'var(--t-accent)';
          hw.classList.add('done');
          if (hwLab) hwLab.textContent = '목표 점수';
          if (hwEx) hwEx.textContent = '예시 화면 · 목표 시나리오';
        }, 3000 * T);
      };
      if (reduced || !('IntersectionObserver' in window)) {
        hwRun();
      } else {
        hw.classList.add('armed');
        var hwIo = new IntersectionObserver(function (es) {
          for (var i = 0; i < es.length; i++) {
            if (es[i].isIntersecting) { hwRun(); hwIo.disconnect(); break; }
          }
        }, { threshold: 0.3 });
        hwIo.observe(hw);
      }
    }

    /* 9) 홈 홍보영상 (2026-11-05 v66) — 자동 재생 없음 · 누를 때만 받는다(preload="none").
     * 스크립트가 있으면 기본 재생 막대를 감추고 그린 재생 단추를 보인다. 장 바로가기는 그 시각으로 옮겨 재생한다.
     */
    var pv = document.getElementById('promo-video');
    if (pv) {
      var pBox = pv.parentNode;
      var pBtn = pBox.querySelector('.h-play');
      var pStart = function (t) {
        pv.setAttribute('controls', '');
        if (pBtn) pBtn.hidden = true;
        pBox.classList.add('playing');
        if (typeof t === 'number') {
          var seek = function () { try { pv.currentTime = t; } catch (e) { /* 아직 못 옮기면 처음부터 */ } };
          if (pv.readyState >= 1) seek(); else pv.addEventListener('loadedmetadata', seek, { once: true });
        }
        var pr = pv.play();
        if (pr && pr.catch) pr.catch(function () { /* 브라우저가 막으면 재생 막대로 직접 누른다 */ });
      };
      if (pBtn) {
        pv.removeAttribute('controls');
        pBtn.hidden = false;
        pBtn.addEventListener('click', function () { pStart(); });
      }
      var pChaps = document.querySelectorAll('[data-seek]');
      for (var pc = 0; pc < pChaps.length; pc++) {
        pChaps[pc].addEventListener('click', function () {
          pStart(Number(this.getAttribute('data-seek')));
          if (pBox.scrollIntoView) pBox.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
        });
      }
    }
  });
})();
