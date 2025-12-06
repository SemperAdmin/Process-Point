export const canonicalize = (obj: any): string => {
  const sorter = (value: any): any => {
    if (Array.isArray(value)) return value.map(sorter)
    if (value && typeof value === 'object') {
      const keys = Object.keys(value).sort()
      const sorted: Record<string, any> = {}
      for (const k of keys) sorted[k] = sorter(value[k])
      return sorted
    }
    return value
  }
  return JSON.stringify(sorter(obj))
}
