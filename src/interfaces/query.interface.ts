/* eslint-disable @typescript-eslint/no-explicit-any */

// 🔹 Query Params from Request (req.query)
export interface IQueryParams {
  searchTerm?: string;

  page?: number | string;
  limit?: number | string;

  sortBy?: string;
  sortOrder?: "asc" | "desc";

  fields?: string; // id,name,user.name
  include?: string; // user,course

  [key: string]: any; // dynamic filters
}

// 🔹 Config for QueryBuilder
export interface IQueryConfig {
  searchableFields?: string[];
  filterableFields?: string[];
}

// 🔹 Response Meta
export interface IQueryMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 🔹 Final Response Structure
export interface IQueryResult<T> {
  data: T[];
  meta: IQueryMeta;
}

// ================================
// 🔻 Prisma Generic Type Helpers
// ================================

// 🔹 Generic WHERE condition
export type PrismaWhereConditions = {
  AND?: Record<string, unknown>[];
  OR?: Record<string, unknown>[];
  NOT?: Record<string, unknown>[];
  [key: string]: unknown;
};

// 🔹 String filter (Prisma-like)
export interface PrismaStringFilter {
  equals?: string;
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  mode?: "default" | "insensitive";
  in?: string[];
  notIn?: string[];
  not?: string | PrismaStringFilter;
}

// 🔹 Number filter
export interface PrismaNumberFilter {
  equals?: number;
  lt?: number;
  lte?: number;
  gt?: number;
  gte?: number;
  in?: number[];
  notIn?: number[];
  not?: number | PrismaNumberFilter;
}

// 🔹 Prisma FindMany Args (simplified)
export interface PrismaFindManyArgs {
  where?: PrismaWhereConditions;
  include?: Record<string, unknown>;
  select?: Record<string, boolean | Record<string, unknown>>;
  orderBy?: any;
  skip?: number;
  take?: number;
}

// 🔹 Prisma Count Args
export interface PrismaCountArgs {
  where?: PrismaWhereConditions;
}

// 🔹 Prisma Model Delegate (Generic Model)
export interface PrismaModelDelegate {
  findMany(args?: any): Promise<any[]>;
  count(args?: any): Promise<number>;
  aggregate?(args?: any): Promise<any>;
}
