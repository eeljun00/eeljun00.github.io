/* Photo-based adaptation of OriginKit Grass Field's pointer bend and soft return.
   The supplied meadow stays intact; only its foreground texture is displaced. */
(() => {
  const hero = document.querySelector('.page1');
  const stage = hero?.querySelector('.hero-stage');
  const source = stage?.querySelector('.meadow-background');
  const canvas = stage?.querySelector('.meadow-canvas');
  if (!canvas || !source) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  // A real mouse can be present on a hybrid laptop even if its primary pointer is coarse.
  if (reduced.matches) {stage.dataset.motionMode='static';return;}
  let fallback=null;
  function useFallback(reason){
    canvas.classList.remove('is-ready');
    stage.dataset.motionMode='image-filter';
    stage.dataset.motionReason=reason;
    if(fallback) return;
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('width','0');svg.setAttribute('height','0');svg.setAttribute('aria-hidden','true');
    svg.style.position='absolute';
    const filter=document.createElementNS(ns,'filter');
    filter.id='meadow-pointer-filter';
    filter.setAttribute('x','-5%');filter.setAttribute('y','-5%');filter.setAttribute('width','110%');filter.setAttribute('height','110%');
    filter.setAttribute('color-interpolation-filters','sRGB');
    const noise=document.createElementNS(ns,'feTurbulence');
    noise.setAttribute('type','fractalNoise');noise.setAttribute('baseFrequency','.008 .035');noise.setAttribute('numOctaves','2');noise.setAttribute('seed','8');noise.setAttribute('result','wind');
    const displacement=document.createElementNS(ns,'feDisplacementMap');
    displacement.setAttribute('in','SourceGraphic');displacement.setAttribute('in2','wind');displacement.setAttribute('scale','0');displacement.setAttribute('xChannelSelector','R');displacement.setAttribute('yChannelSelector','G');
    filter.append(noise,displacement);svg.append(filter);stage.append(svg);
    const image=document.createElement('img');
    image.className='meadow-pointer-fallback';image.alt='';image.setAttribute('aria-hidden','true');
    image.src=source.currentSrc || source.src;
    image.style.filter='url(#meadow-pointer-filter)';
    stage.insertBefore(image,canvas.nextSibling);
    image.style.maskComposite='intersect';
    fallback={image,noise,displacement,grassMask:''};
  }
  let gl;
  try {gl=canvas.getContext('webgl', {alpha:false, antialias:false, depth:false, powerPreference:'low-power'});} catch {}
  if(!gl) useFallback('webgl-unavailable');
  function setupWebGL(){
  const vertex = `attribute vec2 position; varying vec2 uv;
    void main(){uv=(position+1.0)*.5;gl_Position=vec4(position,0.,1.);}`;
  const fragment = `precision mediump float;
    varying vec2 uv; uniform sampler2D photo;
    uniform vec2 crop; uniform vec2 pointer; uniform float aspect;
    uniform float time; uniform float energy;
    void main(){
      vec2 photoUV=(uv-.5)*crop+.5;
      float foreground=smoothstep(.51,.78,1.-photoUV.y);
      vec2 delta=(uv-pointer)*vec2(aspect,1.);
      float distance=length(delta);
      float reach=exp(-distance*distance/ .2);
      // Broad, uneven gusts bend the photograph across the field. No circular
      // distance wave or radial push: the pointer steers a flowing wind patch.
      float sway=sin(uv.y*10.+uv.x*5.-time*1.7);
      float swell=sin(uv.x*8.-uv.y*5.+time*1.15);
      float folds=sin(uv.y*19.+uv.x*11.-time*2.1);
      vec2 offset=vec2(sway*.016+folds*.004,swell*.008);
      // Fade the displacement before it reaches the cropped photo boundaries.
      float edge=min(min(uv.x,1.-uv.x),uv.y);
      float edgeFade=smoothstep(.025,.10,edge);
      offset*=reach*foreground*energy*edgeFade;
      vec2 sampleUV=clamp(photoUV+offset*crop,vec2(.001),vec2(.999));
      gl_FragColor=texture2D(photo,sampleUV);
    }`;
  function compile(type, code) {
    const shader=gl.createShader(type);
    gl.shaderSource(shader,code); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
    return shader;
  }
  const vs=compile(gl.VERTEX_SHADER,vertex), fs=compile(gl.FRAGMENT_SHADER,fragment);
  if (!vs || !fs) {useFallback('shader-unavailable');return null;}
  const program=gl.createProgram();
  gl.attachShader(program,vs); gl.attachShader(program,fs); gl.linkProgram(program);
  gl.deleteShader(vs); gl.deleteShader(fs);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) {useFallback('program-unavailable');return null;}
  gl.useProgram(program);
  const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const pos=gl.getAttribLocation(program,'position');
  gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const uniforms=Object.fromEntries(['photo','crop','pointer','aspect','time','energy'].map(name=>[name,gl.getUniformLocation(program,name)]));
  const texture=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.uniform1i(uniforms.photo,0);
  return uniforms;
  }
  const uniforms=gl ? setupWebGL() : null;
  let ready=false, frame=null, lastTime=0, energy=0, target=0;
  let pointer=[.5,.2], aim=[.5,.2], photoZoom=1;
  function allowed(){return ready && !reduced.matches && !document.hidden && !hero.classList.contains('is-covered') && !hero.classList.contains('is-offscreen');}
  function resize(){
    photoZoom=Math.max(1,parseFloat(getComputedStyle(stage).getPropertyValue('--meadow-zoom')) || 1);
    const ratio=Math.min(devicePixelRatio || 1,1.5);
    canvas.width=Math.round(stage.clientWidth*ratio);
    canvas.height=Math.round(stage.clientHeight*ratio);
    if(uniforms && !fallback) gl.viewport(0,0,canvas.width,canvas.height);
    const aspect=stage.clientWidth/stage.clientHeight, photoAspect=source.naturalWidth/source.naturalHeight;
    if(uniforms && !fallback){
      gl.uniform1f(uniforms.aspect,aspect);
      gl.uniform2f(uniforms.crop,Math.min(1,aspect/photoAspect),Math.min(1,photoAspect/aspect));
    }
    if(fallback){
      const cropY=Math.min(1,photoAspect/aspect), cropTop=(1-cropY)/2;
      const start=Math.max(0,Math.min(100,(.51-cropTop)/cropY*100));
      const end=Math.max(start,Math.min(100,(.78-cropTop)/cropY*100));
      fallback.grassMask=`linear-gradient(transparent ${start}%,#000 ${end}%)`;
    }
    wake();
  }
  function render(now){
    frame=null;
    if (!allowed()) return;
    if(now-lastTime<1000/30){frame=requestAnimationFrame(render);return;}
    const dt=Math.min((now-lastTime)/1000 || .016,.05); lastTime=now;
    const ease=1-Math.exp(-dt*7);
    energy+=(target-energy)*ease;
    if(target===0 && energy<.002) energy=0;
    pointer=pointer.map((value,index)=>value+(aim[index]-value)*ease);
    if(fallback){
      const t=now/1000;
      fallback.image.style.opacity=energy===0 ? '0' : '1';
      fallback.image.style.maskImage=`radial-gradient(ellipse 55% 60% at ${pointer[0]*100}% ${(1-pointer[1])*100}%,#000,transparent),${fallback.grassMask},linear-gradient(to right,transparent 2.5%,#000 10%,#000 90%,transparent 97.5%),linear-gradient(to top,transparent 2.5%,#000 10%)`;
      fallback.displacement.setAttribute('scale',(energy*28).toFixed(2));
      fallback.noise.setAttribute('baseFrequency',`${.008+Math.sin(t*1.1)*.0015} ${.035+Math.cos(t*.9)*.005}`);
    } else {
      gl.uniform2f(uniforms.pointer,...pointer);
      gl.uniform1f(uniforms.time,now/1000);
      gl.uniform1f(uniforms.energy,energy);
      gl.drawArrays(gl.TRIANGLES,0,6);
    }
    canvas.dataset.motionEnergy=energy.toFixed(3);
    if (target>0 || energy>.002) frame=requestAnimationFrame(render);
  }
  function wake(){if (allowed() && frame===null) {lastTime=performance.now();frame=requestAnimationFrame(render);}}
  window.addEventListener('pointermove',event=>{
    if (event.pointerType==='touch' || !allowed()) return;
    const bounds=stage.getBoundingClientRect();
    const inside=event.clientX>=bounds.left && event.clientX<=bounds.right && event.clientY>=bounds.top && event.clientY<=bounds.bottom;
    if(!inside){settle();return;}
    const x=(event.clientX-bounds.left)/bounds.width, y=1-(event.clientY-bounds.top)/bounds.height;
    aim=[.5+(x-.5)/photoZoom,.5+(y-.5)/photoZoom];
    // Moving through sky leaves the original sky and horizon completely still.
    target=aim[1]<.5 ? 1.0 : 0;
    wake();
  },{passive:true,capture:true});
  function settle(){target=0;wake();}
  stage.addEventListener('pointerleave',settle);
  window.addEventListener('pointercancel',settle);
  document.addEventListener('pointerout',event=>{if(!event.relatedTarget) settle();});
  window.addEventListener('blur',settle);
  window.addEventListener('scroll',()=>{
    if (!allowed()) {target=0;energy=0;if(frame!==null)cancelAnimationFrame(frame);frame=null;}
    else wake();
  },{passive:true});
  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{settle();});
  [reduced,fine].forEach(media=>media.addEventListener('change',()=>{
    target=0; energy=0;
    canvas.classList.toggle('is-ready',ready && !fallback && !reduced.matches);
    if(fallback) fallback.image.style.opacity='0';
    wake();
  }));
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();canvas.classList.remove('is-ready');
    useFallback('context-lost');resize();
    if(frame!==null)cancelAnimationFrame(frame);frame=null;
  });
  function start(){
    if (!source.naturalWidth) return;
    if(uniforms && !fallback){
      try {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,source);
        if(gl.getError()!==gl.NO_ERROR) useFallback('texture-unavailable');
      } catch {useFallback('texture-unavailable');}
    }
    ready=true; resize();
    if(!fallback){
      stage.dataset.motionMode='webgl';
      // First frame is the original photo; there is no idle animation.
      gl.uniform1f(uniforms.energy,0);gl.drawArrays(gl.TRIANGLES,0,6);
      canvas.classList.add('is-ready');
    }
  }
  if(source.complete) start(); else source.addEventListener('load',start,{once:true});
})();
