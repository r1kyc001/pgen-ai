const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    
    if (url.pathname === "/api/generate-prd" && request.method === "POST") {
      return handleGeneratePRD(request, env);
    }
    
    if (url.pathname.startsWith("/api/saved-prds/")) {
      return handleSavedPRDs(request, env);
    }
    
    return new Response("Not found", { status: 404, headers: corsHeaders });
  },
};

async function handleGeneratePRD(request, env) {
  try {
    const body = await request.json();
    const { idea, llm_config } = body;
    
    if (!idea) {
      return new Response("IDEA_REQUIRED", { status: 400, headers: corsHeaders });
    }
    
    const systemPrompt = getPRDPrompt(idea);
    
    const response = await fetch(llm_config.endpoint, {
      method: "POST",
      headers: {
        "Authorization": llm_config.api_key.startsWith('Bearer') ? llm_config.api_key : `Bearer ${llm_config.api_key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: llm_config.model || "default",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: idea }
        ],
        stream: true
      })
    });

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache"
      }
    });
  } catch (e) {
    return new Response(e.message, { status: 500, headers: corsHeaders });
  }
}

function getPRDPrompt(idea) {
  return `You are a world-class Product Manager and AI Architect specializing in creating detailed Product Requirements Documents (PRDs) for software engineering teams.

TASK: Create a comprehensive PRD for the following product idea. Also include a "Technical Architecture Recommendation" section.

IDEA: ${idea}

OUTPUT FORMAT (Markdown):
---

# PRD: [Product Name Derived from Idea]

## 1. Objective
...

## 2. Background & Problem Statement
...

## 3. User Personas
...

## 4. Key Features (Epics)
...

## 5. Success Metrics
...

## 6. Non-Goals
...

## 7. Milestones
...

## Technical Architecture Recommendation

### Technology Stack
- **Primary Language**: ... (choose 1: TypeScript, Python, Go)
- **Framework**: ... (Next.js, FastAPI, Gin, dll - relevan dengan bahasa pilihan)
- **Database**: ... (PostgreSQL, SQLite, MongoDB)
- **Deployment/Infra**: ... (Vercel, Railway, Docker, Cloudflare Workers)

### Recommended Project Structure
source,target
src/, source code
src/components/, UI components
src/lib/, utility & LLM integration
src/routes/, API endpoints/pages (Next.js)
tests/, unit/integration tests
docs/, catatan desain
.env.example, environment variables template

### Potential Pitfalls & Considerations
... (gunakan untuk vibe coding: contoh "Jangan pakai useEffect yang terlalu kompleks di React", "Pastikan FastAPI async kalau butuh I/O bound")

---

TONE: Professional, concise, actionable.`;
}

async function handleSavedPRDs(request, env) {
  if (request.method === "POST") {
    try {
      const body = await request.json();
      const { id, content } = body;
      if (!id || !content) return new Response("Missing id or content", { status: 400, headers: corsHeaders });
      
      await env.PRD_BUCKET.put(`prds/${id}.md`, content);
      return new Response(JSON.stringify({ success: true, id }), { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(e.message, { status: 500, headers: corsHeaders });
    }
  } else if (request.method === "GET") {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (id && id !== "saved-prds" && id !== "") {
      const object = await env.PRD_BUCKET.get(`prds/${id}.md`);
      if (!object) return new Response("Not found", { status: 404, headers: corsHeaders });
      const content = await object.text();
      return new Response(content, { status: 200, headers: { ...corsHeaders, "Content-Type": "text/markdown" } });
    }
    
    const listed = await env.PRD_BUCKET.list({ prefix: 'prds/' });
    const keys = listed.objects.map(o => o.key);
    return new Response(JSON.stringify({ prds: keys }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  
  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
}