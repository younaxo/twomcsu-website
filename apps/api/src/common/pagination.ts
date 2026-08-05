import { BadRequestException } from '@nestjs/common';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_SEARCH_LENGTH = 100;

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export function normalizePagination(query: PaginationQuery = {}): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
  const rawLimit = Number(query.limit) || DEFAULT_PAGE_SIZE;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_PAGE_SIZE);

  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);

  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export function assertSearchLength(query: string | undefined): string {
  const value = (query ?? '').trim();

  if (value.length > MAX_SEARCH_LENGTH) {
    throw new BadRequestException(`Поисковый запрос не длиннее ${MAX_SEARCH_LENGTH} символов`);
  }

  return value;
}
