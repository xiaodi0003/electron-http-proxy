// HAR replay functionality

// Cache for indexed HAR data with LRU eviction
const harIndexCache = new Map();
const MAX_CACHE_SIZE = 200; // Limit cache size to prevent memory leak
const cacheAccessOrder = []; // Track access order for LRU

// Generate a normalized key for request matching
function generateRequestKey(method, url, body, ignoreParams) {
  const parsedUrl = parseUrl(url, ignoreParams);
  if (!parsedUrl) return null;
  
  // Create key from method, pathname, and sorted params (ignore origin/domain)
  let key = `${method}:${parsedUrl.pathname}`;
  
  const paramsStr = parsedUrl.params.toString();
  if (paramsStr) {
    key += `?${paramsStr}`;
  }
  
  // Add body hash for POST/PUT requests
  if ((method === 'POST' || method === 'PUT') && body && body !== 'null') {
    key += `:${body}`;
  }
  
  return key;
}

// Generate cache key from harData
function generateCacheKey(harData, ignoreParams) {
  // Use a stable identifier for the HAR data
  const entriesCount = harData?.log?.entries?.length || 0;
  const firstUrl = harData?.log?.entries?.[0]?.request?.url || '';
  const ignoreParamsStr = (ignoreParams || []).join(',');
  return `${entriesCount}:${firstUrl}:${ignoreParamsStr}`;
}

// Manage LRU cache
function updateCache(cacheKey, index) {
  // Remove from current position if exists
  const existingIndex = cacheAccessOrder.indexOf(cacheKey);
  if (existingIndex > -1) {
    cacheAccessOrder.splice(existingIndex, 1);
  }
  
  // Add to end (most recently used)
  cacheAccessOrder.push(cacheKey);
  harIndexCache.set(cacheKey, index);
  
  // Evict oldest if cache is too large
  if (cacheAccessOrder.length > MAX_CACHE_SIZE) {
    const oldestKey = cacheAccessOrder.shift();
    harIndexCache.delete(oldestKey);
  }
}

// Build index for HAR entries
function buildHarIndex(harData, ignoreParams) {
  const cacheKey = generateCacheKey(harData, ignoreParams);
  
  // Check if already indexed
  if (harIndexCache.has(cacheKey)) {
    // Update access order
    const existingIndex = cacheAccessOrder.indexOf(cacheKey);
    if (existingIndex > -1) {
      cacheAccessOrder.splice(existingIndex, 1);
      cacheAccessOrder.push(cacheKey);
    }
    return harIndexCache.get(cacheKey);
  }
  
  const index = new Map();
  
  if (!harData || !harData.log || !harData.log.entries) {
    return index;
  }
  
  const entries = harData.log.entries;
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const method = entry.request.method;
    const url = entry.request.url;
    
    // Normalize body for POST/PUT
    let bodyKey = '';
    if ((method === 'POST' || method === 'PUT') && entry.request.postData) {
      const entryBody = entry.request.postData.text || '';
      const entryHeaders = entry.request.headers;
      const contentType = getContentType(entryHeaders);
      
      if (contentType.includes('application/x-www-form-urlencoded')) {
        bodyKey = parseFormData(entryBody, ignoreParams);
      } else {
        bodyKey = entryBody;
      }
    }
    
    const key = generateRequestKey(method, url, bodyKey, ignoreParams);
    if (key) {
      // Store first matching entry (can be extended to store all matches)
      if (!index.has(key)) {
        index.set(key, entry);
      }
    }
  }
  
  // Cache the index with LRU management
  updateCache(cacheKey, index);
  
  return index;
}

// Parse and normalize URL components
function parseUrl(url, ignoreParams) {
  try {
    const urlObj = new URL(url);
    
    // Remove ignored parameters
    if (ignoreParams && ignoreParams.length > 0) {
      ignoreParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });
    }
    
    // Sort parameters to ensure consistent comparison regardless of order
    const sortedParams = new URLSearchParams(
      Array.from(urlObj.searchParams.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    );
    
    return {
      origin: urlObj.origin,
      pathname: urlObj.pathname,
      params: sortedParams,
      hash: urlObj.hash
    };
  } catch (e) {
    return null;
  }
}

// Compare two parsed URLs
function compareUrls(parsedUrl1, parsedUrl2) {
  if (!parsedUrl1 || !parsedUrl2) {
    return false;
  }
  
  // Compare pathname only (ignore origin/domain)
  if (parsedUrl1.pathname !== parsedUrl2.pathname) {
    return false;
  }
  
  // Compare parameters (already sorted)
  const params1 = parsedUrl1.params.toString();
  const params2 = parsedUrl2.params.toString();
  
  return params1 === params2;
}

