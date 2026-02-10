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

interface OmdbResponse {
  Response?: string;
  imdbRating?: string;
  imdbID?: string;
}

async function fetchImdbMeta(title: string, type: string): Promise<{ rating: string | null; imdbUrl: string | null }> {
  const omdbApiKey = process.env.OMDB_API_KEY;

  if (!omdbApiKey || !title) {
    return { rating: null, imdbUrl: null };
  }

  try {
    const omdbType = type === 'tv' ? 'series' : 'movie';
    const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(omdbApiKey)}&t=${encodeURIComponent(title)}&type=${omdbType}`;
    const response = await fetch(url, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      return { rating: null, imdbUrl: null };
    }

    const data = await response.json() as OmdbResponse;
    if (data?.Response !== 'True') {
      return { rating: null, imdbUrl: null };
    }

    const rating = data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : null;
    const imdbUrl = data.imdbID ? `https://www.imdb.com/title/${data.imdbID}/` : null;

    return { rating, imdbUrl };
  } catch {
    return { rating: null, imdbUrl: null };
  }
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

    // 转换图片链接使用代理，并补充 IMDb 评分与链接
    if (data.subjects && Array.isArray(data.subjects)) {
      data.subjects = await Promise.all(data.subjects.map(async (item) => {
        const imdbMeta = await fetchImdbMeta(item.title, type);

        return {
          ...item,
          cover: item.cover ? `/api/douban/image?url=${encodeURIComponent(item.cover)}` : item.cover,
          imdbRating: imdbMeta.rating,
          imdbUrl: imdbMeta.imdbUrl,
        };
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
