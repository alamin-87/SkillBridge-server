/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  IQueryConfig,
  IQueryParams,
  IQueryResult,
  PrismaCountArgs,
  PrismaFindManyArgs,
  PrismaModelDelegate,
  PrismaNumberFilter,
  PrismaStringFilter,
  PrismaWhereConditions,
} from "../interfaces/query.interface";

export class QueryBuilder<
  T,
  TWhereInput = Record<string, unknown>,
  TInclude = Record<string, unknown>,
> {
  private query: PrismaFindManyArgs;
  private countQuery: PrismaCountArgs;

  private page = 1;
  private limit = 10;
  private skip = 0;

  private selectFields: Record<string, any> | undefined;

  constructor(
    private model: PrismaModelDelegate,
    private queryParams: IQueryParams,
    private config: IQueryConfig = {},
  ) {
    // 🔒 Soft delete protection by default
    this.query = {
      where: { isDeleted: false },
      include: {},
      orderBy: {},
      skip: 0,
      take: 10,
    };

    this.countQuery = {
      where: { isDeleted: false },
    };
  }

  // 🔍 SEARCH
  search(): this {
    const { searchTerm } = this.queryParams;
    const { searchableFields } = this.config;

    if (searchTerm && searchableFields?.length) {
      const conditions = searchableFields.map((field: string) => {
        const stringFilter: PrismaStringFilter = {
          contains: searchTerm,
          mode: "insensitive",
        };

        if (field.includes(".")) {
          const parts = field.split(".");

          if (parts.length === 2) {
            const [rel, key] = parts as [string, string];
            return { [rel]: { [key]: stringFilter } };
          }

          if (parts.length === 3) {
            const [rel, nested, key] = parts as [string, string, string];
            return {
              [rel]: {
                some: {
                  [nested]: { [key]: stringFilter },
                },
              },
            };
          }
        }

        return { [field]: stringFilter };
      });

      (this.query.where as PrismaWhereConditions).OR = conditions;
      (this.countQuery.where as PrismaWhereConditions).OR = conditions;
    }

    return this;
  }

  // 🎯 FILTER
  filter(): this {
    const { filterableFields } = this.config;

    const excluded = [
      "searchTerm",
      "page",
      "limit",
      "sortBy",
      "sortOrder",
      "fields",
      "include",
    ];

    const filters: Record<string, any> = {};

    Object.keys(this.queryParams).forEach((key) => {
      if (!excluded.includes(key)) {
        filters[key] = this.queryParams[key];
      }
    });

    const queryWhere = this.query.where as Record<string, any>;
    const countWhere = this.countQuery.where as Record<string, any>;

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === "") return;

      const isAllowed =
        !filterableFields ||
        filterableFields.length === 0 ||
        filterableFields.includes(key);

      if (!isAllowed) return;

      // nested
      if (key.includes(".")) {
        const [rel, nested] = key.split(".") as [string, string];
        queryWhere[rel] = { [nested]: this.parseFilterValue(value) };
        countWhere[rel] = { [nested]: this.parseFilterValue(value) };
        return;
      }

      // range
      if (typeof value === "object" && !Array.isArray(value)) {
        queryWhere[key] = this.parseRangeFilter(value);
        countWhere[key] = this.parseRangeFilter(value);
        return;
      }

      queryWhere[key] = this.parseFilterValue(value);
      countWhere[key] = this.parseFilterValue(value);
    });

    return this;
  }

  // 📄 PAGINATION
  paginate(): this {
    this.page = Number(this.queryParams.page) || 1;
    this.limit = Number(this.queryParams.limit) || 10;
    this.skip = (this.page - 1) * this.limit;

    this.query.skip = this.skip;
    this.query.take = this.limit;

    return this;
  }

  // ⚡ MULTI SORT
  sort(): this {
    const sortParam = this.queryParams.sortBy as string;

    if (!sortParam) {
      this.query.orderBy = { createdAt: "desc" };
      return this;
    }

    const fields = sortParam.split(",");

    this.query.orderBy = fields.map((field: string) => {
      const order = field.startsWith("-") ? "desc" : "asc";
      const clean = field.replace("-", "");

      if (clean.includes(".")) {
        const [rel, key] = clean.split(".") as [string, string];
        return { [rel]: { [key]: order } };
      }

      return { [clean]: order };
    });

    return this;
  }

  // 🧬 FIELD SELECTION (NESTED)
  fields(): this {
    const param = this.queryParams.fields;

    if (!param || typeof param !== "string") return this;

    const select: Record<string, any> = {};

    param.split(",").forEach((field: string) => {
      if (field.includes(".")) {
        const [rel, key] = field.split(".") as [string, string];
        if (!select[rel]) select[rel] = { select: {} };
        select[rel].select[key] = true;
      } else {
        select[field] = true;
      }
    });

    this.query.select = select;
    delete this.query.include;

    return this;
  }

  // 🔗 INCLUDE
  include(rel: TInclude): this {
    if (this.selectFields) return this;

    this.query.include = {
      ...(this.query.include as object),
      ...(rel as object),
    };

    return this;
  }

  // 🔥 DYNAMIC INCLUDE
  dynamicInclude(
    includeConfig: Record<string, any>,
    defaultInclude?: string[],
  ): this {
    if (this.selectFields) return this;

    if (this.queryParams.include === "all") {
      this.query.include = includeConfig;
      return this;
    }

    const result: Record<string, any> = {};

    defaultInclude?.forEach((key) => {
      if (includeConfig[key]) result[key] = includeConfig[key];
    });

    const param = this.queryParams.include as string;

    if (param) {
      param.split(",").forEach((key: string) => {
        if (includeConfig[key]) result[key] = includeConfig[key];
      });
    }

    this.query.include = {
      ...(this.query.include as object),
      ...result,
    };

    return this;
  }

  // 🧩 WHERE MERGE
  where(condition: TWhereInput): this {
    this.query.where = this.deepMerge(this.query.where, condition);
    this.countQuery.where = this.deepMerge(this.countQuery.where, condition);
    return this;
  }

  // 🚀 EXECUTE
  async execute(): Promise<IQueryResult<T>> {
    const [total, data] = await Promise.all([
      this.model.count(this.countQuery as any),
      this.model.findMany(this.query as any),
    ]);

    return {
      data,
      meta: {
        page: this.page,
        limit: this.limit,
        total,
        totalPages: Math.ceil(total / this.limit),
      },
    };
  }

  async count(): Promise<number> {
    return this.model.count(this.countQuery as any);
  }

  getQuery() {
    return this.query;
  }

  // 🛠️ HELPERS

  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (typeof source[key] === "object" && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  private parseFilterValue(value: any): any {
    if (value === "true") return true;
    if (value === "false") return false;

    if (!isNaN(Number(value))) return Number(value);

    if (Array.isArray(value)) {
      return { in: value.map((v) => this.parseFilterValue(v)) };
    }

    return value;
  }

  private parseRangeFilter(
    value: Record<string, any>,
  ): PrismaNumberFilter | PrismaStringFilter {
    const result: Record<string, any> = {};

    Object.entries(value).forEach(([op, val]) => {
      const parsed = !isNaN(Number(val)) ? Number(val) : val;

      result[op] = parsed;

      if (op === "contains" || op === "startsWith" || op === "endsWith") {
        result.mode = "insensitive";
      }
    });

    return result;
  }
}
