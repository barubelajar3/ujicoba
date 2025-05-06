export default {
  async fetch(request, env, ctx) {
    if (request.method === 'POST' && new URL(request.url).pathname === '/upload') {
      try {
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
          return new Response(JSON.stringify({ error: 'Invalid content type' }), { status: 400 });
        }

        const formData = await request.formData();
        const file = formData.get('image');
        if (!file || typeof file === 'string') {
          return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
        }

        const ext = file.name.split('.').pop();
        const filename = `${crypto.randomUUID()}.${ext}`;
        await env.UPLOADS_BUCKET.put(filename, file.stream(), {
          httpMetadata: { contentType: file.type }
        });

        const publicUrl = `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${filename}`;
        return new Response(JSON.stringify({ url: publicUrl }), {
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};
