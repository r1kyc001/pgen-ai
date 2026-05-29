export async function onRequest(context) {
    const { request, env } = context;
    const { PRD_BUCKET } = env;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST", "Access-Control-Allow-Headers": "Content-Type" } });
    }

    if (request.method === "POST") {
        const { id, content } = await request.json();
        await PRD_BUCKET.put(`prds/${id}.md`, content);
        return new Response(JSON.stringify({ success: true, id }), { headers: { "Content-Type": "application/json" } });
    }

    if (request.method === "GET") {
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop();
        if (id && id !== "saved-prds") {
            const object = await PRD_BUCKET.get(`prds/${id}.md`);
            if (!object) return new Response("Not found", { status: 404 });
            return new Response(await object.text(), { headers: { "Content-Type": "text/markdown" } });
        }
        const listed = await PRD_BUCKET.list({ prefix: 'prds/' });
        return new Response(JSON.stringify({ prds: listed.objects.map(o => o.key) }), { headers: { "Content-Type": "application/json" } });
    }

    return new Response("Method Not Allowed", { status: 405 });
}
