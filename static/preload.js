// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }

  // loadPageUrls();
});

function loadPageUrls() {
  function loadScript(url) {
    let script = document.createElement('script');
    let port = process.env.PORT || 3000;
  
    script.async = '';
    script.src = `http://localhost:${port}${url}`;
  
    document.body.appendChild(script);
  }
  loadScript('/static/js/bundle.js');
  loadScript('/static/js/0.chunk.js');
  loadScript('/static/js/main.chunk.js');
}
