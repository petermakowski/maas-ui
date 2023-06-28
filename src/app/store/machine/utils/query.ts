export function timeUntilStale(updatedAt: number, staleTime?: number): number {
  return Math.max(updatedAt + (staleTime || 0) - Date.now(), 0);
}

export const generateCallId = (options?: {} | null): string => {
  return options ? JSON.stringify(sortObjectKeys(options)) : "{}";
};

function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  return Object.keys(obj)
    .sort()
    .reduce((result, key) => {
      result[key] = sortObjectKeys(obj[key]);
      return result;
    }, {} as any);
}
