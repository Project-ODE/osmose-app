import { QueryParams } from './type.ts';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';

export function encodeQueryParams(queryParams?: QueryParams): string {
  if (!queryParams) return '';
  return encodeURI(`?${ Object.entries(queryParams).map(([ key, value ]) => `${ key }=${ value }`).join('&') }`);
}

export function getErrorMessage(error: FetchBaseQueryError | SerializedError | string | undefined): string | undefined {
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  if ((error as SerializedError).message) return (error as SerializedError).message;
  if ((error as FetchBaseQueryError).status === 500) return '[500] Internal server error';
  const data = (error as FetchBaseQueryError).data as any;
  if (!data) return (error as any).error;
  const detail = Object.prototype.hasOwnProperty.call(data, 'detail') ? data['detail'] : null;
  if (detail) return detail;

  try {
    if (typeof data === 'object')
      return JSON.stringify(data);
    return data
  } catch {
    return data;
  }
}

export function getNewItemID(items?: { id: number }[]) {
  return Math.min(0, ...(items ?? []).map(r => r.id)) - 1;
}

function downloadFile(filename: string, type: string, text: string) {
  const url = URL.createObjectURL(new File([ text ], filename, { type }));
  // Using <a>-linking trick https://stackoverflow.com/a/19328891/2730032
  const a = document.createElement('a');
  a.style.display = "none";
  a.href = url;
  a.type = type;
  a.download = filename;
  if (!document.body) throw new Error("Unexpectedly missing <body>");
  document.body.appendChild(a);
  a.click();
}

export async function downloadResponseHandler(response: Response) {
  // TODO: reject errors correctly (catchable) - like a standard API error
  if (response.status !== 200) return `[${ response.status }] ${ response.statusText }`;
  const filenameRegExp = /filename=([a-zA-Z_1-9.]*)/.exec(response.url)
  if (!filenameRegExp || filenameRegExp.length < 2) throw new Error("No filename provided");
  const filename = filenameRegExp[1];
  const type = response.headers.get('content-type')
  if (!type) throw new Error('No file type provided')
  downloadFile(filename, type, await response.text())
}