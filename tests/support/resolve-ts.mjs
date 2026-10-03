export async function resolve(specifier, context, next) {
  if (!specifier.startsWith('.') || /\.[cm]?[jt]s$/.test(specifier))
    return next(specifier, context)
  try {
    return await next(specifier, context)
  }
  catch {
    return next(`${specifier}.ts`, context)
  }
}
