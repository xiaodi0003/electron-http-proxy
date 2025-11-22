import type { HttpPackage } from '../stores/global';

// HAR file format interface
export interface HarEntry {
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: Array<{ name: string; value: string }>;
    queryString: Array<{ name: string; value: string }>;
    postData?: {
      mimeType: string;
      text: string;
    };
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: Array<{ name: string; value: string }>;
    content: {
      size: number;
      mimeType: string;
      text?: string;
    };
  };
  startedDateTime: string;
  time: number;
}

export interface HarFile {
  log: {
    version: string;
    creator: {
      name: string;
      version: string;
    };
    entries: HarEntry[];
  };
}

// Parse HAR file and convert to HttpPackage format
export function parseHarFile(harContent: string): HttpPackage[] {
  try {
    const har: HarFile = JSON.parse(harContent);
    
    if (!har.log || !har.log.entries) {
      throw new Error('Invalid HAR file format');
    }

    return har.log.entries.map((entry, index) => {
      // Convert headers array to object
      const reqHeaders: Record<string, string> = {};
      entry.request.headers.forEach(h => {
        reqHeaders[h.name] = h.value;
      });

      const resHeaders: Record<string, string> = {};
      entry.response.headers.forEach(h => {
        resHeaders[h.name] = h.value;
      });

      // Build request object
      const req = {
        method: entry.request.method,
        url: entry.request.url,
        httpVersion: entry.request.httpVersion,
        headers: reqHeaders,
        body: entry.request.postData?.text || '',
      };

      // Build response object
      const res = {
        statusCode: entry.response.status,
        statusMessage: entry.response.statusText,
        httpVersion: entry.response.httpVersion,
        headers: resHeaders,
        body: entry.response.content.text || '',
      };

      return {
        id: `har-${Date.now()}-${index}`,
        req,
        res,
      };
    });
  } catch (error) {
    console.error('Failed to parse HAR file:', error);
    throw new Error('Failed to parse HAR file. Please check the file format.');
  }
}
