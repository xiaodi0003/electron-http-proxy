// HAR replay functionality

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
  
  // Compare origin and pathname
  if (parsedUrl1.origin !== parsedUrl2.origin || parsedUrl1.pathname !== parsedUrl2.pathname) {
    return false;
  }
  
  // Compare parameters (already sorted)
  const params1 = parsedUrl1.params.toString();
  const params2 = parsedUrl2.params.toString();
  
  return params1 === params2;
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
    
    if (reqBody !== entryBody) {
      return false;
    }
  }
  
  return true;
}

// Find matching HAR entry
function findMatchingHarEntry(harData, requestDetail, ignoreParams) {
  if (!harData || !harData.log || !harData.log.entries) {
    return null;
  }
  
  const entries = harData.log.entries;
  
  for (let i = 0; i < entries.length; i++) {
    if (matchHarEntry(entries[i], requestDetail, ignoreParams)) {
      return entries[i];
    }
  }
  
  return null;
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

module.exports = {
  handleHarReplay
};
