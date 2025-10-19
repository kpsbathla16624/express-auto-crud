import type { Express } from 'express';
import type { Model } from 'mongoose';
import type { AutoCrudOptions } from './types.js';
export declare function autoCRUD(app: Express, model: Model<any>, baseRoute: string, options?: AutoCrudOptions): void;