// Parse and normalize form data (application/x-www-form-urlencoded)
function parseFormData(body, ignoreParams) {
  try {
    const params = new URLSearchParams(body);
    
    // Remove ignored parameters
    if (ignoreParams && ignoreParams.length > 0) {
      ignoreParams.forEach(param => {
        params.delete(param);
      });
    }
    
    // Sort parameters for consistent comparison
    const sortedParams = new URLSearchParams(
      Array.from(params.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    );
    
    return sortedParams.toString();
  } catch (e) {
    return body;
  }
}

// Get Content-Type from headers
function getContentType(headers) {
  if (!headers) return '';
  
  // Handle both array format (HAR) and object format (request)
  if (Array.isArray(headers)) {
    const contentTypeHeader = headers.find(h => h.name.toLowerCase() === 'content-type');
    return contentTypeHeader ? contentTypeHeader.value.toLowerCase() : '';
  } else {
    const contentTypeKey = Object.keys(headers).find(k => k.toLowerCase() === 'content-type');
    return contentTypeKey ? headers[contentTypeKey].toLowerCase() : '';
  }
}

// Compare request bodies
function compareBodies(reqBody, entryBody, reqHeaders, entryHeaders, ignoreParams) {
  const reqContentType = getContentType(reqHeaders);
  const entryContentType = getContentType(entryHeaders);
  
  // Check if both are form data
  const isReqForm = reqContentType.includes('application/x-www-form-urlencoded');
  const isEntryForm = entryContentType.includes('application/x-www-form-urlencoded');
  
  if (isReqForm && isEntryForm) {
    // Compare as form data with ignored parameters
    const normalizedReqBody = parseFormData(reqBody, ignoreParams);
    const normalizedEntryBody = parseFormData(entryBody, ignoreParams);
    return normalizedReqBody === normalizedEntryBody;
  }
  
  // For other content types, compare directly
  return reqBody === entryBody;
}

// Match HAR entry with request
function matchHarEntry(entry, requestDetail, ignoreParams) {
  const reqMethod = requestDetail._req.method;
  const reqUrl = requestDetail.url;
  
  // Match method
  if (entry.request.method !== reqMethod) {
    return false;
  }
  
  // Parse and compare URLs (ignoring parameter order)
  const parsedReqUrl = parseUrl(reqUrl, ignoreParams);
  const parsedEntryUrl = parseUrl(entry.request.url, ignoreParams);
  
  if (!compareUrls(parsedReqUrl, parsedEntryUrl)) {
    return false;
  }
  
  // Match body for POST/PUT requests
  if ((reqMethod === 'POST' || reqMethod === 'PUT') && entry.request.postData) {
    const reqBody = requestDetail.requestData.toString();
    const entryBody = entry.request.postData.text || '';
    const reqHeaders = requestDetail.requestOptions.headers;
    const entryHeaders = entry.request.headers;
    
    if (!compareBodies(reqBody, entryBody, reqHeaders, entryHeaders, ignoreParams)) {
      return false;
    }
  }
  
  return true;
}

// Find matching HAR entry using index
function findMatchingHarEntry(harData, requestDetail, ignoreParams) {
  if (!harData || !harData.log || !harData.log.entries) {
    return null;
  }
  
  // Build or get cached index
  const index = buildHarIndex(harData, ignoreParams);
  
  // Generate key for current request
  const reqMethod = requestDetail._req.method;
  const reqUrl = requestDetail.url;
  
  let bodyKey = '';
  if ((reqMethod === 'POST' || reqMethod === 'PUT') && requestDetail.requestData) {
    const reqBody = requestDetail.requestData.toString();
    const reqHeaders = requestDetail.requestOptions.headers;
    const contentType = getContentType(reqHeaders);
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      bodyKey = parseFormData(reqBody, ignoreParams);
    } else {
      bodyKey = reqBody;
    }
  }
  
  const key = generateRequestKey(reqMethod, reqUrl, bodyKey, ignoreParams);
  if (!key) {
    return null;
  }
  
  // Fast lookup from index
  return index.get(key) || null;
}

// Handle HAR replay
async function handleHarReplay(setting, requestDetail) {
  return new Promise(resolve => {
    try {
      const ignoreParams = setting.harIgnoreParams 
        ? setting.harIgnoreParams.split(',').map(p => p.trim()).filter(p => p)
        : [];
      
      const matchedEntry = findMatchingHarEntry(setting.harData, requestDetail, ignoreParams);
      
      if (!matchedEntry) {
        resolve({
          response: {
            statusCode: 404,
            header: { 'Content-Type': 'text/plain' },
            body: 'No matching HAR entry found'
          }
        });
        return;
      }
      
      // Extract response from HAR entry
      const harResponse = matchedEntry.response;
      const headers = {};
      
      // Convert headers array to object
      if (harResponse.headers) {
        harResponse.headers.forEach(h => {
          // Skip content-encoding headers as HAR content is already decoded
          const headerNameLower = h.name.toLowerCase();
          if (headerNameLower === 'content-encoding') {
            return;
          }
          headers[h.name] = h.value;
        });
      }
      
      // Get response body
      let body = '';
      if (harResponse.content && harResponse.content.text) {
        body = harResponse.content.text;
        
        // Handle base64 encoded content
        if (harResponse.content.encoding === 'base64') {
          body = Buffer.from(body, 'base64');
        }
      }
      
      // Update Content-Length header to match actual body size
      if (body) {
        const bodyLength = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body);
        headers['Content-Length'] = bodyLength.toString();
      }
      
      // Calculate delay from HAR timing
      let delay = 0;
      if (matchedEntry.time && matchedEntry.time > 0) {
        delay = matchedEntry.time;
      }
      
      // Apply delay if present
      const applyDelay = delay > 0 ? new Promise(r => setTimeout(r, delay)) : Promise.resolve();
      
      applyDelay.then(() => {
        resolve({
          response: {
            statusCode: harResponse.status,
            statusMessage: harResponse.statusText || '',
            header: headers,
            body: body
          }
        });
      });
      
    } catch (error) {
      console.error('Error handling HAR replay:', error);
      resolve({
        response: {
          statusCode: 500,
          header: { 'Content-Type': 'text/plain' },
          body: 'Error processing HAR replay: ' + error.message
        }
      });
    }
  });
}

// Clear cache function for manual cleanup if needed
function clearHarCache() {
  harIndexCache.clear();
  cacheAccessOrder.length = 0;
}

module.exports = {
  handleHarReplay,
  clearHarCache
};
