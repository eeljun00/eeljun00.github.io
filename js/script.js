// 헤더 스크롤 감지
let lastScroll = 0;

const header = document.querySelector("header");
const headerSections = [...document.querySelectorAll("[data-header-theme]")];
let themeFrame = null;

function updateHeaderTheme() {
  // 숨김 애니메이션과 관계없이 헤더가 원래 놓이는 높이를 기준으로 판별
  const headerY = parseFloat(getComputedStyle(header).top) + header.offsetHeight / 2;
  const section = [...headerSections].reverse().find((element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.top <= headerY && bounds.bottom > headerY && bounds.left <= window.innerWidth / 2 && bounds.right > window.innerWidth / 2;
  });
  header.classList.toggle("header-on-light", section?.dataset.headerTheme === "light");
  header.classList.toggle("header-on-perspective", section?.id === "perspective");
  header.classList.toggle("on-contact", section?.classList.contains("page5"));
  document.body.classList.toggle("maker-on-light", section?.dataset.headerTheme === "light");
  document.body.classList.toggle("maker-on-perspective", section?.id === "perspective");
  themeFrame = null;
}

function scheduleHeaderTheme() {
  if (themeFrame === null) {
    themeFrame = requestAnimationFrame(updateHeaderTheme);
  }
}

window.addEventListener("resize", scheduleHeaderTheme);
window.addEventListener("pageshow", scheduleHeaderTheme);
updateHeaderTheme();

// 목록에서 미리보기로 마우스를 옮기는 동안에도 이미지를 유지
const projectSection = document.querySelector(".page4");
const projectRows = [...document.querySelectorAll(".project-row")];
const previewPositions = new WeakMap();

function textBounds(element) {
  const range = document.createRange();
  range.selectNodeContents(element);
  return range.getBoundingClientRect();
}

// Keep the accepted image layout independent of the restored one-line copy.
// This offscreen ruler measures the former column, never changes visible text.
let previewTextCache = new WeakMap();
const previewTextRuler = document.createElement("span");
previewTextRuler.setAttribute("aria-hidden", "true");
previewTextRuler.style.cssText = "position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none;display:block;text-align:right;white-space:normal;word-break:keep-all;contain:layout style;";
document.body.append(previewTextRuler);

function previewTextMetrics(description) {
  const style = getComputedStyle(description);
  const columnWidth = Math.min(440, Math.max(300, window.innerWidth * .30));
  const key = `${columnWidth}|${style.font}|${style.letterSpacing}|${description.textContent}`;
  const cached = previewTextCache.get(description);
  if (cached?.key === key) return cached;
  previewTextRuler.style.width = `${columnWidth}px`;
  previewTextRuler.style.font = style.font;
  previewTextRuler.style.letterSpacing = style.letterSpacing;
  previewTextRuler.textContent = description.textContent;
  const box = previewTextRuler.getBoundingClientRect();
  const glyphs = textBounds(previewTextRuler);
  const metrics = { key, width: glyphs.width, height: box.height, glyphTop: glyphs.top - box.top, glyphHeight: glyphs.height };
  previewTextCache.set(description, metrics);
  return metrics;
}

