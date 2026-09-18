/**
 * Cloudflare Worker API for Erfan Jalali's Personal Portfolio
 * Serves backend endpoints for GitHub data caching, contact form processing,
 * and health diagnostics without exposing private tokens to the client.
 */

export interface Env {
  GITHUB_TOKEN?: string;
  GITHUB_USERNAME?: string;
  CONTACT_WEBHOOK_URL?: string;
  ENVIRONMENT?: string;
}

const DEFAULT_USERNAME = 'erfanjalali2007';

const ALLOWED_ORIGINS = [
  'https://erfanjalali2007.github.io',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8787',
];

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.github.io') ? origin : '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const cors = getCorsHeaders(request);

    // Handle preflight CORS request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: cors,
      });
    }

    const username = env.GITHUB_USERNAME || DEFAULT_USERNAME;

    try {
      // 1. Health check
      if (url.pathname === '/api/health' || url.pathname === '/') {
        return jsonResponse(
          {
            status: 'ok',
            service: 'erfanjalali-portfolio-worker',
            version: '1.0.0',
            environment: env.ENVIRONMENT || 'production',
            timestamp: new Date().toISOString(),
          },
          200,
          cors
        );
      }

      // 2. GitHub Profile Information & Statistics
      if (url.pathname === '/api/github/profile' && request.method === 'GET') {
        const ghHeaders: Record<string, string> = {
          'User-Agent': 'ErfanJalali-Portfolio-Worker/1.0',
          Accept: 'application/vnd.github.v3+json',
        };

        // If server-side secret GITHUB_TOKEN is configured, use it to bypass unauthenticated rate limits
        if (env.GITHUB_TOKEN) {
          ghHeaders['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
        }

        const ghRes = await fetch(`https://api.github.com/users/${username}`, {
          headers: ghHeaders,
          cf: { cacheTtl: 3600, cacheEverything: true },
        } as RequestInit);

        if (!ghRes.ok) {
          return jsonResponse(
            { error: 'Failed to fetch GitHub profile', status: ghRes.status },
            ghRes.status,
            cors
          );
        }

        const profile: any = await ghRes.json();

        return jsonResponse(
          {
            username: profile.login,
            name: profile.name,
            bio: profile.bio,
            avatarUrl: profile.avatar_url,
            profileUrl: profile.html_url,
            publicRepos: profile.public_repos,
            followers: profile.followers,
            following: profile.following,
            location: profile.location,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
          },
          200,
          {
            ...cors,
            'Cache-Control': 'public, max-age=1800, s-maxage=3600',
          }
        );
      }

      // 3. GitHub Repositories
      if (url.pathname === '/api/github/repos' && request.method === 'GET') {
        const ghHeaders: Record<string, string> = {
          'User-Agent': 'ErfanJalali-Portfolio-Worker/1.0',
          Accept: 'application/vnd.github.v3+json',
        };

        if (env.GITHUB_TOKEN) {
          ghHeaders['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
        }

        const ghRes = await fetch(
          `https://api.github.com/users/${username}/repos?sort=updated&per_page=12&type=owner`,
          {
            headers: ghHeaders,
            cf: { cacheTtl: 1800, cacheEverything: true },
          } as RequestInit
        );

        if (!ghRes.ok) {
          return jsonResponse(
            { error: 'Failed to fetch GitHub repos', status: ghRes.status },
            ghRes.status,
            cors
          );
        }

        const rawRepos: any = await ghRes.json();
        const repos = Array.isArray(rawRepos)
          ? rawRepos.map((r: any) => ({
              id: r.id,
              name: r.name,
              fullName: r.full_name,
              description: r.description,
              htmlUrl: r.html_url,
              stars: r.stargazers_count,
              forks: r.forks_count,
              language: r.language,
              topics: r.topics || [],
              updatedAt: r.updated_at,
              isFork: r.fork,
            }))
          : [];

        return jsonResponse(repos, 200, {
          ...cors,
          'Cache-Control': 'public, max-age=1800, s-maxage=3600',
        });
      }

      // 4. Secure Contact Form Submission
      if (url.pathname === '/api/contact' && request.method === 'POST') {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ error: 'Invalid JSON payload' }, 400, cors);
        }

        const { name, email, message, subject } = body || {};

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
          return jsonResponse({ error: 'Name is required' }, 400, cors);
        }

        if (!email || typeof email !== 'string' || !email.includes('@')) {
          return jsonResponse({ error: 'A valid email address is required' }, 400, cors);
        }

        if (!message || typeof message !== 'string' || message.trim().length < 5) {
          return jsonResponse({ error: 'Message must be at least 5 characters' }, 400, cors);
        }

        // Forward to secure webhook if configured (e.g. Discord, Slack, or webhook relay)
        if (env.CONTACT_WEBHOOK_URL) {
          try {
            await fetch(env.CONTACT_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: `**New Portfolio Message from ${name.trim()}**`,
                embeds: [
                  {
                    title: subject ? `Subject: ${subject}` : 'Portfolio Contact Inquiry',
                    fields: [
                      { name: 'Name', value: name.trim().slice(0, 256), inline: true },
                      { name: 'Email', value: email.trim().slice(0, 256), inline: true },
                      { name: 'Message', value: message.trim().slice(0, 1024) },
                    ],
                    color: 0xe11d48, // Liquid ruby color
                    timestamp: new Date().toISOString(),
                  },
                ],
              }),
            });
          } catch (webhookErr) {
            console.error('Webhook notification error:', webhookErr);
          }
        }

        return jsonResponse(
          {
            success: true,
            message: 'Your message has been received securely. Thank you for reaching out!',
          },
          200,
          cors
        );
      }

      // 404 Not Found
      return jsonResponse({ error: 'Endpoint not found' }, 404, cors);
    } catch (err: any) {
      return jsonResponse(
        {
          error: 'Internal Server Error',
          message: err?.message || 'An unexpected error occurred',
        },
        500,
        cors
      );
    }
  },
};
