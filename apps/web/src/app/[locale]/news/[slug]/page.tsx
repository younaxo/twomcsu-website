import type { Metadata } from 'next';
import { NewsArticleClient } from './news-article-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

async function resolveParams(params: PageProps['params']) {
  return await Promise.resolve(params);
}

async function fetchNews(slug: string) {
  try {
    const res = await fetch(`${API_URL}/news/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await resolveParams(params);
  const news = await fetchNews(slug);

  if (!news) {
    return { title: 'Новость не найдена' };
  }

  const title = news.metaTitle || news.title;
  const description = news.metaDescription || news.excerpt || undefined;
  const image = news.ogImage || news.coverImage || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: news.publishedAt ?? undefined,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await resolveParams(params);
  const news = await fetchNews(slug);

  const jsonLd = news
    ? {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: news.title,
        description: news.excerpt,
        image: news.coverImage ? [news.coverImage] : undefined,
        datePublished: news.publishedAt,
        dateModified: news.updatedAt,
        author: {
          '@type': 'Person',
          name: news.author?.username,
        },
      }
    : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <NewsArticleClient slug={slug} />
    </>
  );
}
