import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface DoubanSubject {
  id: string;
  title: string;
  cover?: string;
  rate?: string;
  url?: string;
  imdbRating?: string | null;
  imdbUrl?: string | null;
}

interface DoubanRecommendResponse {
  subjects?: DoubanSubject[];
}

function buildImdbSearchUrl(title: string): string | null {
  if (!title) {
    return null;
  }

  return `https://www.imdb.com/find/?q=${encodeURIComponent(title)}&s=tt`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag') || '热门';
  const pageLimit = searchParams.get('page_limit') || '20';
  const pageStart = searchParams.get('page_start') || '0';
  const type = searchParams.get('type') || 'movie'; // movie or tv

  try {
    const url = `https://movie.douban.com/j/search_subjects?type=${type}&tag=${encodeURIComponent(tag)}&sort=recommend&page_limit=${pageLimit}&page_start=${pageStart}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://movie.douban.com/',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Douban API returned ${response.status}`);
    }

    const data = await response.json() as DoubanRecommendResponse;

    // 转换图片链接使用代理，并补充 IMDb 搜索链接（Edge 兼容，无 Node.js 依赖）
    if (data.subjects && Array.isArray(data.subjects)) {
      data.subjects = data.subjects.map((item) => ({
        ...item,
        cover: item.cover ? `/api/douban/image?url=${encodeURIComponent(item.cover)}` : item.cover,
        imdbUrl: buildImdbSearchUrl(item.title),
      }));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Douban API error:', error);
    return NextResponse.json(
      { subjects: [], error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