function positionProjectPreview(row, randomize = false) {
  if (window.innerWidth <= 1100) return;
  if (randomize || !previewPositions.has(row)) {
    previewPositions.set(row, { bias: Math.random(), y: Math.round(Math.random() * 8) });
  }
  const { bias, y } = previewPositions.get(row);
  const bounds = row.getBoundingClientRect();
  const preferredWidth = Math.min(680, Math.max(480, window.innerWidth * 0.42), bounds.width - 48);
  const preferredLeftEdge = Math.max(24, bounds.left + 24);
  const minimumPreviewWidth = Math.min(preferredWidth, 380);
  let leftEdge = preferredLeftEdge;

  // Reconstruct the previous column geometry so unwrapping cannot shift images.
  let referenceTop = projectRows[0].getBoundingClientRect().top;
  const referenceLayout = projectRows.map((otherRow) => {
    const metrics = previewTextMetrics(otherRow.querySelector(".project-details"));
    const link = getComputedStyle(otherRow.querySelector(".project-link"));
    const paddingTop = parseFloat(link.paddingTop);
    const paddingBottom = parseFloat(link.paddingBottom);
    const textTop = referenceTop + paddingTop + metrics.glyphTop;
    const result = {
      row: otherRow,
      top: referenceTop,
      description: { left: otherRow.getBoundingClientRect().right - metrics.width, top: textTop, bottom: textTop + metrics.glyphHeight },
    };
    referenceTop += Math.max(parseFloat(link.minHeight), paddingTop + paddingBottom + Math.max(metrics.height, otherRow.querySelector(".project-name").getBoundingClientRect().height));
    return result;
  });
  const reference = referenceLayout.find((item) => item.row === row);
  const above = row.matches(".box2, .box3, .box4");
  const verticalDrop = row.matches(".box2") ? 36 : 0;
  let rightEdge = reference.description.left - 24;
  let width = preferredWidth;
  for (let pass = 0; pass < 2; pass += 1) {
    const top = above ? reference.top - 18 - y - width * 9 / 16 - 16 + verticalDrop : reference.top + 40 + y - 16;
    const bottom = top + width * 9 / 16 + 36;
    referenceLayout.forEach(({ description }) => {
      if (description.top < bottom && description.bottom > top) rightEdge = Math.min(rightEdge, description.left - 24);
    });
    leftEdge = Math.max(24, Math.min(preferredLeftEdge, rightEdge - minimumPreviewWidth - 32));
    width = Math.min(preferredWidth, Math.max(1, rightEdge - leftEdge - 32));
  }
  const available = Math.max(0, rightEdge - leftEdge - width);
  const left = leftEdge + available * (0.80 + bias * 0.18);
  row.style.setProperty("--preview-left", `${left + width / 2 - bounds.left}px`);
  row.style.setProperty("--preview-safe-width", `${width}px`);
  row.style.setProperty("--preview-y", `${y}px`);
}

function setActiveProject(activeRow) {
  if (activeRow && Math.abs(projectSection.getBoundingClientRect().left) > 2) return;
  const changed = activeRow && !activeRow.classList.contains("is-active");
  projectRows.forEach((row) => row.classList.toggle("is-active", row === activeRow));
  if (activeRow) positionProjectPreview(activeRow, changed);
}

projectRows.forEach((row) => {
  row.addEventListener("pointerenter", () => setActiveProject(row));
  row.addEventListener("pointermove", () => { if (!row.classList.contains("is-active")) setActiveProject(row); });
  row.addEventListener("focusin", () => setActiveProject(row));
});
projectSection.addEventListener("pointerleave", () => setActiveProject(null));
projectSection.addEventListener("focusout", (event) => {
  if (!projectSection.contains(event.relatedTarget)) {
    setActiveProject(null);
  }
});

window.addEventListener("scroll", function () {
  const currentScroll = window.scrollY;
  scheduleHeaderTheme();

  // 1. 맨 위 → 무조건 보이기
  if (currentScroll === 0) {
    header.classList.remove("hide");
  }

  // 2. 아래로 스크롤 → 숨김
  else if (currentScroll > lastScroll) {
    header.classList.add("hide");
  }

  // 3. 위로 스크롤 → 보이기
  else {
    header.classList.remove("hide");
  }

  lastScroll = currentScroll;
}, { passive: true });

