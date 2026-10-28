import { invalid } from '../utils/httpError.js'

export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {})

    if (!result.success) {
      const fields = {}

      for (const issue of result.error.issues) {
        const key = issue.path.join('.')

        if (!fields[key]) fields[key] = issue.message
      }

      throw invalid(result.error.issues[0].message, fields)
    }

    req.validated = { ...req.validated, [source]: result.data }
    next()
  }
