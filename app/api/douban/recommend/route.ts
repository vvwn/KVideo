import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface DoubanSubject {
  id: string;
  title: string;
  cover?: string;
  rate?: string;
  url?: string;
}

interface DoubanRecommendResponse {
  subjects?: DoubanSubject[];
}

interface TmdbInfo {
  tmdbRating: string | null;
  tmdbUrl: string | null;
}

interface TmdbSearchItem {
  id: number;
  vote_average?: number;
}

interface TmdbSearchResponse {
  results?: TmdbSearchItem[];
}

function normalizeTitle(title: string): string {
  return title
    .replace(/[·•・:：\-—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function searchTmdbByTitle(
  query: string,
  searchType: 'movie' | 'tv',
  tmdbReadAccessToken?: string,
  tmdbApiKey?: string,
): Promise<TmdbSearchItem | null> {
  const urls: Array<{ url: URL; headers: HeadersInit }> = [];

  const appendSearchUrl = (language?: string, useBearer = false, useApiKey = false) => {
    const url = new URL(`https://api.themoviedb.org/3/search/${searchType}`);
    url.searchParams.set('query', query);
    url.searchParams.set('include_adult', 'false');
    if (language) {
      url.searchParams.set('language', language);
    }

    const headers: HeadersInit = {
      Accept: 'application/json',
    };

    if (useBearer && tmdbReadAccessToken) {
      headers.Authorization = `Bearer ${tmdbReadAccessToken}`;
    } else if (useApiKey && tmdbApiKey) {
      url.searchParams.set('api_key', tmdbApiKey);
    }

    urls.push({ url, headers });
  };

  if (tmdbReadAccessToken) {
    appendSearchUrl('zh-CN', true, false);
    appendSearchUrl(undefined, true, false);
  }
  if (tmdbApiKey) {
    appendSearchUrl('zh-CN', false, true);
    appendSearchUrl(undefined, false, true);
  }

  for (const request of urls) {
    const response = await fetch(request.url, {
      headers: request.headers,
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      continue;
    }

    const data = await response.json() as TmdbSearchResponse;
    const firstResult = data.results?.[0];
    if (firstResult?.id) {
      return firstResult;
    }
  }

  return null;
}

async function fetchTmdbInfo(title: string, type: string): Promise<TmdbInfo> {
  const tmdbApiKey = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const tmdbReadAccessToken = process.env.TMDB_API_READ_ACCESS_TOKEN || process.env.NEXT_PUBLIC_TMDB_API_READ_ACCESS_TOKEN;

  if ((!tmdbApiKey && !tmdbReadAccessToken) || !title) {
    return {
      tmdbRating: null,
      tmdbUrl: null,
    };
  }

  try {
    const searchType = type === 'tv' ? 'tv' : 'movie';
    const normalizedTitle = normalizeTitle(title);
    const firstResult = await searchTmdbByTitle(
      normalizedTitle,
      searchType,
      tmdbReadAccessToken,
      tmdbApiKey,
    );

    if (firstResult?.id) {
      const voteAverage = typeof firstResult.vote_average === 'number'
        ? firstResult.vote_average.toFixed(1)
        : null;

      return {
        tmdbRating: voteAverage,
        tmdbUrl: `https://www.themoviedb.org/${searchType}/${firstResult.id}`,
      };
    }

    return {
      tmdbRating: null,
      tmdbUrl: null,
    };
  } catch {
    return {
      tmdbRating: null,
      tmdbUrl: null,
    };
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

    // 转换图片链接使用代理，并补充 TMDB 评分
    if (data.subjects && Array.isArray(data.subjects)) {
      data.subjects = await Promise.all(data.subjects.map(async (item) => {
        const tmdbInfo = await fetchTmdbInfo(item.title, type);
        return {
          ...item,
          cover: item.cover ? `/api/douban/image?url=${encodeURIComponent(item.cover)}` : item.cover,
          ...tmdbInfo,
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