const hero = document.querySelector(".page1");
const coverTransition = document.querySelector(".cover-transition");
const footer = document.querySelector(".page5");
const contactLinks = [...footer.querySelectorAll(".icon-group a")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const motionAllowed = () => !reducedMotion.matches && finePointer.matches;
const story = document.querySelector(".horizontal-story");
const storyStage = story.querySelector(".story-stage");
const storyTrack = story.querySelector(".story-track");
const storyPanels = [...story.querySelectorAll(".story-panel")];
const perspectiveSection = document.querySelector("#perspective");
let storyStops = [];
let storyTotal = 0;
let storyWidth = 0;
let currentStoryIndex = -1;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
let coverRunway=0;

// Direction stays above Perspective. Only the lower green section enters from
// the right; the assembled introduction, About and Project then push to the left.
function measureStory() {
  measureCover();
  document.body.classList.toggle("horizontal-enabled", !reducedMotion.matches);
  storyWidth = storyStage.getBoundingClientRect().width;
  const height = storyStage.clientHeight;
  const readingHold = height * .28;
  const crossing = Math.max(height * .95, storyWidth * .55);
  let cursor = 0;
  storyStops = storyPanels.map((panel, index) => {
    const body = panel.querySelector(".panel-body");
    const extra = Math.max(0, body.scrollHeight - height);
    const entrance = index === 0 ? Math.max(height * .65, storyWidth * .4) : 0;
    const stop = { start:cursor, extra, entrance, hold:readingHold, end:cursor + extra + readingHold + entrance, crossing:index < storyPanels.length - 1 ? crossing : 0 };
    cursor = stop.end + stop.crossing;
    return stop;
  });
  storyTotal = cursor;
  story.style.height = reducedMotion.matches ? "" : `${height + storyTotal}px`;
  updateStory();
}

function updateStory() {
  if (reducedMotion.matches) {
    storyTrack.style.removeProperty("--story-x");
    perspectiveSection.style.removeProperty("--perspective-x");
    storyPanels.forEach(panel => { panel.removeAttribute("inert"); panel.style.removeProperty("--panel-y"); panel.style.removeProperty("--panel-x"); panel.classList.remove("is-in-scene"); panel.classList.add("is-current"); });
    return;
  }
  const time = clamp(-story.getBoundingClientRect().top, 0, storyTotal);
  let position = 0;
  storyStops.forEach((stop, index) => {
    if (time >= stop.start) position = index;
    if (stop.crossing && time > stop.end && time < stop.end + stop.crossing) {
      const p = (time - stop.end) / stop.crossing;
      position = index + p * p * (3 - 2 * p);
    }
    let lift = clamp(time - stop.start - stop.hold / 2, 0, stop.extra);
    if (index === 0) {
      const preLift = Math.min(stop.extra, storyStage.clientHeight * .08);
      lift = clamp((time-stop.start)/stop.hold,0,1)*preLift + clamp(time-stop.start-stop.hold-stop.entrance,0,stop.extra-preLift);
      const p = clamp((time-stop.start-stop.hold)/stop.entrance,0,1);
      const progress = p*p*(3-2*p);
      perspectiveSection.style.setProperty("--perspective-x",`${(1-progress)*storyWidth}px`);
      story.dataset.perspective = progress.toFixed(4);
    }
    storyPanels[index].style.setProperty("--panel-y", `${-lift}px`);
  });
  // All full-page crossings now push right to left. Perspective has its own
  // entrance inside the lower half of the introduction, above.
  storyPanels.forEach((panel, i) => {
    const x = (i-position)*storyWidth;
    const inScene = i === Math.floor(position) || i === Math.ceil(position);
    panel.style.setProperty("--panel-x", `${x}px`);
    panel.classList.toggle("is-in-scene", inScene);
    panel.style.zIndex = i + 1;
  });
  story.dataset.position = position.toFixed(4);
  const index = Math.round(position);
  if (index !== currentStoryIndex) {
    currentStoryIndex = index;
    storyPanels.forEach((panel, i) => {
      panel.classList.toggle("is-current", i === index);
      panel.toggleAttribute("inert", i !== index);
    });
    if (index !== storyPanels.indexOf(projectSection)) setActiveProject(null);
  }
}

function goToStoryPanel(index) {
  const stop = storyStops[clamp(index, 0, storyPanels.length - 1)];
  const target = index >= storyPanels.length
    ? window.scrollY + footer.getBoundingClientRect().top
    : window.scrollY + story.getBoundingClientRect().top + stop.start;
  if (smoothScroll) smoothScroll.scrollTo(target);
  else window.scrollTo({top:target, behavior:reducedMotion.matches ? "instant" : "smooth"});
}

// Trackpads can use horizontal gestures as well as ordinary vertical wheels.
story.addEventListener("wheel", event => {
  if (reducedMotion.matches || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const target = window.scrollY + event.deltaX;
  if (smoothScroll) smoothScroll.scrollTo(target, {duration:.45});
  else window.scrollBy({top:event.deltaX, behavior:"instant"});
}, {passive:false});
document.addEventListener("keydown", event => {
  if (/INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
  // Keep native keyboard jumps synchronized with Lenis after viewport changes.
  if (smoothScroll && ["Home", "End", "PageDown", "PageUp"].includes(event.key)) {
    event.preventDefault();
    const target = event.key === "Home" ? 0 : event.key === "End" ? document.documentElement.scrollHeight - window.innerHeight : window.scrollY + window.innerHeight * .9 * (event.key === "PageDown" ? 1 : -1);
    smoothScroll.scrollTo(target, {immediate:event.key === "Home" || event.key === "End", duration:.65});
    return;
  }
  if (reducedMotion.matches || story.getBoundingClientRect().top > 1) return;
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    event.preventDefault();
    const atContact = footer.getBoundingClientRect().top < window.innerHeight * .55;
    goToStoryPanel(atContact && event.key === "ArrowLeft" ? storyPanels.length - 1 : currentStoryIndex + (event.key === "ArrowRight" ? 1 : -1));
  }
});
let swipe = null;
story.addEventListener("touchstart", event => { const p=event.touches[0]; swipe=p ? {x:p.clientX,y:p.clientY} : null; }, {passive:true});
story.addEventListener("touchmove", event => {
  if (!swipe || reducedMotion.matches) return;
  const p=event.touches[0];
  const dx=swipe.x-p.clientX, dy=swipe.y-p.clientY;
  if (Math.abs(dx)>Math.abs(dy) && Math.abs(dx)>4) {
    event.preventDefault();
    window.scrollBy({top:dx*2,behavior:"instant"});
    swipe={x:p.clientX,y:p.clientY};
  }
}, {passive:false});
story.addEventListener("touchend", ()=>{swipe=null;}, {passive:true});

const heroStage = hero.querySelector(".hero-stage");
const heroName=hero.querySelector(".name");
const makerCredit=document.querySelector(".maker-credit");
const footerCreditText=footer.querySelector(".footer-credit-text");
let makerOrigin=null;
function measureCover() {
  coverRunway=reducedMotion.matches ? 0 : Math.max(1400,heroStage.offsetHeight*2.1);
  document.body.style.setProperty("--cover-runway",`${coverRunway}px`);
}
function updateMakerCredit() {
  const active=window.scrollY>coverRunway+2;
  document.body.classList.toggle("maker-credit-active",active);
  if(!active){
    makerOrigin=null;
    makerCredit.classList.remove("is-travelling","is-over-contact");
    document.body.classList.remove("maker-to-footer","maker-credit-near-landing","maker-credit-landed");
    return;
  }
  if(!makerOrigin){
    const box=heroName.getBoundingClientRect();
    makerOrigin={x:box.left+box.width/2,y:box.top};
  }
  const mobile=window.innerWidth<=700;
  const scale=(mobile ? 16/18 : 18/22);
  const category=document.querySelector(".category");
  const targetX=mobile ? 24+makerCredit.offsetWidth*scale/2 : heroStage.clientWidth/2;
  const targetY=(mobile ? 26 : 36)+(category.offsetHeight-makerCredit.offsetHeight*scale)/2;
  const progress=reducedMotion.matches ? 1 : clamp((window.scrollY-coverRunway)/(heroStage.offsetHeight*.5),0,1);
  const eased=progress*progress*(3-2*progress);
  let x=makerOrigin.x+(targetX-makerOrigin.x)*eased;
  let y=makerOrigin.y+(targetY-makerOrigin.y)*eased;
  const currentScale=1+(scale-1)*eased;
  // Aim at the Contact byline's final viewport position so the credit travels
  // downward without overshooting, then hand over to the stationary text.
  const footerBox=footer.getBoundingClientRect();
  const startTop=window.innerHeight*.75;
  // Complete the handoff while the Contact page is already readable, rather
  // than requiring the wheel to reach the document's final pixel.
  const landingTop=Math.max(0,window.innerHeight-footer.offsetHeight)+Math.min(96,window.innerHeight*.1);
  let landing=clamp((startTop-footerBox.top)/Math.max(1,startTop-landingTop),0,1);
  if(reducedMotion.matches && landing>0) landing=1;
  const landingEase=landing*landing*(3-2*landing);
  document.body.classList.toggle("maker-to-footer",landing>0);
  document.body.classList.toggle("maker-credit-near-landing",landing>=.85);
  document.body.classList.toggle("maker-credit-landed",landing>=1);
  if(landing>0){
    const destination=footerCreditText.getBoundingClientRect();
    x=targetX+(destination.left+destination.width/2-targetX)*landingEase;
    const landingY=landingTop+destination.top-footerBox.top;
    y=targetY+(landingY-targetY)*landingEase;
  }
  makerCredit.classList.toggle("is-travelling",progress<1 || landing>0 && landing<1);
  const plateFade=clamp((landing-.25)/.75,0,1);
  const plateOpacity=landing>0 ? 1-plateFade*plateFade*(3-2*plateFade) : Math.min(1,Math.sin(progress*Math.PI)*2.5);
  makerCredit.style.setProperty("--maker-glass",`${plateOpacity}`);
  makerCredit.style.setProperty("--maker-x",`${x}px`);
  makerCredit.style.setProperty("--maker-y",`${y}px`);
  makerCredit.style.setProperty("--maker-scale",`${currentScale}`);
}
const portfolioInk=hero.querySelector(".portfolio-ink");
const inkPieces=[...portfolioInk.querySelectorAll(".ink-letter")];
const lastPaintStroke=inkPieces.at(-1).querySelector(".paint-stroke:last-child");
portfolioInk.addEventListener("animationend",event=>{
  if(event.animationName==="paint-write" && event.target===lastPaintStroke) portfolioInk.classList.add("is-complete");
});
if(getComputedStyle(lastPaintStroke).strokeDashoffset==="0") portfolioInk.classList.add("is-complete");
const heroSymbols = [...hero.querySelectorAll(".hero-symbol")];
// The brush title and credits retain their automatic entrances. Only paper
// icons use a paused timeline, preserving the wheel's stopped/reversed frame.
const coverDuration=5.5;
const coverAnimationNames=new Set(["symbol-arrive","paper-crumple","paper-open","paper-sheet","paper-panel-open","paper-icon-form","symbol-drift"]);
let coverAnimations=[];
document.body.classList.add("cover-scroll-ready");
function captureCoverAnimations() {
  coverAnimations=[...hero.getAnimations({subtree:true}),...header.getAnimations({subtree:true})]
    .filter(animation=>coverAnimationNames.has(animation.animationName));
  coverAnimations.forEach(animation=>animation.pause());
}
function updateCoverSequence() {
  const progress=reducedMotion.matches ? 1 : clamp(window.scrollY/Math.max(1,coverRunway),0,1);
  const time=progress*coverDuration;
  coverAnimations.forEach(animation=>{animation.currentTime=time*1000;});
  heroSymbols.forEach(symbol=>{
    const start=parseFloat(getComputedStyle(symbol).getPropertyValue("--symbol-delay"));
    symbol.classList.toggle("is-ready",reducedMotion.matches || time>=start+1.6);
  });
  document.body.classList.toggle("cover-intro-active",window.scrollY<=coverRunway+2);
  if(window.scrollY<=coverRunway+2) header.classList.remove("hide");
  hero.dataset.coverProgress=progress.toFixed(4);
}
captureCoverAnimations();
const coverCursor = document.querySelector(".cover-cursor");
let cursorPresent = false;
let cursorPointer = {x:0,y:0};
let cursorFlight = null;
const designSymbol = hero.querySelector(".design-symbol");
function captureCursorOrigin() {
  const image=designSymbol.querySelector("img");
  const box=image.getBoundingClientRect();
  // The source is a square PNG. Preserve its currently rendered angle and
  // size, including the gentle idle rotation, so the swap has no visible jump.
  let angle=-12;
  if (typeof DOMMatrixReadOnly === "function") {
    let matrix=new DOMMatrixReadOnly();
    [designSymbol,image.parentElement,image].forEach(element=>{
      const transform=getComputedStyle(element).transform;
      if(transform!=="none") matrix=matrix.multiply(new DOMMatrixReadOnly(transform));
    });
    angle=Math.atan2(matrix.b,matrix.a)*180/Math.PI;
  }
  const radians=angle*Math.PI/180;
  const size=box.width/(Math.abs(Math.cos(radians))+Math.abs(Math.sin(radians)));
  return {x:box.left+box.width/2,y:box.top+box.height/2,size,angle,opacity:designSymbol.classList.contains("is-ready") ? 1 : Number(getComputedStyle(designSymbol).opacity)};
}
function updateCoverCursor() {
  const exitScroll=Math.max(0,window.scrollY-coverRunway);
  const active = cursorPresent && motionAllowed() && exitScroll > 12;
  if(!active){
    document.body.classList.remove("cover-cursor-active","cursor-flight-active");
    cursorFlight=null;
    return;
  }
  const travel=clamp((exitScroll-12)/Math.max(1,(heroStage.offsetHeight-24)*.44-12),0,1);
  if(!cursorFlight && travel<1) cursorFlight=captureCursorOrigin();
  document.body.classList.add("cover-cursor-active","cursor-flight-active");
  const eased=travel*travel*(3-2*travel);
  const origin=cursorFlight || {x:cursorPointer.x+24,y:cursorPointer.y+24,size:48,angle:0,opacity:1};
  const size=origin.size+(48-origin.size)*eased;
  const arc=-Math.sin(Math.PI*travel)*Math.min(60,heroStage.offsetHeight*.06);
  const x=origin.x+(cursorPointer.x+24-origin.x)*eased-size/2;
  const y=origin.y+(cursorPointer.y+24-origin.y)*eased+arc-size/2;
  coverCursor.style.setProperty("--cursor-x",`${x}px`);
  coverCursor.style.setProperty("--cursor-y",`${y}px`);
  coverCursor.style.setProperty("--cursor-size",`${size}px`);
  coverCursor.style.setProperty("--cursor-angle",`${origin.angle*(1-eased)}deg`);
  coverCursor.style.setProperty("--cursor-opacity",`${Math.max(origin.opacity,clamp(travel/.18,0,1))}`);
  coverCursor.style.setProperty("--cursor-shadow",`${.2*eased}`);
}

document.addEventListener("pointermove", event => {
  if (event.pointerType === "touch") return;
  cursorPresent = true;
  cursorPointer={x:event.clientX,y:event.clientY};
  updateCoverCursor();
}, {passive:true});
document.addEventListener("pointerout", event => {
  if (!event.relatedTarget) { cursorPresent=false; updateCoverCursor(); }
}, {passive:true});
window.addEventListener("blur", () => { cursorPresent=false; updateCoverCursor(); });
heroSymbols.forEach(symbol => {
  symbol.addEventListener("pointermove", event => {
    if (!motionAllowed() || event.pointerType === "touch" || !symbol.classList.contains("is-ready")) return;
    const box=symbol.getBoundingClientRect();
    const x=clamp((event.clientX-box.left-box.width/2)*.15,-9,9);
    const y=clamp((event.clientY-box.top-box.height/2)*.15,-9,9);
    symbol.style.setProperty("--symbol-x", `${x}px`);
    symbol.style.setProperty("--symbol-y", `${y}px`);
    symbol.style.setProperty("--symbol-tilt", `${x*.3}deg`);
  });
  const reset=()=>{symbol.style.setProperty("--symbol-x","0px");symbol.style.setProperty("--symbol-y","0px");symbol.style.setProperty("--symbol-tilt","0deg");};
  symbol.addEventListener("pointerleave",reset);
  symbol.addEventListener("pointercancel",reset);
});
let sceneFrame = null;
let lastHeroProgress = -1;


function updateScene() {
  sceneFrame = null;
  updateCoverSequence();
  updateStory();
  updateSectionFades();
  updateCoverCursor();
  updateMakerCredit();
  const footerBox=footer.getBoundingClientRect();
  footer.classList.toggle("is-visible", footerBox.top < window.innerHeight && footerBox.bottom > 0);
  const bounds = hero.getBoundingClientRect();
  const progress = reducedMotion.matches ? 0 : clamp((window.scrollY-coverRunway)/Math.max(1,heroStage.offsetHeight-24),0,1);
  hero.classList.toggle("is-transitioning", progress > 0.01);
  hero.classList.toggle("is-covered", progress >= 1);
  hero.classList.toggle("is-offscreen", bounds.bottom <= 0 || bounds.top >= window.innerHeight);
  if (progress !== lastHeroProgress) {
    hero.style.setProperty("--hero-exit", progress.toFixed(4));
    lastHeroProgress = progress;
  }


}

function scheduleScene() {
  if (sceneFrame === null) sceneFrame = requestAnimationFrame(updateScene);
}

if (!reducedMotion.matches) footer.classList.add("motion-ready");
window.addEventListener("scroll", scheduleScene, { passive: true });
window.addEventListener("resize", () => {
  makerOrigin=null;
  cursorFlight=null;
  if (cursorPointer.x > window.innerWidth || cursorPointer.y > window.innerHeight) cursorPresent=false;
  lastHeroProgress = -1;
  measureStory();
  const activeRow = projectSection.querySelector(".is-active");
  if (activeRow) positionProjectPreview(activeRow);
  scheduleScene();
});
window.addEventListener("pageshow", () => { measureStory(); scheduleScene(); });
measureStory();
scheduleScene();
const storySizeObserver = new ResizeObserver(() => { measureStory(); scheduleScene(); });
storyPanels.forEach(panel => storySizeObserver.observe(panel.querySelector(".panel-body")));
// One visual language for selected copy: a small fade and rise, once.
// Small staggered rises share the same motion language throughout the copy.
if (!reducedMotion.matches) {
  document.querySelectorAll("#direction-label,#perspective-label,#about-label,#project-label").forEach(label=>{
    const text=label.textContent;
    label.setAttribute("aria-label",text);
    label.textContent="";
    [...text].forEach((char,index)=>{
      const span=document.createElement("span");
      span.className="copy-char";
      span.setAttribute("aria-hidden","true");
      span.style.setProperty("--char-index",index);
      span.textContent=char;
      label.append(span);
    });
  });
}
document.querySelectorAll(".editorial-copy").forEach(copy=>{
  [...copy.querySelectorAll(".reveal-item")].forEach((item,index)=>item.style.setProperty("--copy-delay",`${index*.1}s`));
});
// Stagger project copy without transforming rows or their preview layers.
projectRows.forEach((row,index)=>{
  row.querySelectorAll(".project-name,.project-details").forEach((copy,column)=>{
    copy.classList.add("reveal-item");
    copy.style.setProperty("--copy-delay",`${index*.07+column*.04}s`);
  });
});
const revealItems=[...document.querySelectorAll(".reveal-item")];
if (!reducedMotion.matches && "IntersectionObserver" in window) {
  revealItems.forEach(item=>item.classList.add("reveal-ready"));
  const copyObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting) { entry.target.classList.add("is-revealed"); copyObserver.unobserve(entry.target); }
    });
  },{threshold:.15,rootMargin:"0px 0px -4% 0px"});
  revealItems.forEach(item=>copyObserver.observe(item));
}

