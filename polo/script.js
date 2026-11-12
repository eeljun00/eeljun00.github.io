(() => {
'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const dialog = $('.detail-dialog');
const content = $('#dialog-content');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const products = [
{title:'스웨이드 재킷', english:'Suede Jacket', image:'da9b3.png', category:'남성'},
{title:'플리츠 울 팬츠', english:'Pleated Wool Trousers', image:'2d311.png', category:'남성'},
{title:'울 캐시미어 코트', english:'Wool Cashmere Coat', image:'4ac81.png', category:'여성'},
{title:'폴로 베어 니트', english:'Polo Bear Sweater', image:'9f50f.png', category:'키즈'},
{title:'레더 숄더백', english:'Leather Shoulder Bag', image:'39299.png', category:'여성'},
{title:'스웨이드 로퍼', english:'Suede Loafers', image:'04138.png', category:'남성'},
{title:'클래식 윈터 스타일', english:'Cold Weather Classics', image:'5315a.png', category:'남성'},
{title:'울 체크 스카프', english:'Wool Check Scarf', image:'14f40.png', category:'남성'},
{title:'네이비 시그니처 스카프', english:'Signature Wool Scarf', image:'59909.png', category:'남성'},
{title:'타탄 체크 스카프', english:'Tartan Scarf', image:'05837.png', category:'여성'},
{title:'케이블 니트 장갑', english:'Cable Knit Gloves', image:'ef1ac.png', category:'여성'},
{title:'스웨이드 레더 숄더백', english:'Suede Leather Shoulder Bag', image:'14daa.png', category:'여성'},
{title:'폴로 베어 삭스', english:'Polo Bear Socks', image:'2b659.png', category:'남성'},
{title:'커스텀 핏 옥스포드 티셔츠', english:'Custom Fit Oxford Shirt', image:'3b3cc.png', category:'남성'},
{title:'체크 드레스', english:'Tartan Dress', image:'image-444.png', category:'키즈'},
{title:'노르딕 반소매 니트', english:'Fair Isle Sweater', image:'image-439.png', category:'키즈'},
{title:'홀리데이 트럭 니트', english:'Holiday Sweater', image:'image-442.png', category:'키즈'},
{title:'페어아일 숄 카디건', english:'Fair Isle Cardigan', image:'image-435.png', category:'남성'}
];
const favorites = new Set();
const bag = new Map();
const header = $('.site-header');
const heroSlides=$$('.hero-slide');
let heroIndex=0;
function advanceHero(){if(document.hidden)return;heroIndex=(heroIndex+1)%heroSlides.length;heroSlides.forEach((slide,i)=>{slide.classList.toggle('is-active',i===heroIndex);slide.setAttribute('aria-hidden',String(i!==heroIndex));});}
setInterval(advanceHero,7000);
function updateHeader(){header.classList.toggle('is-scrolled',window.scrollY > 80);}
window.addEventListener('scroll',updateHeader,{passive:true});
updateHeader();
// Fit the editorial sections only when the result stays comfortably legible.
function updateSectionFits(){
 const root=document.documentElement,rem=parseFloat(getComputedStyle(root).fontSize),available=innerHeight-78*rem;
 function fit(height){const ratio=Math.min(1,available/(height*rem));return innerWidth>900&&ratio>=.6?ratio:1;}
 const custom=fit(1080),editorial=fit(1090);
 root.style.setProperty('--custom-fit',custom);root.style.setProperty('--custom-width',(100/custom)+'%');
 root.style.setProperty('--editorial-fit',editorial);root.style.setProperty('--editorial-width',(100/editorial)+'%');
}
updateSectionFits();window.addEventListener('resize',updateSectionFits);
const worldImage=$('.world-image img');
let worldFrame=0;
function updateWorld(){worldFrame=0;if(motionPreference.matches){worldImage.style.translate='';return;}const rect=$('.world').getBoundingClientRect();if(rect.bottom<0||rect.top>innerHeight)return;const progress=(innerHeight/2-(rect.top+rect.height/2))/innerHeight;worldImage.style.translate='0 '+Math.max(-12,Math.min(12,progress*18))+'px';}
window.addEventListener('scroll',()=>{if(!worldFrame)worldFrame=requestAnimationFrame(updateWorld);},{passive:true});
motionPreference.addEventListener('change',updateWorld);
updateWorld();
let lastFocus, toastTimer;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const note = '<p class="dialog-note">이준화의 디자인 포트폴리오를 위한 시연 페이지입니다. 실제 주문과 결제는 진행되지 않습니다.</p>';
const official = '<a class="solid-button" href="https://www.ralphlauren.co.kr/" rel="noopener noreferrer">랄프 로렌 공식 사이트 방문</a>';
function notify(message) {
 const toast = $('.toast'); clearTimeout(toastTimer); toast.textContent = message; toast.classList.add('visible');
 toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
}
function open(markup) {
 if (!dialog.open) {lastFocus = document.activeElement; cancelWheel();}
 content.innerHTML = markup;
 if (!dialog.open) dialog.showModal();
 dialog.scrollTop = 0;
 $('.dialog-close').focus({preventScroll:true});
}
function info(title, description, image) {
 open((image ? '<div class="dialog-product"><img src="assets/'+image+'" alt="'+escape(title)+'"><div>' : '')+
 '<h2 id="dialog-title">'+escape(title)+'</h2><p>'+escape(description)+'</p>'+official+note+(image?'</div></div>':''));
}
function showProduct(index) {
 const p = products[index];
 open('<div class="dialog-product"><img src="assets/'+p.image+'" alt="'+escape(p.title)+'"><div><p>'+p.english+'</p><h2 id="dialog-title">'+p.title+'</h2><p>시대를 초월하는 클래식한 스타일과 섬세한 디테일을 만나보세요.</p>'+
 (index===13?'<p>선택한 자수: '+escape($('#color-label').textContent)+'</p>':'')+
 '<div class="dialog-actions"><button class="solid-button" data-save="'+index+'">'+(favorites.has(index)?'위시리스트에 저장됨':'위시리스트 저장')+'</button><button class="solid-button" data-add="'+index+'">쇼핑백에 담기</button></div>'+note+'</div></div>');
}
function saved(kind) {
 const items = kind==='favorites' ? [...favorites] : [...bag.keys()];
 open('<h2 id="dialog-title">'+(kind==='favorites'?'위시리스트':'쇼핑백')+'</h2>'+
 (items.length?'<div class="saved-list">'+items.map(index=>{const p=products[index];return '<div class="saved-row"><button data-product="'+index+'" aria-label="'+p.title+' 보기"><img src="assets/'+p.image+'" alt="'+p.title+'"></button><span>'+p.title+(kind==='bag'?'<br>수량 '+bag.get(index):'')+'</span><button data-remove="'+index+'" data-kind="'+kind+'">삭제</button></div>';}).join('')+'</div>':'<p>아직 '+(kind==='favorites'?'저장한 상품이':'담긴 상품이')+' 없습니다. 마음에 드는 컬렉션을 만나보세요.</p><button class="solid-button" data-close-scroll="new-in">신상품 둘러보기</button>')+note);
}
function updateBag() {
 const count = [...bag.values()].reduce((a,b)=>a+b,0);
 $('.bag-count').textContent = count; $('.bag-count').hidden = !count;
}
function renderSearch(query='') {
 const q=query.trim().toLocaleLowerCase();
 const results=products.map((p,index)=>({...p,index})).filter(p=>(p.title+' '+p.english+' '+p.category).toLocaleLowerCase().includes(q));
 $('.search-results',content).innerHTML=results.length?results.map(p=>'<button class="search-result" data-product="'+p.index+'"><img src="assets/'+p.image+'" alt=""><span>'+p.title+'</span></button>').join(''):'<p class="search-empty">검색 결과가 없습니다. 셔츠, 스카프, 가방 등으로 검색해 보세요.</p>';
}
const panels = {
 search(){open('<h2 id="dialog-title">상품 검색</h2><form class="search-form"><input type="search" name="q" aria-label="검색어" placeholder="셔츠, 스카프, 가방" autocomplete="off"><button class="solid-button">검색</button></form><div class="search-results" aria-live="polite"></div>');renderSearch();$('.search-form input',content).focus();},
 favorites(){saved('favorites');}, bag(){saved('bag');},
 account(){info('Polo Ralph Lauren 계정','회원 서비스와 주문 내역은 랄프 로렌 공식 사이트에서 확인하실 수 있습니다.');},
 language(){open('<h2 id="dialog-title">국가 및 언어</h2><div class="language-options"><label for="country">배송지</label><select id="country"><option>대한민국</option></select><label for="locale">언어</label><select id="locale"><option>한국어</option></select></div><button class="solid-button" data-confirm-language>확인</button>');},
 collection(){open('<h2 id="dialog-title">New In</h2><p>새롭게 만나는 클래식, 폴로 랄프 로렌의 시즈널 아이템.</p><div class="search-results"></div>');renderSearch();},
 custom(){showProduct(13);},
 story(){info('World of Ralph Lauren','미국적인 헤리티지와 시대를 초월한 우아함.\n1967년부터 이어온 랄프 로렌의 세계를 만나보세요.','f96a8.png');},
 fall(){$('.collection-grid').scrollIntoView({behavior:motionPreference.matches?'instant':'smooth',block:'start'});},
 living(){info('The Art of Living','의류를 넘어 당신의 일상 가장 가까운 곳으로.\n랄프 로렌이 제안하는 삶의 양식을 만나보세요.','2b154.png');},
 stores(){info('매장 찾기','가까운 매장을 찾아 폴로만의 특별한 스타일링 서비스를 경험하세요.\n공식 사이트에서 지역별 매장 정보와 운영 시간을 확인하실 수 있습니다.','bee15.png');}
};
$('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{lastFocus?.focus({preventScroll:true});cancelWheel();});
$('.mobile-menu').addEventListener('click',()=>{
 const expanded = $('.mobile-menu').getAttribute('aria-expanded')==='true';
 $('.mobile-menu').setAttribute('aria-expanded',String(!expanded));$('#main-nav').classList.toggle('open',!expanded);
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){$('#main-nav').classList.remove('open');$('.mobile-menu').setAttribute('aria-expanded','false');}});
document.addEventListener('click',event=>{
 const el=event.target.closest('button,a');
 if(!el)return;
 if(el.matches('.experience-prev,.experience-next')){
  const grid=$('.experience-grid'),cards=[...grid.children],before=new Map(cards.map(card=>[card,card.getBoundingClientRect()]));
  cards.forEach(card=>card.getAnimations().forEach(animation=>animation.cancel()));
  if(el.matches('.experience-next'))grid.append(cards[0]);else grid.prepend(cards[cards.length-1]);
  [...grid.children].forEach((card,i)=>{card.classList.toggle('experience-main',i===1);card.classList.toggle('experience-side',i!==1);});grid.classList.add('has-moved');
  if(!motionPreference.matches)cards.forEach(card=>{const from=before.get(card),to=card.getBoundingClientRect();card.animate([{transformOrigin:'top left',transform:`translate(${from.left-to.left}px,${from.top-to.top}px) scale(${from.width/to.width},${from.height/to.height})`},{transformOrigin:'top left',transform:'none'}],{duration:700,easing:'cubic-bezier(.22,.61,.36,1)'});});return;
 }
 if(el.matches('#main-nav a')){$('#main-nav').classList.remove('open');$('.mobile-menu').setAttribute('aria-expanded','false');}
 if(el.matches('.product-card,.winter-frame,.editorial-item,.experience-grid > button,.living-track > button,.look,.search-result,.saved-row button[data-product]'))return;
 if(el.dataset.panel){panels[el.dataset.panel]?.();return;}
 if(el.hasAttribute('data-product')){showProduct(Number(el.dataset.product));return;}
 if(el.hasAttribute('data-color')){
  $$('.swatches button').forEach(b=>{b.classList.toggle('selected',b===el);b.setAttribute('aria-pressed',String(b===el));});
  $('#color-label').textContent=el.dataset.color;
  const pony=$('.selected-pony');pony.src='assets/'+el.dataset.pony;pony.hidden=false;$('.shirt-preview').classList.add('has-custom');
  $('.shirt-preview>img').alt='커스텀 핏 옥스포드 셔츠, '+el.dataset.color+' 자수';
  return;
 }
 if(el.dataset.customType){$$('.custom-tabs button').forEach(button=>{const selected=button===el;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));});return;}
 if(el.hasAttribute('data-save')){const i=Number(el.dataset.save);favorites.add(i);el.textContent='위시리스트에 저장됨';notify('위시리스트에 저장했습니다.');return;}
 if(el.hasAttribute('data-add')){const i=Number(el.dataset.add);bag.set(i,(bag.get(i)||0)+1);updateBag();notify('쇼핑백에 담았습니다.');return;}
 if(el.hasAttribute('data-remove')){const i=Number(el.dataset.remove);el.dataset.kind==='favorites'?favorites.delete(i):bag.delete(i);updateBag();saved(el.dataset.kind);return;}
 if(el.dataset.closeScroll){dialog.close();$('#'+el.dataset.closeScroll).scrollIntoView({behavior:motionPreference.matches?'instant':'smooth'});return;}
 if(el.hasAttribute('data-confirm-language')){dialog.close();notify('대한민국 / 한국어가 선택되었습니다.');return;}
 if(el.dataset.footer){
  const label=el.dataset.footer;
  if(label==='매장 정보')panels.stores();
  else if(label==='개인맞춤')panels.custom();
  else if(label==='폴로 선물'){dialog.close();$('#gifts').scrollIntoView({behavior:motionPreference.matches?'instant':'smooth'});}
  else if(label==='랄프로렌 소개')panels.story();
  else if(label==='전화 문의')info('전화 문의','랄프로렌 코리아 고객 지원부\n080-566-1199\n평일 10:00–18:00 (점심시간 13:00–14:00)');
  else if(label==='개인정보 처리방침'||label==='쿠키 정책'||label==='쿠키 설정')info(label,'이 포트폴리오 페이지는 회원 정보와 이메일 주소를 서버로 전송하거나 저장하지 않습니다.\n검색, 위시리스트, 쇼핑백은 현재 페이지에서만 동작합니다.');
  else info(label,'랄프 로렌의 '+label+'에 관한 자세한 내용은 공식 사이트에서 확인하실 수 있습니다.');
 }
});
document.addEventListener('input',event=>{if(event.target.matches('.search-form input'))renderSearch(event.target.value);});
document.addEventListener('submit',event=>{
 if(event.target.matches('.search-form')){event.preventDefault();renderSearch($('.search-form input').value);}
 if(event.target.matches('.newsletter')){event.preventDefault();info('Polo Ralph Lauren 뉴스레터','새로운 컬렉션과 브랜드 소식을 만나보세요.\n뉴스레터 구독은 랄프 로렌 공식 사이트에서 신청하실 수 있습니다.');event.target.reset();}
});
// The living rail keeps native touch scrolling and adds a mouse-drag cursor.
const livingRail=$('.living-track');
const livingCursor=document.createElement('span');livingCursor.className='living-cursor';livingCursor.setAttribute('aria-hidden','true');livingCursor.textContent='↔';document.body.append(livingCursor);
let dragStart=null,dragged=false;
livingRail.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){livingCursor.style.left=e.clientX+'px';livingCursor.style.top=e.clientY+'px';livingCursor.classList.add('is-visible');}});
livingRail.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;livingCursor.style.left=e.clientX+'px';livingCursor.style.top=e.clientY+'px';if(dragStart){const delta=e.clientX-dragStart.x;if(Math.abs(delta)>5)dragged=true;if(dragged){livingRail.scrollLeft=dragStart.scroll-delta;e.preventDefault();}}});
livingRail.addEventListener('pointerleave',()=>{livingCursor.classList.remove('is-visible');});
window.addEventListener('scroll',()=>{if(!livingCursor.classList.contains('is-visible'))return;const x=parseFloat(livingCursor.style.left),y=parseFloat(livingCursor.style.top);if(!livingRail.contains(document.elementFromPoint(x,y)))livingCursor.classList.remove('is-visible');},{passive:true,capture:true});
livingRail.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0){dragStart={x:e.clientX,scroll:livingRail.scrollLeft};dragged=false;livingRail.classList.add('is-dragging');}});
window.addEventListener('pointerup',()=>{dragStart=null;livingRail.classList.remove('is-dragging');});
livingRail.addEventListener('click',e=>{if(dragged){e.preventDefault();e.stopImmediatePropagation();dragged=false;}},true);
// Duplicate the men's complete set for an uninterrupted automatic loop.
const winterRail=$('.winter-rail');
const winterRunner=document.createElement('div');winterRunner.className='winter-runner';
const winterSet=document.createElement('div');winterSet.className='winter-set';
const winterItems=[
 {src:'14f40.png',alt:'울 체크 스카프'},
 {src:'59909.png',alt:'네이비 시그니처 스카프'},
 {src:'05837.png',alt:'타탄 체크 스카프'},
 {src:'image-458.png',alt:'레드 타탄 스카프'},
 {src:'image-459.png',alt:'블루 타탄 스카프'},
 {src:'image-461.png',alt:'브라운 스카프'},
 {src:'image-462.png',alt:'다크 브라운 스카프'}
];
winterItems.forEach(item=>{const frame=document.createElement('span');frame.className='winter-frame';const img=document.createElement('img');img.src='assets/'+item.src;img.alt=item.alt;img.loading='lazy';frame.append(img);winterSet.append(frame);});
const winterClone=winterSet.cloneNode(true);winterClone.setAttribute('aria-hidden','true');
winterRunner.append(winterSet,winterClone);winterRail.replaceChildren(winterRunner);
// Image cards are decorative and no longer open detail dialogs.
$$('.product-card,.experience-grid > button,.living-track > button,.look').forEach(card=>{card.setAttribute('aria-disabled','true');card.tabIndex=-1;});
// Start each collection when it enters view, with its signature item centered.
const accessoryRail=$('.accessory-carousel'),accessoryRunner=$('.accessory-track');
accessoryRail.tabIndex=0;accessoryRail.setAttribute('aria-label','여성 액세서리. 좌우 방향키 또는 드래그로 넘기기');
if('IntersectionObserver' in window){const carouselObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{const runner=entry.target===winterRail?winterRunner:accessoryRunner;const animation=runner.getAnimations().find(a=>a.animationName);if(entry.isIntersecting){if(animation)animation.currentTime=0;entry.target.classList.add('carousel-visible');}else entry.target.classList.remove('carousel-visible');}),{threshold:.6});carouselObserver.observe(winterRail);carouselObserver.observe(accessoryRail);}else{winterRail.classList.add('carousel-visible');accessoryRail.classList.add('carousel-visible');}
// Dragging adjusts the running carousel without interrupting vertical touch scrolling.
function enableCarouselDrag(rail,runner){
 const cursor=document.createElement('span');cursor.className='living-cursor';cursor.setAttribute('aria-hidden','true');cursor.textContent='↔';document.body.append(cursor);
 let start=null,moved=false,manualOffset=0;
 function shift(delta){const animation=runner.getAnimations().find(a=>a.animationName);const width=runner.scrollWidth/2;if(!width)return;if(animation){const duration=animation.effect.getTiming().duration;animation.currentTime=((Number(animation.currentTime||0)-delta/width*duration)%duration+duration)%duration;}else{manualOffset=((manualOffset-delta)%width+width)%width;runner.style.transform='translateX('+(-manualOffset)+'px)';}}
 rail.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px';cursor.classList.add('is-visible');}});
 rail.addEventListener('pointerleave',()=>cursor.classList.remove('is-visible'));
 rail.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;start={x:e.clientX,last:e.clientX,id:e.pointerId};moved=false;});
 rail.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px';}if(!start||start.id!==e.pointerId)return;if(Math.abs(e.clientX-start.x)>6&&!moved){moved=true;rail.classList.add('is-dragging');rail.setPointerCapture(e.pointerId);}if(moved){const scale=rail.getBoundingClientRect().width/rail.clientWidth||1;shift((e.clientX-start.last)/scale);start.last=e.clientX;e.preventDefault();}});
 function end(){start=null;rail.classList.remove('is-dragging');}rail.addEventListener('pointerup',end);rail.addEventListener('pointercancel',end);
 rail.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopImmediatePropagation();moved=false;}},true);
 rail.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();shift(e.key==='ArrowRight'?-250:250);}});
 window.addEventListener('scroll',()=>{if(cursor.classList.contains('is-visible')&&!rail.contains(document.elementFromPoint(parseFloat(cursor.style.left),parseFloat(cursor.style.top))))cursor.classList.remove('is-visible');},{passive:true,capture:true});
}
enableCarouselDrag(winterRail,winterRunner);enableCarouselDrag(accessoryRail,accessoryRunner);
// Drag sideways to browse Experience; keyboard controls remain available on focus.
const experienceGrid=$('.experience-grid'),experienceCursor=document.createElement('span');experienceCursor.className='living-cursor';experienceCursor.setAttribute('aria-hidden','true');experienceCursor.textContent='↔';document.body.append(experienceCursor);let experienceStart=null,experienceDragged=false;
experienceGrid.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){experienceCursor.style.left=e.clientX+'px';experienceCursor.style.top=e.clientY+'px';experienceCursor.classList.add('is-visible');}});
experienceGrid.addEventListener('pointerleave',()=>experienceCursor.classList.remove('is-visible'));
experienceGrid.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){experienceCursor.style.left=e.clientX+'px';experienceCursor.style.top=e.clientY+'px';}if(experienceStart&&Math.abs(e.clientX-experienceStart.x)>8)experienceDragged=true;});
experienceGrid.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;experienceStart={x:e.clientX,id:e.pointerId};experienceDragged=false;});
experienceGrid.addEventListener('pointerup',e=>{if(!experienceStart)return;const delta=e.clientX-experienceStart.x;experienceStart=null;if(Math.abs(delta)>40){experienceDragged=true;$(delta<0?'.experience-next':'.experience-prev').click();}});
experienceGrid.addEventListener('pointercancel',()=>{experienceStart=null;});
experienceGrid.addEventListener('click',e=>{if(experienceDragged){e.preventDefault();e.stopImmediatePropagation();experienceDragged=false;}},true);
// Mouse wheel and trackpad browse two cards, then release vertical page scrolling.
let experienceWheelDirection=0,experienceWheelCount=0,experienceWheelLast=0,experienceWheelAmount=0;
experienceGrid.addEventListener('wheel',event=>{
 if(event.ctrlKey||dialog.open)return;
 const horizontal=Math.abs(event.deltaX)>Math.abs(event.deltaY)||event.shiftKey;
 const delta=horizontal?(event.deltaX||event.deltaY):event.deltaY;
 if(!delta)return;
 const direction=Math.sign(delta),now=performance.now();
 if(direction!==experienceWheelDirection){experienceWheelDirection=direction;experienceWheelCount=0;experienceWheelAmount=0;experienceWheelLast=0;}
 if(!horizontal&&experienceWheelCount>=2){if(now-experienceWheelLast<800)event.preventDefault();return;}
 event.preventDefault();cancelWheel();
 if(experienceWheelLast&&now-experienceWheelLast<750)return;
 experienceWheelAmount+=Math.abs(delta)*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
 if(experienceWheelAmount<35)return;
 experienceWheelAmount=0;experienceWheelLast=now;if(!horizontal)experienceWheelCount++;
 $(direction>0?'.experience-next':'.experience-prev').click();
},{passive:false});
experienceGrid.addEventListener('pointerleave',()=>{experienceWheelDirection=0;experienceWheelCount=0;experienceWheelAmount=0;experienceWheelLast=0;});
window.addEventListener('scroll',()=>{if(experienceCursor.classList.contains('is-visible')&&!experienceGrid.contains(document.elementFromPoint(parseFloat(experienceCursor.style.left),parseFloat(experienceCursor.style.top))))experienceCursor.classList.remove('is-visible');},{passive:true,capture:true});
// Accumulate wheel movement while the New In rail is still moving.
const newSection=$('.new-in'),productRail=$('.product-track');
const productCursor=document.createElement('span');productCursor.className='living-cursor';productCursor.setAttribute('aria-hidden','true');productCursor.textContent='↔';document.body.append(productCursor);
let productDrag=null;
productRail.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){productCursor.style.left=event.clientX+'px';productCursor.style.top=event.clientY+'px';productCursor.classList.add('is-visible');}});
productRail.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse')return;productCursor.style.left=event.clientX+'px';productCursor.style.top=event.clientY+'px';if(productDrag&&event.buttons===1){productRail.scrollLeft=productDrag.scroll-(event.clientX-productDrag.x);}});
productRail.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'&&event.button===0){stopProductWheel();productDrag={x:event.clientX,scroll:productRail.scrollLeft};}});
window.addEventListener('pointerup',()=>{productDrag=null;});
productRail.addEventListener('pointerleave',()=>{productCursor.classList.remove('is-visible');productDrag=null;});
window.addEventListener('scroll',()=>{if(productCursor.classList.contains('is-visible')&&!productRail.contains(document.elementFromPoint(parseFloat(productCursor.style.left),parseFloat(productCursor.style.top))))productCursor.classList.remove('is-visible');},{passive:true});
let productFrame=0,productTarget=0,productPosition=0,productTime=0,lastProductWheelTime=0;
function stopProductWheel(){cancelAnimationFrame(productFrame);productFrame=0;productRail.classList.remove('is-wheel-scrolling');}
function moveProductWheel(time){
 const elapsed=Math.min(40,time-productTime||16);productTime=time;
 const distance=productTarget-productPosition;
 if(Math.abs(distance)<.8){productPosition=productTarget;productRail.scrollLeft=productTarget;stopProductWheel();return;}
 productPosition+=distance*(1-Math.exp(-elapsed/110));productRail.scrollLeft=productPosition;productFrame=requestAnimationFrame(moveProductWheel);
}
newSection.addEventListener('wheel',event=>{
 if(event.ctrlKey||event.shiftKey||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
 if(event.deltaY<=0){stopProductWheel();return;}
 const max=Math.max(0,productRail.scrollWidth-productRail.clientWidth);
 const now=performance.now();
 if(!productFrame&&productRail.scrollLeft>=max-1){const isMomentum=now-lastProductWheelTime<180;lastProductWheelTime=now;if(isMomentum)event.preventDefault();return;}
 lastProductWheelTime=now;
 event.preventDefault();
 if(!motionPreference.matches){
  const top=newSection.getBoundingClientRect().top+scrollY-header.getBoundingClientRect().height-8;
  if(Math.abs(scrollY-top)>2&&(!wheelFrame||Math.abs(wheelTarget-top)>1)){
   cancelWheel();wheelPosition=scrollY;wheelTarget=top;wheelTime=performance.now();wheelFrame=requestAnimationFrame(smoothWheelFrame);
  }
 }
 const amount=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerWidth:1);
 if(!productFrame){productTarget=productPosition=productRail.scrollLeft;productTime=performance.now();productRail.classList.add('is-wheel-scrolling');}
 productTarget=Math.min(max,productTarget+amount);
 if(motionPreference.matches){productRail.scrollLeft=productTarget;stopProductWheel();}
 else if(!productFrame)productFrame=requestAnimationFrame(moveProductWheel);
},{passive:false});
// Reveal content in place as it enters the viewport; leave it visible without JS.
if ('IntersectionObserver' in window && !motionPreference.matches) {
 const targets=$$('.hero-copy, .section-heading, .product-card, .custom-heading, .custom-body, .editorial-photo, .editorial-products, .editorial-copy, .living-copy, .living-track > button, .experience-grid > button, .footer-top, .footer-utility, .footer-legal');
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('reveal-pending');observer.unobserve(entry.target);}}),{threshold:0.08,rootMargin:'0px 0px -25px 0px'});
 targets.forEach(el=>{if(el.getBoundingClientRect().top>=window.innerHeight*.8){el.classList.add('reveal-pending');observer.observe(el);}});
 motionPreference.addEventListener('change',()=>{if(motionPreference.matches){observer.disconnect();targets.forEach(el=>el.classList.remove('reveal-pending'));}});
}
// The collection reveals again when revisited, after each item enters the visible area.
let collectionObserver;
function configureCollectionReveal(){
 const items=$$('.collection-heading,.collection-grid .look');collectionObserver?.disconnect();
 items.forEach(item=>item.classList.remove('collection-reveal','is-visible'));
 if(motionPreference.matches||!('IntersectionObserver' in window))return;
 collectionObserver=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-visible',entry.isIntersecting)),{threshold:.1,rootMargin:'0px 0px -12% 0px'});
 items.forEach(item=>{item.classList.add('collection-reveal');collectionObserver.observe(item);});
}
configureCollectionReveal();motionPreference.addEventListener('change',configureCollectionReveal);
// Reveal the two stories only after they are visibly inside the viewport.
let storyObserver;
function configureStoryReveal(){
 const items=$$('.introduction p,.world-copy');storyObserver?.disconnect();
 items.forEach(item=>item.classList.remove('story-reveal','is-visible'));
 if(motionPreference.matches||!('IntersectionObserver' in window))return;
 storyObserver=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-visible',entry.isIntersecting)),{threshold:.15,rootMargin:'0px 0px -15% 0px'});
 items.forEach(item=>{item.classList.add('story-reveal');storyObserver.observe(item);});
}
configureStoryReveal();motionPreference.addEventListener('change',configureStoryReveal);
// Fade the gift photographs as their cards enter the viewport.
let giftObserver;
function configureGiftReveal(){
 const cards=$$('.gift-card');giftObserver?.disconnect();
 cards.forEach(card=>$('.gift-image',card).classList.remove('gift-reveal','is-visible'));
 if(motionPreference.matches||!('IntersectionObserver' in window))return;
 giftObserver=new IntersectionObserver(entries=>entries.forEach(entry=>$('.gift-image',entry.target).classList.toggle('is-visible',entry.isIntersecting)),{threshold:.12,rootMargin:'0px 0px -8% 0px'});
 cards.forEach(card=>{$('.gift-image',card).classList.add('gift-reveal');giftObserver.observe(card);});
}
configureGiftReveal();motionPreference.addEventListener('change',configureGiftReveal);
// Reuse the portfolio's wheel easing; touch, keyboard and nested scrollers stay native.
let wheelFrame=0,wheelTarget=scrollY,wheelPosition=scrollY,wheelTime=0,sectionSnapTimer=0;
function cancelWheel(){clearTimeout(sectionSnapTimer);cancelAnimationFrame(wheelFrame);wheelFrame=0;wheelTarget=wheelPosition=scrollY;}
function smoothWheelFrame(time){
 const elapsed=Math.min(40,time-wheelTime||16);wheelTime=time;
 wheelTarget=Math.max(0,Math.min(wheelTarget,document.documentElement.scrollHeight-innerHeight));
 const distance=wheelTarget-wheelPosition;
 if(Math.abs(distance)<.8){window.scrollTo({top:wheelTarget,behavior:'instant'});wheelFrame=0;return;}
 wheelPosition+=distance*(1-Math.exp(-elapsed/95));
 window.scrollTo({top:wheelPosition,behavior:'instant'});wheelFrame=requestAnimationFrame(smoothWheelFrame);
}
document.addEventListener('wheel',event=>{
 if(event.defaultPrevented||event.ctrlKey||event.shiftKey||motionPreference.matches||dialog.open||Math.abs(event.deltaX)>Math.abs(event.deltaY)||!event.deltaY)return;
 if(event.target.closest('dialog,input,textarea,select,[contenteditable=true],#main-nav.open'))return;
 for(let element=event.target;element&&element!==document.body;element=element.parentElement){
  const style=getComputedStyle(element);
  // Give horizontal product rails their native wheel/trackpad behavior.
  if(/auto|scroll/.test(style.overflowX)&&element.scrollWidth>element.clientWidth+1){if(element===winterRail)continue;return;}
  if(/auto|scroll/.test(style.overflowY)&&element.scrollHeight>element.clientHeight+1&&((event.deltaY<0&&element.scrollTop>0)||(event.deltaY>0&&element.scrollTop+element.clientHeight<element.scrollHeight-1)))return;
 }
 const amount=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
 if(!wheelFrame){wheelTarget=wheelPosition=scrollY;wheelTime=performance.now();}
 wheelTarget=Math.max(0,Math.min(wheelTarget+amount,document.documentElement.scrollHeight-innerHeight));
 clearTimeout(sectionSnapTimer);
 if(innerWidth>900)sectionSnapTimer=setTimeout(()=>{
  const headerHeight=header.getBoundingClientRect().height;
  const targets=[$('.custom'),$('.man-photo'),$('.accessories')].map(item=>item.getBoundingClientRect().top+scrollY-headerHeight);
  const closest=targets.reduce((best,target)=>Math.abs(target-wheelTarget)<Math.abs(best-wheelTarget)?target:best);
  if(Math.abs(closest-wheelTarget)>Math.min(160,innerHeight*.2))return;
  if(!wheelFrame){wheelPosition=scrollY;wheelTime=performance.now();}
  wheelTarget=closest;if(!wheelFrame)wheelFrame=requestAnimationFrame(smoothWheelFrame);
 },180);
 event.preventDefault();if(!wheelFrame)wheelFrame=requestAnimationFrame(smoothWheelFrame);
},{passive:false});
document.addEventListener('pointerdown',cancelWheel,{passive:true});
document.addEventListener('touchstart',cancelWheel,{passive:true});
document.addEventListener('keydown',cancelWheel);
document.addEventListener('pointerdown',stopProductWheel,{passive:true});
document.addEventListener('touchstart',stopProductWheel,{passive:true});
document.addEventListener('keydown',stopProductWheel);
document.addEventListener('click',event=>{if(event.target.closest('a[href^="#"]'))cancelWheel();});
window.addEventListener('resize',cancelWheel);
window.addEventListener('resize',stopProductWheel);
motionPreference.addEventListener('change',cancelWheel);
motionPreference.addEventListener('change',stopProductWheel);
// Keep the shortcut out of the footer and the initial cover.
const topButton=$('.back-to-top'),footer=$('.footer');
function updateTopButton(){topButton.classList.toggle('is-visible',scrollY>innerHeight*.7&&footer.getBoundingClientRect().top>=innerHeight);}
window.addEventListener('scroll',updateTopButton,{passive:true});window.addEventListener('resize',updateTopButton);updateTopButton();
topButton.addEventListener('click',()=>{cancelWheel();stopProductWheel();window.scrollTo({top:0,behavior:motionPreference.matches?'instant':'smooth'});});
// One lightweight pointer for ordinary content; existing rail pointers show arrows.
const finePointer=matchMedia('(hover: hover) and (pointer: fine)'),siteCursor=document.createElement('span');
siteCursor.className='site-cursor';siteCursor.setAttribute('aria-hidden','true');document.body.append(siteCursor);
let pointerX=0,pointerY=0,pointerPresent=false,pointerFrame=0;
function renderPointer(){
 pointerFrame=0;const target=document.elementFromPoint(pointerX,pointerY);
 const field=target?.closest('input,textarea,select,[contenteditable=true],dialog');
 const rail=target?.closest('.living-track,.winter-rail,.accessory-carousel,.experience-grid,.product-track');
 const activeRail=rail&&(rail.matches('.winter-rail,.accessory-carousel,.experience-grid')||rail.scrollWidth>rail.clientWidth+1);
 siteCursor.style.left=pointerX+'px';siteCursor.style.top=pointerY+'px';
 siteCursor.classList.toggle('is-visible',finePointer.matches&&pointerPresent&&!field&&!activeRail);
}
function queuePointer(){if(!pointerFrame)pointerFrame=requestAnimationFrame(renderPointer);}
function configurePointer(){document.body.classList.toggle('has-custom-pointer',finePointer.matches);queuePointer();}
document.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse')return;pointerPresent=true;pointerX=event.clientX;pointerY=event.clientY;queuePointer();},{passive:true});
document.addEventListener('pointerout',event=>{if(!event.relatedTarget){pointerPresent=false;queuePointer();}});
window.addEventListener('scroll',queuePointer,{passive:true});finePointer.addEventListener('change',configurePointer);configurePointer();
})();
