import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
const MODEL = process.env.VIDEO_MODEL || "google/veo-3.1-fast";

app.use(express.json({limit:"2mb"}));
app.use(express.static(path.join(__dirname,"public")));

function authHeaders(extra={}) {
  return {
    "Authorization": `Bearer ${REPLICATE_TOKEN}`,
    "Content-Type": "application/json",
    ...extra
  };
}

app.get("/api/status",(req,res)=>{
  res.json({
    configured: Boolean(REPLICATE_TOKEN),
    model: MODEL,
    provider: "Replicate + Google Veo 3.1"
  });
});

app.post("/api/script",(req,res)=>{
  const prompt=String(req.body.prompt||"").trim();
  if(!prompt) return res.status(400).json({error:"Escribe una idea primero."});
  const scenes=[
    {title:"Escena 1 — Introducción",duration:8,visual:`Plano cinematográfico basado en: ${prompt}`,voice:"Introduce la historia de forma envolvente."},
    {title:"Escena 2 — Desarrollo",duration:8,visual:`Plano dinámico, iluminación realista, basado en: ${prompt}`,voice:"La historia avanza y aumenta la intensidad."},
    {title:"Escena 3 — Momento principal",duration:8,visual:`Plano épico, cámara en movimiento, basado en: ${prompt}`,voice:"Este es el momento central de la historia."},
    {title:"Escena 4 — Final",duration:8,visual:`Plano final cinematográfico basado en: ${prompt}`,voice:"La historia llega a su conclusión."}
  ];
  res.json({title:"Video IA — "+prompt.slice(0,55),scenes});
});

app.post("/api/generate", async (req,res)=>{
  try {
    if(!REPLICATE_TOKEN) {
      return res.status(503).json({
        error:"Falta REPLICATE_API_TOKEN.",
        setup:"Crea una variable de entorno REPLICATE_API_TOKEN con tu token de Replicate."
      });
    }
    const {prompt,format="9:16",quality="Alta",duration=8} = req.body || {};
    if(!prompt) return res.status(400).json({error:"Falta el prompt."});

    const aspect_ratio = format==="16:9" ? "16:9" : format==="1:1" ? "16:9" : "9:16";
    // Veo 3.1 oficialmente admite 8s por defecto; la app genera una toma real por solicitud.
    // "Ultra" -> 1080p, "Alta" -> 1080p, Básica -> 720p.
    const resolution = quality==="Básica" ? "720p" : "1080p";

    const body = {
      input: {
        prompt: `${prompt}. High quality cinematic video. Natural realistic motion. Include appropriate ambient sound, sound effects and spoken dialogue/narration only when requested by the prompt.`,
        duration: 8,
        resolution,
        aspect_ratio,
        generate_audio: true
      }
    };

    const create = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`,{
      method:"POST",
      headers:authHeaders({"Prefer":"wait=1"}),
      body:JSON.stringify(body)
    });
    const prediction = await create.json();
    if(!create.ok) return res.status(create.status).json({error:prediction?.detail || prediction?.error || "Error creando el video.", raw:prediction});

    res.json({ok:true,id:prediction.id,status:prediction.status,output:prediction.output||null,model:MODEL});
  } catch(e) {
    res.status(500).json({error:e.message||"Error interno"});
  }
});

app.get("/api/generate/:id", async (req,res)=>{
  try {
    if(!REPLICATE_TOKEN) return res.status(503).json({error:"Falta REPLICATE_API_TOKEN."});
    const r=await fetch(`https://api.replicate.com/v1/predictions/${encodeURIComponent(req.params.id)}`,{
      headers:{"Authorization":`Bearer ${REPLICATE_TOKEN}`}
    });
    const d=await r.json();
    if(!r.ok) return res.status(r.status).json(d);
    res.json({
      id:d.id,status:d.status,output:d.output||null,error:d.error||null,
      progress:d.status==="succeeded"?100:d.status==="failed"||d.status==="canceled"?0:50
    });
  } catch(e){res.status(500).json({error:e.message||"Error consultando generación"});}
});

app.post("/api/cancel/:id", async (req,res)=>{
  try{
    if(!REPLICATE_TOKEN) return res.status(503).json({error:"Falta REPLICATE_API_TOKEN."});
    const r=await fetch(`https://api.replicate.com/v1/predictions/${encodeURIComponent(req.params.id)}/cancel`,{
      method:"POST",headers:{"Authorization":`Bearer ${REPLICATE_TOKEN}`}
    });
    const d=await r.json(); res.status(r.status).json(d);
  }catch(e){res.status(500).json({error:e.message});}
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`NovaVideo AI Studio: http://localhost:${PORT}`));