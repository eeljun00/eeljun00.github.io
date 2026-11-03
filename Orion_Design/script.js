/* Local interactions for the Orion portfolio implementation. */
(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const clean = element => element?.textContent.replace(/\s+/g, ' ').trim() || '';
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const dialog = $('#detail-dialog');
  let lastFocus;
  function openDetail(title, body, options = {}) {
    lastFocus = document.activeElement;
    const content = $('#dialog-content');
    content.replaceChildren();
    if (options.image) {
      const img = document.createElement('img'); img.src = options.image;
      img.alt = title; img.className = 'dialog-image'; content.append(img);
    }
    const heading = document.createElement('h2'); heading.id = 'dialog-title';
    heading.className = 'dialog-title'; heading.textContent = title; content.append(heading);
    const paragraph = document.createElement('p'); paragraph.className = 'dialog-body';
    paragraph.textContent = body; content.append(paragraph);
    if (options.links) {
      const links = document.createElement('div'); links.className = 'dialog-links';
      options.links.forEach(([label, href]) => {
        const a = document.createElement('a'); a.textContent = label; a.href = href;
        if (href.startsWith('https:')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        links.append(a);
      }); content.append(links);
    }
    if (options.note) {
      const note = document.createElement('p'); note.className = 'dialog-note';
      note.textContent = options.note; content.append(note);
    }
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  }
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => lastFocus?.focus({ preventScroll: true }));
  dialog.addEventListener('click', event => { if (event.target.closest('a[href^="#"]')) dialog.close(); });
  const toggle = $('.mobile-toggle'), mobileNav = $('#mobile-nav');
  function closeMenu(restore = false) {
    mobileNav.hidden = true; toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '메뉴 열기'); if (restore) toggle.focus();
  }
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(expanded)); toggle.setAttribute('aria-label', expanded ? '메뉴 닫기' : '메뉴 열기');
    mobileNav.hidden = !expanded;
  });
  mobileNav.addEventListener('click', event => { if (event.target.closest('a,button')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileNav.hidden) closeMenu(true); });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  matchMedia('(min-width:768px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  const normalize = value => value.replace(/[\s!#]/g, '').toLowerCase();
  const query = $('#product-query');
  function selectKeyword(term) {
    query.value = term;
    $$('.keyword').forEach(button => button.setAttribute('aria-pressed', String(normalize(clean(button)) === normalize(term))));
  }
  const keywordButtons = $$('.keyword');
  let keywordCycleIndex = 1;
  function cycleKeywords() {
    keywordButtons.forEach((button, index) => button.classList.toggle('is-cycle-active', index === keywordCycleIndex));
    keywordCycleIndex = (keywordCycleIndex + 1) % keywordButtons.length;
  }
  if (!motionPreference.matches && keywordButtons.length) {
    document.body.classList.add('keyword-cycling');
    cycleKeywords();
    setInterval(cycleKeywords, 1400);
  }
  query.addEventListener('input', () => selectKeyword(query.value));
  $('.product-search').addEventListener('submit', event => { event.preventDefault(); selectKeyword(query.value.trim()); });
  const categoryCarousel = $('.category-carousel');
  const categoryItems = $$('.category-item');
  const categoryNames = ['닥터유', '오리온', '마켓오네이처'];
  let categoryIndex = 1;
  function selectCategory(index) {
    categoryIndex = (index + categoryItems.length) % categoryItems.length;
    categoryItems.forEach((item, itemIndex) => {
      const relative = (itemIndex - categoryIndex + categoryItems.length) % categoryItems.length;
      const next = relative === 0 ? 'center' : relative === 1 ? 'right' : 'left';
      const previous = item.dataset.position;
      if ((previous === 'left' && next === 'right') || (previous === 'right' && next === 'left')) {
        item.style.transition = 'none';
        item.dataset.position = next;
        void item.offsetWidth;
        requestAnimationFrame(() => { item.style.transition = ''; });
      } else item.dataset.position = next;
      item.setAttribute('aria-pressed', String(relative === 0));
    });
    $('#category-status').textContent = `${categoryNames[categoryIndex]} 선택됨`;
  }
  categoryCarousel.addEventListener('click', event => {
    const item = event.target.closest('[data-category-index]');
    if (item) selectCategory(Number(item.dataset.categoryIndex));
  });
  categoryCarousel.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); selectCategory(categoryIndex + (event.key === 'ArrowRight' ? 1 : -1));
  });
  function enableSwipe(surface, onSwipe, onDrag) {
    let gesture = null, ignoreClickUntil = 0;
    surface.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('.category-controls,.featured-controls,.featured-pagination,.featured-tab,input,select')) return;
      gesture = { x: event.clientX, y: event.clientY, id: event.pointerId, dragging: false };
    });
    document.addEventListener('pointermove', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      if (!gesture.dragging && Math.abs(dy) > Math.abs(dx) + 12) { gesture = null; return; }
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        if (!gesture.dragging) { gesture.dragging = true; surface.setPointerCapture(event.pointerId); }
        surface.classList.add('is-dragging');
        if (event.cancelable) event.preventDefault();
        if (onDrag) onDrag(dx);
      }
    }, { passive: false });
    const finish = event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x, dragged = gesture.dragging;
      gesture = null; surface.classList.remove('is-dragging');
      if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId);
      if (dragged) {
        ignoreClickUntil = performance.now() + 350;
        if (onSwipe && Math.abs(dx) > 45) onSwipe(dx < 0 ? 1 : -1);
      }
    };
    document.addEventListener('pointerup', finish);
    surface.addEventListener('pointercancel', () => { gesture = null; surface.classList.remove('is-dragging'); });
    surface.addEventListener('click', event => {
      if (performance.now() < ignoreClickUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, true);
    surface.addEventListener('dragstart', event => event.preventDefault());
  }
  enableSwipe(categoryCarousel, direction => selectCategory(categoryIndex + direction));

  const featured = $('.featured-section');
  const originalJelly = $('.scene-jelly', featured);
  for (let i = 1; i < 5; i++) {
    const scene = originalJelly.cloneNode(true);
    scene.dataset.slide = String(i);
    scene.dataset.productType = 'best';
    featured.insertBefore(scene, $('.product-tabs', featured));
  }
  const featuredScenes = $$('.featured-scene', featured);
  const pagination = $('.featured-pagination');
  let featuredIndex = 0;
  let featuredInitialized = false;
  let featuredTransitionTimer;
  let queuedFeaturedIndex = null;
  function selectFeatured(index) {
    if (featured.classList.contains('is-transitioning')) {
      queuedFeaturedIndex = index;
      return;
    }
    const previousIndex = featuredIndex;
    featuredIndex = (index + featuredScenes.length) % featuredScenes.length;
    const direction = index > previousIndex ? 'next' : 'prev';
    clearTimeout(featuredTransitionTimer);
    featured.classList.remove('is-transitioning');
    featuredScenes.forEach((scene, i) => {
      let offset = (i - featuredIndex + featuredScenes.length) % featuredScenes.length;
      if (offset > featuredScenes.length / 2) offset -= featuredScenes.length;
      scene.style.transition = 'none';
      scene.style.transform = '';
      scene.dataset.offset = offset;
      scene.style.zIndex = i === featuredIndex ? '2' : '1';
      scene.classList.remove('scene-enter-next', 'scene-enter-prev', 'scene-exit-next', 'scene-exit-prev');
      scene.setAttribute('aria-hidden', String(i !== featuredIndex));
      scene.inert = i !== featuredIndex;
    });
    if (featuredInitialized && featuredIndex !== previousIndex && !motionPreference.matches) {
      const scene = featuredScenes[featuredIndex];
      const outgoing = featuredScenes[previousIndex];
      featured.classList.add('is-transitioning');
      void scene.offsetWidth;
      scene.classList.add(`scene-enter-${direction}`);
      outgoing.classList.add(`scene-exit-${direction}`);
      featuredTransitionTimer = setTimeout(() => {
        outgoing.classList.remove('scene-exit-next', 'scene-exit-prev');
        featured.classList.remove('is-transitioning');
        if (queuedFeaturedIndex !== null) {
          const nextIndex = queuedFeaturedIndex;
          queuedFeaturedIndex = null;
          if ((nextIndex + featuredScenes.length) % featuredScenes.length !== featuredIndex) selectFeatured(nextIndex);
        }
      }, 1050);
    }
    featuredInitialized = true;
    $$('.featured-dot', featured).forEach((dot, i) => dot.setAttribute('aria-current', String(i === featuredIndex)));
    const activeScene = featuredScenes[featuredIndex];
    const kind = activeScene.className.match(/\bscene-(\w+)/)?.[1] || 'jelly';
    featured.dataset.activeProduct = kind;
    featured.dataset.headerTone = kind === 'songi' ? 'red' : 'light';
    $$('.featured-tab', featured).forEach(tab => tab.setAttribute('aria-pressed', String(clean(tab).toLowerCase() === activeScene.dataset.productType)));
    $('#featured-status').textContent = activeScene.dataset.productName;
    requestAnimationFrame(updateScrollEffects);
  }
  if (pagination) {
    pagination.removeAttribute('aria-hidden'); pagination.setAttribute('aria-label', '제품 배너 선택');
    pagination.replaceChildren();
    featuredScenes.forEach((scene, index) => {
      const dot = document.createElement('button'); dot.type = 'button'; dot.className = 'featured-dot';
      dot.setAttribute('aria-label', `${index + 1}번째 제품 배너`); dot.setAttribute('aria-current', String(index === 0));
      dot.append(document.createElement('span')); dot.addEventListener('click', () => selectFeatured(index)); pagination.append(dot);
    });
  }
  // Pagination stays above all sliding scenes.
  if (pagination) featured.append(pagination);
  selectFeatured(1);
  enableSwipe(featured, direction => selectFeatured(featuredIndex + direction));
  featured.addEventListener('click', event => {
    if (event.target.closest('.featured-pagination,.featured-tab,.featured-controls')) return;
    const bounds = featured.getBoundingClientRect();
    selectFeatured(featuredIndex + (event.clientX < bounds.left + bounds.width / 2 ? -1 : 1));
  });
  featured.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); selectFeatured(featuredIndex + (event.key === 'ArrowRight' ? 1 : -1));
  });

  const familyButton = $('[data-action=family]'), familyPopover = $('#family-popover');
  const familyControl = $('.family-control');
  let familyOpenedByHover = false;
  function openFamily() {
    familyPopover.hidden = false; familyButton.setAttribute('aria-expanded', 'true');
  }
  function closeFamily(restore = false) {
    familyOpenedByHover = false;
    familyPopover.hidden = true; familyButton.setAttribute('aria-expanded', 'false');
    if (restore) familyButton.focus({ preventScroll: true });
  }
  document.addEventListener('click', event => { if (!event.target.closest('.family-control')) closeFamily(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !familyPopover.hidden) closeFamily(true); });
  familyControl.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' && familyPopover.hidden) { familyOpenedByHover = true; openFamily(); }
  });
  familyControl.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse') return;
    closeFamily();
  });

  const header = $('.site-header');
  const backTop = $('.back-top');
  document.body.append(backTop);
  const quoteScroll = $('.brand-esg-scroll');
  let scrollEffectsFrame = 0;
  function updateScrollEffects() {
    scrollEffectsFrame = 0;
    const sampleY = Math.min(header.offsetHeight / 2, innerHeight - 1);
    const beneath = document.elementsFromPoint(innerWidth / 2, sampleY).filter(node => !header.contains(node));
    const layer = beneath.map(node => node.closest('[data-header-tone]')).find(Boolean);
    header.dataset.theme = layer?.dataset.headerTone || 'red';
    header.dataset.cover = String($('#search').getBoundingClientRect().top >= header.offsetHeight);
    const showBackTop = $('.hero-wrap').getBoundingClientRect().bottom <= header.offsetHeight;
    backTop.classList.toggle('is-visible', showBackTop);
    backTop.inert = !showBackTop;
    const footerTop = $('.site-footer').getBoundingClientRect().top;
    const bottomGap = Math.max(20, Math.min(innerWidth * .03, 56));
    backTop.style.setProperty('bottom', `${Math.max(bottomGap, innerHeight - footerTop + 20)}px`, 'important');
    const ciBounds = $('#ci').getBoundingClientRect();
    if (ciBounds.top <= header.offsetHeight && ciBounds.bottom > sampleY) header.dataset.theme = 'red';
  }
  const scheduleScrollEffects = () => { if (!scrollEffectsFrame) scrollEffectsFrame = requestAnimationFrame(updateScrollEffects); };
  window.addEventListener('scroll', scheduleScrollEffects, { passive: true });
  window.addEventListener('resize', scheduleScrollEffects, { passive: true });
  motionPreference.addEventListener('change', scheduleScrollEffects);
  let headerDirectionAnchor = window.scrollY;
  window.addEventListener('scroll', () => {
    const current = Math.max(0, window.scrollY);
    const change = current - headerDirectionAnchor;
    if (current <= 8 || change < -6) {
      header.classList.remove('is-scroll-hidden');
      headerDirectionAnchor = current;
    } else if (change > 6) {
      if (!header.contains(document.activeElement) || !document.activeElement.matches(':focus-visible')) {
        header.classList.add('is-scroll-hidden');
        if (!mobileNav.hidden) closeMenu();
      }
      headerDirectionAnchor = current;
    }
  }, { passive: true });
  header.addEventListener('focusin', () => header.classList.remove('is-scroll-hidden'));
  scheduleScrollEffects();
  if ('IntersectionObserver' in window) {
    document.body.classList.add('motion-ready');
    const categoryMore = $('.category-section > .more-button');
    categoryMore?.classList.add('category-more-reveal');
    categoryMore?.addEventListener('focus', () => categoryMore.classList.add('is-revealed'));
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        if (entry.target.matches('.category-heading')) categoryMore?.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: .05, rootMargin: '0px 0px -45% 0px' });
    $$('.category-heading,.esg-heading,.news-heading,.social-heading,.social-more').forEach((node, index) => {
      node.classList.add('reveal'); node.style.setProperty('--reveal-delay', `${index % 4 * 65}ms`);
      revealObserver.observe(node);
    });
    // Reveal each section's label and title together, followed by its description.
    [
      ['.category-heading', '[data-node-id="1:19420"]', '[data-node-id="1:19424"]'],
      ['.esg-heading', '[data-node-id="1:19574"]', '[data-node-id="1:19577"]'],
      ['.social-heading', '[data-node-id="1:19745"]', null]
    ].forEach(([parentSelector, titleSelector, descriptionSelector]) => {
      const parent = $(parentSelector);
      if (!parent) return;
      const title = $(titleSelector, parent);
      const description = descriptionSelector && $(descriptionSelector, parent);
      if (title) title.classList.add('heading-reveal-title');
      if (description) description.classList.add('heading-reveal-description');
    });
    if (!motionPreference.matches) {
      const aboutObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.remove('about-reveal-pending');
        else if (entry.boundingClientRect.top >= (entry.rootBounds?.bottom ?? innerHeight)) entry.target.classList.add('about-reveal-pending');
      }), { threshold: .08, rootMargin: '0px 0px -30% 0px' });
      $$('.about-heading,.story-row').forEach(node => {
        node.classList.add('about-reveal', 'about-reveal-pending');
        node.addEventListener('focusin', () => node.classList.remove('about-reveal-pending'));
        aboutObserver.observe(node);
      });
      motionPreference.addEventListener('change', event => {
        if (event.matches) {
          aboutObserver.disconnect();
          $$('.about-reveal-pending').forEach(node => node.classList.remove('about-reveal-pending'));
        }
      });
    }
    const socialObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); socialObserver.unobserve(entry.target); }
    }), { threshold: .08, rootMargin: '0px 0px -10% 0px' });
    $$('.social-card').forEach(card => { card.classList.add('social-reveal'); socialObserver.observe(card); });
    const featureObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      featured.classList.toggle('is-visible', entry.isIntersecting);
      if (entry.isIntersecting) $$('img', featured).forEach(image => { image.loading = 'eager'; });
    }), { rootMargin: '0px' });
    featureObserver.observe(featured);
  }

  const newsTrack = $('.news-track');
  const sourceNewsCards = $$('.news-card', newsTrack);
  for (let copy = 0; copy < 2; copy++) sourceNewsCards.forEach(card => {
    const clone = card.cloneNode(true); clone.dataset.clone = 'true'; clone.setAttribute('aria-hidden', 'true'); clone.tabIndex = -1;
    newsTrack.append(clone);
  });
  if ('IntersectionObserver' in window) {
    const pressObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); pressObserver.unobserve(entry.target); }
    }), { threshold: .08, rootMargin: '0px 0px -8% 0px' });
    $$('.news-card', newsTrack).forEach(card => { card.classList.add('press-reveal'); pressObserver.observe(card); });
  }
  let newsCycle = 1, newsPausedUntil = 0, newsVisible = false, newsLastTime = 0, dragStartScroll = 0;
  function measureNews() {
    newsCycle = sourceNewsCards.reduce((total, card) => total + card.getBoundingClientRect().width, 0) + parseFloat(getComputedStyle(newsTrack).gap) * sourceNewsCards.length;
  }
  measureNews(); window.addEventListener('resize', measureNews, { passive: true });
  document.fonts.ready.then(measureNews);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { newsVisible = entries[0].isIntersecting; }).observe(newsTrack);
  newsTrack.addEventListener('pointerdown', () => { dragStartScroll = newsTrack.scrollLeft; newsPausedUntil = performance.now() + 1500; });
  enableSwipe(newsTrack, null, dx => { newsTrack.scrollLeft = ((dragStartScroll - dx) % newsCycle + newsCycle) % newsCycle; newsPausedUntil = performance.now() + 1500; });
  newsTrack.addEventListener('wheel', () => { newsPausedUntil = performance.now() + 1500; }, { passive: true });
  newsTrack.addEventListener('touchstart', () => { newsPausedUntil = performance.now() + 2500; }, { passive: true });
  function animateNews(time) {
    const elapsed = Math.min(50, time - newsLastTime || 16); newsLastTime = time;
    if (newsVisible && !motionPreference.matches && !document.hidden && time > newsPausedUntil && !newsTrack.matches(':hover,:focus-within,.is-dragging')) {
      newsTrack.scrollLeft += elapsed * .035;
      if (newsTrack.scrollLeft >= newsCycle) newsTrack.scrollLeft -= newsCycle;
    }
    requestAnimationFrame(animateNews);
  }
  requestAnimationFrame(animateNews);
  function moveNews(direction) {
    const first = $('.news-card');
    const distance = first.getBoundingClientRect().width + parseFloat(getComputedStyle(newsTrack).gap);
    newsPausedUntil = performance.now() + 1200;
    const edge = newsCycle;
    let target = newsTrack.scrollLeft + direction * distance;
    if (direction > 0 && newsTrack.scrollLeft >= edge - 1) target = 0;
    else if (direction < 0 && newsTrack.scrollLeft <= 1) target = edge;
    else target = Math.max(0, Math.min(edge, target));
    newsTrack.scrollTo({ left: Math.max(0, target), behavior: motionPreference.matches ? 'instant' : 'smooth' });
  }
  document.addEventListener('click', event => {
    const control = event.target.closest('[data-action]'); if (!control) return;
    const action = control.dataset.action;
    if (action === 'category-prev') selectCategory(categoryIndex - 1);
    else if (action === 'category-next') selectCategory(categoryIndex + 1);
    else if (action === 'featured-prev') selectFeatured(featuredIndex - 1);
    else if (action === 'featured-next') selectFeatured(featuredIndex + 1);
    else if (action === 'social-more') { control.classList.toggle('is-active'); control.setAttribute('aria-pressed', String(control.classList.contains('is-active'))); }
    else if (action === 'focus-search') { $('#search').scrollIntoView(); query.focus({ preventScroll: true }); }
    else if (action === 'language') openDetail('Language', '한국어 · English', { links: [['한국어', '#top'], ['English — Orion official website', 'https://www.orionworld.com/en/']] });
    else if (action === 'keyword') selectKeyword(clean(control).replace(/^#\s*/, ''));
    else if (action === 'categories') openDetail('당신 취향에 맞는 오리온', '제과부터 시리얼, 음료까지 언제 어디서나 즐거운 순간을 만드세요.', { links: [['오리온', '#category'], ['닥터유', '#category'], ['마켓오네이처', '#category']] });
    else if (action === 'category') { selectKeyword(control.dataset.category); $('#search').scrollIntoView(); }
    else if (action === 'story') {
      const story = control.closest('.story-row');
      openDetail(clean($('h3', story)), $$('.story-description p', story).map(clean).join('\n'), { image: $('img', story).getAttribute('src') });
    } else if (action === 'featured') {
      // NEW and BEST are product labels; pagination controls the slides.
    } else if (action === 'news-prev') moveNews(-1);
    else if (action === 'news-next') moveNews(1);
    else if (action === 'news-all') { moveNews(1); newsTrack.scrollIntoView({ block: 'center' }); }
    else if (action === 'news') {
      const paragraphs = $$('p', control).map(clean);
      openDetail(paragraphs.slice(1, -1).join(' '), paragraphs.at(-1), { image: $('img', control)?.getAttribute('src'), note: '원본 디자인에 수록된 소식입니다. 기사 전문은 연결되어 있지 않습니다.' });
    } else if (action === 'social') openDetail('오리온, 당신과 연결됩니다', clean(control), { image: $('img', control).getAttribute('src') });
    else if (action === 'family') {
      if (event.detail > 0 && familyOpenedByHover) { familyOpenedByHover = false; openFamily(); }
      else if (familyPopover.hidden) openFamily();
      else closeFamily();
    }
    else if (action === 'contact') openDetail('고객문의', '고객센터 080. 023. 8700 (수신자 부담)\n대표전화 02. 710. 6000', { note: '이 페이지는 포트폴리오 시연용입니다. 문의 접수는 제공하지 않습니다.' });
    else if (action === 'location') openDetail('오시는 길', '(주)오리온\n서울특별시 용산구 백범로 90다길 13');
    else if (action === 'proposal') openDetail('신규거래 제안', '대표전화 02. 710. 6000', { note: '이 페이지는 포트폴리오 시연용입니다. 제안서를 수집하거나 전송하지 않습니다.' });
    else if (action === 'privacy') openDetail('개인정보처리방침', '이준화의 디자인 포트폴리오를 위한 시연용 웹사이트입니다.\n검색어는 현재 페이지에서만 처리하며 서버로 전송하거나 저장하지 않습니다.\n회원가입 및 개인정보 수집 기능은 제공하지 않습니다.');
    else if (action === 'legal') openDetail('법적고지', '이 웹사이트는 이준화의 포트폴리오를 위한 오리온 디자인 구현입니다.\n오리온의 공식 웹사이트가 아니며, 브랜드와 제품의 권리는 각 권리자에게 있습니다.');
  });

  // Reused from the portfolio's KMCS page: wheel easing leaves native touch,
  // keyboard navigation and nested scroll containers in control.
  let wheelFrame = 0, wheelTarget = window.scrollY, wheelPosition = window.scrollY, wheelTime = 0;
  let coverWheelCount = 0, coverMovingUntil = 0, coverSearchStage = false;
  const cancelWheel = () => { cancelAnimationFrame(wheelFrame); wheelFrame = 0; wheelTarget = wheelPosition = window.scrollY; };
  let sectionMovingUntil = 0;
  const ciSection = $('#ci');
  const ciMore = $('.ci-more', ciSection);
  function setCiAwaiting(awaiting) {
    ciSection.classList.toggle('ci-awaiting', awaiting);
    ciMore.inert = awaiting;
  }
  const ciWheelMode = matchMedia('(min-width:1200px) and (min-height:760px) and (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
  function configureCiWheel() {
    document.body.classList.toggle('ci-scroll-enabled', ciWheelMode.matches);
    if (!ciWheelMode.matches) setCiAwaiting(false);
    else if (ciSection.getBoundingClientRect().top > innerHeight * .5) setCiAwaiting(true);
  }
  configureCiWheel();
  ciWheelMode.addEventListener('change', configureCiWheel);
  if ('IntersectionObserver' in window && !motionPreference.matches) {
    const ciHeading = $('.ci-heading', ciSection);
    ciHeading.classList.add('ci-heading-pending');
    const headingObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) ciHeading.classList.remove('ci-heading-pending');
      else if (entry.boundingClientRect.top >= (entry.rootBounds?.bottom ?? innerHeight)) ciHeading.classList.add('ci-heading-pending');
    }), { threshold: .1, rootMargin: '0px 0px -20% 0px' });
    headingObserver.observe(ciHeading);
  }
  function stepSectionNavigation(event) {
    if (innerWidth < 768) return false;
    const ciNearViewport = ciSection.getBoundingClientRect().top < innerHeight * .25 && ciSection.getBoundingClientRect().bottom > innerHeight / 2;
    if (Math.abs(event.deltaY) < 40 && !(ciWheelMode.matches && ciNearViewport)) return false;
    if (performance.now() < sectionMovingUntil) { cancelWheel(); event.preventDefault(); return true; }
    const ci = $('#ci'), esg = $('#esg'), news = $('#news');
    const ciBox = ci.getBoundingClientRect(), esgBox = esg.getBoundingClientRect();
    const productBox = featured.getBoundingClientRect(), newsBox = news.getBoundingClientRect();
    const middle = innerHeight / 2;
    let destination = null;
    if (event.deltaY > 0 && ciBox.top > 20 && ciBox.top < innerHeight * .25) {
      if (ciWheelMode.matches) setCiAwaiting(true);
      destination = ciBox.top + scrollY;
    } else if (event.deltaY > 0 && ciBox.top <= 20 && ciBox.bottom > middle) {
      if (ciWheelMode.matches && ci.classList.contains('ci-awaiting')) {
        cancelWheel(); event.preventDefault();
        setCiAwaiting(false);
        sectionMovingUntil = performance.now() + 850;
        if (Math.abs(ciBox.top) > 2) window.scrollTo({ top: ciBox.top + scrollY, behavior: 'smooth' });
        return true;
      }
      destination = esgBox.top + scrollY;
    }
    else if (event.deltaY > 0 && esgBox.top <= middle && esgBox.bottom > middle) destination = productBox.top + scrollY;
    else if (event.deltaY > 0 && productBox.top <= middle && productBox.bottom > middle) destination = newsBox.top + scrollY;
    else if (event.deltaY < 0 && ciWheelMode.matches && ciBox.top <= 20 && ciBox.bottom > middle && !ci.classList.contains('ci-awaiting')) {
      cancelWheel(); event.preventDefault();
      setCiAwaiting(true);
      sectionMovingUntil = performance.now() + 850;
      if (Math.abs(ciBox.top) > 2) window.scrollTo({ top: ciBox.top + scrollY, behavior: 'smooth' });
      return true;
    }
    else if (event.deltaY < 0 && newsBox.top >= -40 && newsBox.top <= header.offsetHeight + 120) destination = productBox.top + scrollY;
    else if (event.deltaY < 0 && productBox.top <= middle && productBox.bottom > middle) destination = esgBox.top + scrollY;
    else if (event.deltaY < 0 && esgBox.top <= middle && esgBox.bottom > middle) { setCiAwaiting(false); destination = ciBox.top + scrollY; }
    if (destination === null) return false;
    cancelWheel(); event.preventDefault(); sectionMovingUntil = performance.now() + 1200;
    window.scrollTo({ top: destination, behavior: 'smooth' });
    return true;
  }
  $('.site-brand').addEventListener('click', () => {
    cancelWheel(); coverSearchStage = false; coverWheelCount = 0; closeMenu();
    window.scrollTo({ top: 0, behavior: motionPreference.matches ? 'instant' : 'smooth' });
  });
  function smoothWheelFrame(time) {
    const elapsed = Math.min(40, time - wheelTime || 16); wheelTime = time;
    wheelTarget = Math.max(0, Math.min(wheelTarget, document.documentElement.scrollHeight - innerHeight));
    const distance = wheelTarget - wheelPosition;
    if (Math.abs(distance) < .8) { window.scrollTo({ top: wheelTarget, behavior: 'instant' }); wheelFrame = 0; return; }
    wheelPosition += distance * (1 - Math.exp(-elapsed / 95));
    window.scrollTo({ top: wheelPosition, behavior: 'instant' }); wheelFrame = requestAnimationFrame(smoothWheelFrame);
  }
  document.addEventListener('wheel', event => {
    if (event.defaultPrevented || event.ctrlKey || event.shiftKey || motionPreference.matches || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
    if (event.target.closest('dialog,input,textarea,select,[contenteditable=true],#mobile-nav,.family-popover')) return;
    for (let element = event.target; element && element !== document.body; element = element.parentElement) {
      if (/auto|scroll/.test(getComputedStyle(element).overflowY) && element.scrollHeight > element.clientHeight + 1 && ((event.deltaY < 0 && element.scrollTop > 0) || (event.deltaY > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 1))) return;
    }
    if (performance.now() < coverMovingUntil) { cancelWheel(); event.preventDefault(); return; }
    if (window.scrollY < 3 && event.deltaY > 0 && Math.abs(event.deltaY) >= 40 && $('#search').getBoundingClientRect().top > header.offsetHeight) {
      cancelWheel(); event.preventDefault();
      if (++coverWheelCount >= 2) {
        const search = $('#search');
        coverWheelCount = 0; coverSearchStage = true; coverMovingUntil = performance.now() + 1000;
        const visibleHeight = Math.min(search.offsetHeight, innerHeight * .315);
        const destination = search.getBoundingClientRect().top + scrollY - (innerHeight - visibleHeight);
        window.scrollTo({ top: Math.max(0, destination), behavior: 'smooth' });
      }
      return;
    }
    if (coverSearchStage && event.deltaY > 0 && Math.abs(event.deltaY) >= 40) {
      cancelWheel(); event.preventDefault();
      if (++coverWheelCount >= 2) {
        coverWheelCount = 0; coverSearchStage = false; coverMovingUntil = performance.now() + 1000;
        window.scrollTo({ top: $('#category').getBoundingClientRect().top + scrollY, behavior: 'smooth' });
      }
      return;
    }
    if (event.deltaY < 0) coverSearchStage = false;
    if (event.deltaY < 0 || window.scrollY > 3) coverWheelCount = 0;
    if (stepSectionNavigation(event)) return;
    const amount = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    if (!wheelFrame) { wheelTarget = wheelPosition = window.scrollY; wheelTime = performance.now(); }
    wheelTarget = Math.max(0, Math.min(wheelTarget + amount, document.documentElement.scrollHeight - innerHeight));
    event.preventDefault(); if (!wheelFrame) wheelFrame = requestAnimationFrame(smoothWheelFrame);
  }, { passive: false });
  document.addEventListener('pointerdown', cancelWheel, { passive: true });
  document.addEventListener('touchstart', () => { setCiAwaiting(false); coverSearchStage = false; cancelWheel(); }, { passive: true });
  document.addEventListener('keydown', () => { setCiAwaiting(false); coverSearchStage = false; cancelWheel(); });
  document.addEventListener('click', event => { if (event.target.closest('a[href^="#"]')) { setCiAwaiting(false); coverSearchStage = false; cancelWheel(); } });
  // The cover is sticky, so its anchor position is not the document origin.
  $('.back-top').addEventListener('click', event => {
    event.preventDefault();
    cancelWheel();
    window.scrollTo({ top: 0, behavior: motionPreference.matches ? 'instant' : 'smooth' });
  });
  motionPreference.addEventListener('change', cancelWheel);
})();
