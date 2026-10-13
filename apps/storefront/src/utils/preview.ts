type QueryValue = string | string[] | undefined;

function first(value: QueryValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function getPreviewToken(query: Record<string, QueryValue>): string | undefined {
  return first(query.token);
}

export function isPreviewRequested(query: Record<string, QueryValue>): boolean {
  return first(query.preview) === 'true';
}

export function isEmbeddedPreview(query: Record<string, QueryValue>): boolean {
  return first(query.embedded) === 'true';
}

export function getPreviewApiOptions(query: Record<string, QueryValue>): { token?: string } | undefined {
  const token = getPreviewToken(query);
  return token ? { token } : undefined;
}

export function buildPreviewPath(path: string, query: Record<string, QueryValue>): string {
  const hashIndex = path.indexOf('#');
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : '';
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const queryIndex = pathWithoutHash.indexOf('?');
  const basePath = queryIndex >= 0 ? pathWithoutHash.slice(0, queryIndex) : pathWithoutHash;
  const params = new URLSearchParams(queryIndex >= 0 ? pathWithoutHash.slice(queryIndex + 1) : '');

  if (isPreviewRequested(query)) params.set('preview', 'true');
  if (isEmbeddedPreview(query)) params.set('embedded', 'true');

  const token = getPreviewToken(query);
  if (token) params.set('token', token);

  const qs = params.toString();
  return `${basePath}${qs ? `?${qs}` : ''}${hash}`;
}
