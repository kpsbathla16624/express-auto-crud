export function autoCRUD(app, model, baseRoute, options = {}) {
    // Default options
    const opts = {
        pagination: {
            enabled: options.pagination?.enabled !== false,
            defaultLimit: options.pagination?.defaultLimit || 20,
            maxLimit: options.pagination?.maxLimit || 100,
        },
        sort: {
            default: options.sort?.default || '-createdAt',
            allowed: options.sort?.allowed || [],
        },
        filter: {
            enabled: options.filter?.enabled !== false,
            allowed: options.filter?.allowed || [],
        },
        middleware: options.middleware || {},
        projection: options.projection || {},
        populate: options.populate || [],
        validateBody: options.validateBody,
        hooks: options.hooks || {},
    };
    // Helper: Build filter object from query params
    const buildFilter = (query) => {
        const filter = {};
        if (!opts.filter.enabled)
            return filter;
        for (const key in query) {
            if (['page', 'limit', 'sort'].includes(key))
                continue;
            if (opts.filter.allowed.length === 0 || opts.filter.allowed.includes(key)) {
                filter[key] = query[key];
            }
        }
        return filter;
    };
    // Helper: Apply sort
    const applySort = (query) => {
        if (query.sort) {
            const sortField = query.sort.replace(/^-/, '');
            if (opts.sort.allowed.length > 0 && !opts.sort.allowed.includes(sortField)) {
                return opts.sort.default;
            }
            return query.sort;
        }
        return opts.sort.default;
    };
    // Helper: Error response
    const errorResponse = (res, message, status = 500) => {
        res.status(status).json({ error: true, message });
    };
    // Get all middlewares (all + specific)
    const getMiddlewares = (specific) => {
        return [...(opts.middleware.all || []), ...(specific || [])];
    };
    // ============================================
    // Route 1: LIST - GET /resource
    // ============================================
    app.get(baseRoute, ...getMiddlewares(opts.middleware.list), async (req, res) => {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(opts.pagination.maxLimit, parseInt(req.query.limit) || opts.pagination.defaultLimit);
            const filter = buildFilter(req.query);
            const sort = applySort(req.query);
            const skip = (page - 1) * limit;
            let query = model.find(filter, opts.projection).sort(sort);
            // Apply populate
            if (opts.populate.length > 0) {
                opts.populate.forEach(field => {
                    query = query.populate(field);
                });
            }
            const [data, total] = await Promise.all([
                opts.pagination.enabled ? query.skip(skip).limit(limit).exec() : query.exec(),
                model.countDocuments(filter)
            ]);
            if (opts.pagination.enabled) {
                const totalPages = Math.ceil(total / limit);
                const response = {
                    data,
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages,
                        hasNextPage: page < totalPages
                    }
                };
                res.json(response);
            }
            else {
                res.json({ data });
            }
        }
        catch (error) {
            errorResponse(res, error.message || 'Failed to fetch documents');
        }
    });
    // ============================================
    // Route 2: GET ONE - GET /resource/:id
    // ============================================
    app.get(`${baseRoute}/:id`, ...getMiddlewares(opts.middleware.getOne), async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return errorResponse(res, 'ID is required', 400);
            }
            let query = model.findById(id, opts.projection);
            // Apply populate
            if (opts.populate.length > 0) {
                opts.populate.forEach(field => {
                    query = query.populate(field);
                });
            }
            const doc = await query.exec();
            if (!doc) {
                return errorResponse(res, 'Document not found', 404);
            }
            res.json(doc);
        }
        catch (error) {
            errorResponse(res, error.message || 'Failed to fetch document');
        }
    });
    // ============================================
    // Route 3: CREATE - POST /resource
    // ============================================
    app.post(baseRoute, ...getMiddlewares(opts.middleware.create), async (req, res) => {
        try {
            let data = req.body;
            // Validate body
            if (opts.validateBody) {
                const isValid = await opts.validateBody(data);
                if (!isValid) {
                    return errorResponse(res, 'Validation failed', 400);
                }
            }
            // Before create hook
            if (opts.hooks.beforeCreate) {
                await opts.hooks.beforeCreate(req, data);
            }
            const doc = await model.create(data);
            // After create hook
            if (opts.hooks.afterCreate) {
                await opts.hooks.afterCreate(req, doc);
            }
            res.status(201).json(doc);
        }
        catch (error) {
            errorResponse(res, error.message || 'Failed to create document', 400);
        }
    });
    // ============================================
    // Route 4: UPDATE - PUT /resource/:id
    // ============================================
    app.put(`${baseRoute}/:id`, ...getMiddlewares(opts.middleware.update), async (req, res) => {
        try {
            const { id } = req.params;
            let data = req.body;
            if (!id) {
                return errorResponse(res, 'ID is required', 400);
            }
            // Note: Skip validateBody for updates since partial updates are allowed
            // Mongoose schema validators will still run with runValidators: true
            // Before update hook
            if (opts.hooks.beforeUpdate) {
                await opts.hooks.beforeUpdate(req, data);
            }
            const doc = await model.findByIdAndUpdate(id, data, {
                new: true,
                runValidators: true
            });
            if (!doc) {
                return errorResponse(res, 'Document not found', 404);
            }
            // After update hook
            if (opts.hooks.afterUpdate) {
                await opts.hooks.afterUpdate(req, doc);
            }
            res.json(doc);
        }
        catch (error) {
            errorResponse(res, error.message || 'Failed to update document', 400);
        }
    });
    // ============================================
    // Route 5: DELETE - DELETE /resource/:id
    // ============================================
    app.delete(`${baseRoute}/:id`, ...getMiddlewares(opts.middleware.delete), async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return errorResponse(res, 'ID is required', 400);
            }
            // Before delete hook
            if (opts.hooks.beforeDelete) {
                await opts.hooks.beforeDelete(req, id);
            }
            const doc = await model.findByIdAndDelete(id);
            if (!doc) {
                return errorResponse(res, 'Document not found', 404);
            }
            // After delete hook
            if (opts.hooks.afterDelete) {
                await opts.hooks.afterDelete(req, id);
            }
            res.json({
                success: true,
                message: 'Document deleted successfully',
                id
            });
        }
        catch (error) {
            errorResponse(res, error.message || 'Failed to delete document');
        }
    });
}