// Start the shared fade after the incoming page settles, rather than while
// it is still mostly outside the viewport. Re-arm only after it fully leaves.
const fadeSections=[...document.querySelectorAll("#direction,#perspective,#about")];
const aboutFadeItems=[
  ["#about-label",0], [".about-profile",.08],
  [".resume-career",.16], [".resume-education",.16],
  [".resume-experiences",.28], [".resume-awards",.28],
  [".resume-certificate",.4], [".resume-tool",.4],
].map(([selector,delay])=>{
  const item=document.querySelector(`#about ${selector}`);
  item.classList.add("about-fade-item");
  item.style.setProperty("--about-delay",`${delay}s`);
  return item;
});
if (!reducedMotion.matches) {
  fadeSections.filter(section=>section.id!=="perspective").forEach(section=>section.querySelector(".panel-body").classList.add("section-fade-ready"));
}
const perspectiveCopy=perspectiveSection.querySelector(".perspective-copy");
perspectiveCopy.classList.add("scroll-copy-fade");
function updateSectionFades() {
  if (reducedMotion.matches) return;
  const width=storyStage.clientWidth, height=window.innerHeight;
  fadeSections.forEach(section=>{
    const body=section.querySelector(".panel-body");
    const box=section.getBoundingClientRect();
    if(section.id==="perspective") {
      // Fade the lower page's type while its green background travels in.
      const entrance=Number(story.dataset.perspective || 0);
      const p=clamp((entrance-.35)/.65,0,1);
      const eased=p*p*(3-2*p);
      perspectiveCopy.style.setProperty("--scroll-copy-opacity",eased.toFixed(4));
      perspectiveCopy.style.setProperty("--scroll-copy-rise",`${(1-eased)*10}px`);
    }
    const outside=box.right<=0 || box.left>=width || box.bottom<=0 || box.top>=height;
    if(outside){
      body.classList.remove("is-section-visible");
      if(section.id==="about") aboutFadeItems.forEach(item=>item.classList.remove("is-about-item-visible"));
      return;
    }
    const visibleHeight=Math.max(0,Math.min(height,box.bottom)-Math.max(0,box.top));
    const settled=Math.abs(box.left)<=width*.08;
    const entering=section.id==="direction"
      ? box.top<=height*.25 && visibleHeight>=Math.min(box.height,height)*.55
      : settled && visibleHeight>=Math.min(box.height,height)*.3;
    if(entering) body.classList.add("is-section-visible");
    if(section.id==="about" && body.classList.contains("is-section-visible")) {
      aboutFadeItems.forEach(item=>{
        const itemBox=item.getBoundingClientRect();
        const inView=Math.max(0,Math.min(height,itemBox.bottom)-Math.max(0,itemBox.top));
        if(inView>=Math.min(itemBox.height,height)*.15) item.classList.add("is-about-item-visible");
      });
    }
  });
}

