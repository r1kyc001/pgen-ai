export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === "/api/generate-prd" && request.method === "POST") {
      return handleGeneratePRD(request, env);
    }
    
    if (url.pathname.startsWith("/api/saved-prds/")) {
      return handleSavedPRDs(request, env);
    }
    
    return new Response("Not found", { status: 404 });
  },
};

async function handleGeneratePRD(request, env) {
  const body = await request.json();
  const { idea, llm_config } = body;
  
  if (!idea) {
    return new Response("IDEA_REQUIRED", { status: 400 });
  }
  
  const systemPrompt = getPRDPrompt(idea);
  
  const response = await fetch(llm_config.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${llm_config.api_key}`,
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
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache"
    }
  });
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
  // Placeholder for R2 integration
  // Akan diimplementasi setelah ada token
  return new Response("Saved PRDs feature WIP - needs R2 integration", { 
    status: 200 
  });
}