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

interface ImdbInfo {
  imdbRating: string | null;
  imdbUrl: string | null;
}

interface OmdbSearchItem {
  imdbID?: string;
}

interface OmdbSearchResponse {
  Response?: string;
  Search?: OmdbSearchItem[];
}

interface OmdbRatingResponse {
  Response?: string;
  imdbRating?: string;
  imdbID?: string;
}

interface TmdbSearchItem {
  original_title?: string;
  title?: string;
  original_name?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
}

interface TmdbSearchResponse {
  results?: TmdbSearchItem[];
}

interface OmdbLookupInput {
  omdbTitle: string;
  year: string | null;
}

function extractYear(date?: string): string | null {
  if (!date || date.length < 4) {
    return null;
  }

  const year = date.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

async function resolveOmdbLookupInput(title: string, type: string): Promise<OmdbLookupInput> {
  const tmdbApiKey = process.env.TMDB_API_KEY;
  const tmdbReadAccessToken = process.env.TMDB_API_READ_ACCESS_TOKEN;

  if ((!tmdbApiKey && !tmdbReadAccessToken) || !title) {
    return {
      omdbTitle: title,
      year: null,
    };
  }

  try {
    const searchType = type === 'tv' ? 'tv' : 'movie';
    const tmdbUrl = new URL(`https://api.themoviedb.org/3/search/${searchType}`);
    tmdbUrl.searchParams.set('query', title);
    tmdbUrl.searchParams.set('include_adult', 'false');
    tmdbUrl.searchParams.set('language', 'zh-CN');

    if (tmdbApiKey) {
      tmdbUrl.searchParams.set('api_key', tmdbApiKey);
    }

    const headers: HeadersInit = {};
    if (tmdbReadAccessToken) {
      headers.Authorization = `Bearer ${tmdbReadAccessToken}`;
    }

    const tmdbResponse = await fetch(tmdbUrl, {
      headers,
      next: { revalidate: 86400 },
    });

    if (!tmdbResponse.ok) {
      return {
        omdbTitle: title,
        year: null,
      };
    }

    const tmdbData = await tmdbResponse.json() as TmdbSearchResponse;
    const firstResult = tmdbData.results?.[0];

    if (!firstResult) {
      return {
        omdbTitle: title,
        year: null,
      };
    }

    const omdbTitle = firstResult.original_title
      || firstResult.original_name
      || firstResult.title
      || firstResult.name
      || title;

    const year = extractYear(firstResult.release_date) ?? extractYear(firstResult.first_air_date);

    return {
      omdbTitle,
      year,
    };
  } catch {
    return {
      omdbTitle: title,
      year: null,
    };
  }
}

async function fetchImdbInfo(title: string, type: string): Promise<ImdbInfo> {
  const omdbApiKey = process.env.OMDB_API_KEY;

  if (!omdbApiKey || !title) {
    return {
      imdbRating: null,
      imdbUrl: null,
    };
  }

  try {
    const lookupInput = await resolveOmdbLookupInput(title, type);

    const detailUrl = new URL('https://www.omdbapi.com/');
    detailUrl.searchParams.set('apikey', omdbApiKey);
    detailUrl.searchParams.set('t', lookupInput.omdbTitle);
    detailUrl.searchParams.set('type', type === 'tv' ? 'series' : 'movie');
    if (lookupInput.year) {
      detailUrl.searchParams.set('y', lookupInput.year);
    }

    const detailResponse = await fetch(detailUrl, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (detailResponse.ok) {
      const detailData = await detailResponse.json() as OmdbRatingResponse;
      if (detailData.Response === 'True' && detailData.imdbID) {
        return {
          imdbRating: detailData.imdbRating && detailData.imdbRating !== 'N/A' ? detailData.imdbRating : null,
          imdbUrl: `https://www.imdb.com/title/${detailData.imdbID}/`,
        };
      }
    }

    // Fallback: use search API when title match is not exact.
    const searchUrl = new URL('https://www.omdbapi.com/');
    searchUrl.searchParams.set('apikey', omdbApiKey);
    searchUrl.searchParams.set('s', lookupInput.omdbTitle);
    searchUrl.searchParams.set('type', type === 'tv' ? 'series' : 'movie');

    const searchResponse = await fetch(searchUrl, {
      next: { revalidate: 86400 },
    });

    if (!searchResponse.ok) {
      return {
        imdbRating: null,
        imdbUrl: null,
      };
    }

    const searchData = await searchResponse.json() as OmdbSearchResponse;
    const imdbID = searchData.Search?.[0]?.imdbID;

    if (!imdbID) {
      return {
        imdbRating: null,
        imdbUrl: null,
      };
    }

    const ratingUrl = new URL('https://www.omdbapi.com/');
    ratingUrl.searchParams.set('apikey', omdbApiKey);
    ratingUrl.searchParams.set('i', imdbID);

    const ratingResponse = await fetch(ratingUrl, {
      next: { revalidate: 86400 },
    });

    if (!ratingResponse.ok) {
      return {
        imdbRating: null,
        imdbUrl: `https://www.imdb.com/title/${imdbID}/`,
      };
    }

    const ratingData = await ratingResponse.json() as OmdbRatingResponse;
    const imdbRating = ratingData.Response === 'True' && ratingData.imdbRating && ratingData.imdbRating !== 'N/A'
      ? ratingData.imdbRating
      : null;

    return {
      imdbRating,
      imdbUrl: `https://www.imdb.com/title/${imdbID}/`,
    };
  } catch {
    return {
      imdbRating: null,
      imdbUrl: null,
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

    // 转换图片链接使用代理，并补充 IMDb 评分
    if (data.subjects && Array.isArray(data.subjects)) {
      data.subjects = await Promise.all(data.subjects.map(async (item) => {
        const imdbInfo = await fetchImdbInfo(item.title, type);
        return {
          ...item,
          cover: item.cover ? `/api/douban/image?url=${encodeURIComponent(item.cover)}` : item.cover,
          ...imdbInfo,
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
