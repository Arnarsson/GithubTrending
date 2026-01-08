import feed from '@/app/data/feed.json';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get('page') || '1'), 1);
  const limit = Math.max(Number(searchParams.get('limit') || '20'), 1);
  const feedUrl = process.env.FEED_URL;

  if (feedUrl) {
    const upstream = new URL(feedUrl);
    upstream.searchParams.set('page', String(page));
    upstream.searchParams.set('limit', String(limit));
    const response = await fetch(upstream.toString(), { cache: 'no-store' });
    if (response.ok) {
      const payload = await response.json();
      return Response.json(payload);
    }
  }

  const start = (page - 1) * limit;
  const end = start + limit;
  const repos = feed.repos.slice(start, end);

  return Response.json({
    updatedAt: feed.updatedAt,
    total: feed.repos.length,
    page,
    limit,
    repos
  });
}
