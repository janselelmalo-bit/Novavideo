const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const toast=(m)=>{const t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2500)};
$$(".nav").forEach(b=>b.onclick=()=>{$$(".nav").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".tab").forEach(x=>x.classList.remove("activeTab"));$("#"+b.dataset.tab).classList.add("activeTab")});
$$(".chips button").forEach(b=>b.onclick=()=>$("#prompt").value=b.dataset.example);
$("#format").onchange=e=>{$("#previewFormat").textContent=e.target.value;const p=$("#preview");p.classList.remove("portrait","landscape","square");p.classList.add(e.target.value==="9:16"?"portrait":e.target.value==="16:9"?"landscape":"square")};

async function makeScript(){
 const prompt=$("#prompt").value.trim(); if(!prompt)return toast("Escribe una idea primero.");
 $("#scriptBtn").disabled=true; $("#scriptBtn").textContent="Generando...";
 try{const r=await fetch("/api/script",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});const d=await r.json();renderScenes(d.scenes);toast("Guion creado correctamente.");}
 catch(e){toast("No se pudo crear el guion.");} finally{$("#scriptBtn").disabled=false;$("#scriptBtn").textContent="✦ Crear guion con IA";}
}
function renderScenes(scenes){$("#scenes").innerHTML=scenes.map((s,i)=>`<div class="scene"><div class="sceneTime">${s.duration}s</div><div><b>${s.title}</b><p>${s.visual}</p><p>🎙 ${s.voice}</p></div><div class="sceneActions">✎</div></div>`).join("")}
$("#scriptBtn").onclick=makeScript;

$("#previewVoice").onclick=()=>{const text=$("#prompt").value.trim()||"Esta es una prueba de voz de NovaVideo AI."; if("speechSynthesis" in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="es-ES";u.rate=.95;speechSynthesis.speak(u);toast("Reproduciendo voz de prueba.");}else toast("Tu navegador no permite prueba de voz.")};

async function pollVideo(id){
  for(let n=0;n<120;n++){
    const r=await fetch("/api/generate/"+encodeURIComponent(id));
    const d=await r.json();
    if(d.status==="succeeded"){
      const out=Array.isArray(d.output)?d.output[0]:d.output;
      showVideo(out);
      return true;
    }
    if(d.status==="failed"||d.status==="canceled") throw new Error(d.error||"La generación no terminó.");
    const pct=Math.min(95,12+n);
    $("#progressNum").textContent=pct+"%"; $("#progressBar").style.width=pct+"%";
    $("#progressText").textContent=n<5?"Generando video con IA...":n<20?"Renderizando movimiento y audio...":"Finalizando video...";
    await new Promise(r=>setTimeout(r,3000));
  }
  throw new Error("La generación está tardando demasiado. Puedes consultar el proyecto nuevamente.");
}
function showVideo(url){
  if(!url) throw new Error("La API no devolvió el archivo de video.");
  $("#preview").innerHTML=`<video controls autoplay playsinline src="${url}"></video><a class="download" href="${url}" target="_blank" rel="noopener">⬇ Abrir / guardar video</a>`;
  $("#preview").classList.add("generated");
  $("#progressText").textContent="Video terminado"; $("#progressNum").textContent="100%"; $("#progressBar").style.width="100%";
}
$("#generate").onclick=async()=>{
 const prompt=$("#prompt").value.trim(); if(!prompt)return toast("Escribe una idea para generar el video.");
 const btn=$("#generate");btn.disabled=true;btn.textContent="✦ Generando con IA...";
 $("#progressWrap").classList.remove("hidden"); $("#progressNum").textContent="5%"; $("#progressBar").style.width="5%";
 try{
  const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    prompt,format:$("#format").value,quality:$("#quality").value,duration:$("#duration").value
  })});
  const d=await r.json();
  if(!r.ok) throw new Error(d.error||"No se pudo iniciar la generación.");
  if(d.status==="succeeded"&&d.output){showVideo(Array.isArray(d.output)?d.output[0]:d.output)}
  else await pollVideo(d.id);
  await makeScript();
  toast("¡Video generado correctamente!");
 }catch(e){toast(e.message||"Error generando video."); $("#progressText").textContent="Error"; }
 finally{btn.disabled=false;btn.textContent="✦ Generar video";}
};