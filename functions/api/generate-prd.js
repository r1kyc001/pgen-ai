const getPRDPrompt = (idea) => `You are a world-class Product Manager and AI Architect specializing in creating detailed Product Requirements Documents (PRDs) for software engineering teams.

TASK: Create a comprehensive PRD for the following product idea. Also include a "Technical Architecture Recommendation" section.

IDEA: ${idea}

OUTPUT FORMAT (Markdown):
---
# PRD: [Product Name]
## 1. Objective
...
## Technical Architecture Recommendation
...
---
TONE: Professional, concise, actionable.`;

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { idea, llm_config } = body;
    
    if (!idea) return new Response("IDEA_REQUIRED", { status: 400 });
    
    const systemPrompt = getPRDPrompt(idea);
    
    const response = await fetch(llm_config.endpoint, {
      method: "POST",
      headers: {
        "Authorization": llm_config.api_key.startsWith('Bearer') ? llm_config.api_key : `Bearer ${llm_config.api_key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: llm_config.model || "coding",
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
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
