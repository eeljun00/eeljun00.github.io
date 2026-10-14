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
  // Static original is the fallback on touch, reduced motion and unsupported GPUs.
  if (reduced.matches || !fine.matches) return;
  const gl = canvas.getContext('webgl', {alpha:false, antialias:false, depth:false, powerPreference:'low-power'});
  if (!gl) return;
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
      offset*=reach*foreground*energy;
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
  if (!vs || !fs) return;
  const program=gl.createProgram();
  gl.attachShader(program,vs); gl.attachShader(program,fs); gl.linkProgram(program);
  gl.deleteShader(vs); gl.deleteShader(fs);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) return;
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
  let ready=false, lost=false, frame=null, lastTime=0, energy=0, target=0;
  let pointer=[.5,.2], aim=[.5,.2];
  function allowed(){return ready && !lost && !reduced.matches && fine.matches && !document.hidden && !hero.classList.contains('is-covered') && !hero.classList.contains('is-offscreen');}
  function resize(){
    const ratio=Math.min(devicePixelRatio || 1,1.5);
    canvas.width=Math.round(stage.clientWidth*ratio);
    canvas.height=Math.round(stage.clientHeight*ratio);
    gl.viewport(0,0,canvas.width,canvas.height);
    const aspect=stage.clientWidth/stage.clientHeight, photoAspect=source.naturalWidth/source.naturalHeight;
    gl.uniform1f(uniforms.aspect,aspect);
    gl.uniform2f(uniforms.crop,Math.min(1,aspect/photoAspect),Math.min(1,photoAspect/aspect));
    wake();
  }
  function render(now){
    frame=null;
    if (!allowed()) return;
    const dt=Math.min((now-lastTime)/1000 || .016,.05); lastTime=now;
    const ease=1-Math.exp(-dt*7);
    energy+=(target-energy)*ease;
    pointer=pointer.map((value,index)=>value+(aim[index]-value)*ease);
    gl.uniform2f(uniforms.pointer,...pointer);
    gl.uniform1f(uniforms.time,now/1000);
    gl.uniform1f(uniforms.energy,energy);
    gl.drawArrays(gl.TRIANGLES,0,6);
    canvas.dataset.motionEnergy=energy.toFixed(3);
    if (target>0 || energy>.002) frame=requestAnimationFrame(render);
  }
  function wake(){if (allowed() && frame===null) {lastTime=performance.now();frame=requestAnimationFrame(render);}}
  stage.addEventListener('pointermove',event=>{
    if (event.pointerType==='touch' || !allowed()) return;
    const bounds=stage.getBoundingClientRect();
    aim=[(event.clientX-bounds.left)/bounds.width,1-(event.clientY-bounds.top)/bounds.height];
    // Moving through sky leaves the original sky and horizon completely still.
    target=aim[1]<.5 ? 1.0 : 0;
    wake();
  });
  function settle(){target=0;wake();}
  stage.addEventListener('pointerleave',settle);
  stage.addEventListener('pointercancel',settle);
  window.addEventListener('blur',settle);
  window.addEventListener('scroll',()=>{
    if (!allowed()) {target=0;energy=0;if(frame!==null)cancelAnimationFrame(frame);frame=null;}
    else wake();
  },{passive:true});
  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{settle();});
  [reduced,fine].forEach(media=>media.addEventListener('change',()=>{
    target=0; energy=0;
    canvas.classList.toggle('is-ready',ready && !lost && !reduced.matches && fine.matches);
    wake();
  }));
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();lost=true;canvas.classList.remove('is-ready');
    if(frame!==null)cancelAnimationFrame(frame);frame=null;
  });
  function start(){
    if (!source.naturalWidth || lost) return;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,source);
    ready=true; resize();
    // First frame is an exact, undistorted photo before interaction begins.
    gl.uniform1f(uniforms.energy,0);gl.drawArrays(gl.TRIANGLES,0,6);
    canvas.classList.add('is-ready');
  }
  if(source.complete) start(); else source.addEventListener('load',start,{once:true});
})();
