import type { Request, Response, NextFunction, RequestHandler } from "express";
import { Document } from "mongoose";
export interface AutoCrudOptions {
  middleware?: {
    list?: RequestHandler[];
    getOne?: RequestHandler[];
    create?: RequestHandler[];
    update?: RequestHandler[];
    delete?: RequestHandler[];
    all?: RequestHandler[];
  };
  projection?: Record<string, number>;
  populate?: string[];
  validateBody?: (body: any) => boolean | Promise<boolean>;
  pagination?: { enabled?: boolean; defaultLimit?: number; maxLimit?: number };
  sort?: { default?: string; allowed?: string[] };
  filter?: { enabled?: boolean; allowed?: string[] };
  hooks?: {
    beforeCreate?: (req: Request, data: any) => Promise<void> | void;
    afterCreate?: (req: Request, doc: Document) => Promise<void> | void;
    beforeUpdate?: (req: Request, data: any) => Promise<void> | void;
    afterUpdate?: (req: Request, doc: Document) => Promise<void> | void;
    beforeDelete?: (req: Request, id: string) => Promise<void> | void;
    afterDelete?: (req: Request, id: string) => Promise<void> | void;
  };
}
export interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}
export interface ListResponse {
  data: any[];
  pagination: PaginationResult;
}