document.fonts?.ready.then(() => {
  measureStory();
  previewTextCache = new WeakMap();
  const activeRow = projectSection.querySelector(".is-active");
  if (activeRow) positionProjectPreview(activeRow);
});

function resetPointerEffects() {
  cursorPresent=false;
  updateCoverCursor();
  heroSymbols.forEach(symbol=>{
    symbol.style.setProperty("--symbol-x","0px");
    symbol.style.setProperty("--symbol-y","0px");
    symbol.style.setProperty("--symbol-tilt","0deg");
  });
  currentStoryIndex = -1;
  measureStory();
  footer.classList.toggle("motion-ready", !reducedMotion.matches);
  captureCoverAnimations();
  if (reducedMotion.matches) {
    revealItems.forEach(item=>item.classList.add("is-revealed"));
    fadeSections.forEach(section=>section.querySelector(".panel-body").classList.add("is-section-visible"));
  }
  lastHeroProgress = -1;
  scheduleScene();
}
reducedMotion.addEventListener("change", resetPointerEffects);
finePointer.addEventListener("change", resetPointerEffects);

// 실제 문서의 스크롤을 부드럽게 보간해 sticky 장면도 함께 움직임.
// 터치는 기본 스크롤을 유지하며, 움직임 줄이기 설정은 Lenis가 자동 반영.
const smoothScroll = typeof window.Lenis === "function" ? new window.Lenis({
  autoRaf: true,
  lerp: 0.085,
  smoothWheel: true,
  wheelMultiplier: 0.9,
  syncTouch: false,
  anchors: true,
  stopInertiaOnNavigate: true,
  respectReducedMotion: true,
}) : null;

smoothScroll?.on("scroll", () => {
  // 보간된 스크롤과 같은 프레임에 장면을 갱신해 반응이 늦지 않게 처리.
  if (sceneFrame !== null) cancelAnimationFrame(sceneFrame);
  updateScene();
  scheduleHeaderTheme();
});
