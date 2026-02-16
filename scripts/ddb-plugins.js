/* Combined DDB plugins: Logo + API selector for Swagger UI */
(function () {
  // --- Api Selector ---
  function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  const mapping = {
    '1': 'https://api.deutsche-digitale-bibliothek.de/OpenAPI',
    '2': 'https://api.deutsche-digitale-bibliothek.de/2/q/openapi'
  };

  const defaultUrl = mapping['1'];

  function normalize(u) {
    return (u || '').replace(/\/+$/, '');
  }

  function findKeyForUrl(url) {
    const norm = normalize(url);
    for (const k in mapping) {
      if (normalize(mapping[k]) === norm) return k;
    }
    return null;
  }

  function computeInitialApiUrl() {
    let urlParam = getQueryParam('url');
    if (!urlParam) {
      const docParam = getQueryParam('doc');
      if (docParam && mapping[docParam]) urlParam = mapping[docParam];
    }
    return urlParam || defaultUrl;
  }

  const ApiSelectorPlugin = function (system) {
    return {
      wrapComponents: {
        Topbar: (Original, system) => (props) => {
          const React = system.React;
          const specActions = system.specActions || (window.ui && window.ui.specActions);

          const currentUrl = computeInitialApiUrl();

          function handleChange(e) {
            const newKey = e.target.value;
            // only allow mapped values;
            const resolved = mapping[newKey] || defaultUrl;
            const sp = new URLSearchParams(window.location.search);
            sp.set('url', resolved);
            history.replaceState(null, '', window.location.pathname + '?' + sp.toString());
            try {
              if (specActions && typeof specActions.updateUrl === 'function') {
                specActions.updateUrl(resolved);
              }
              if (specActions && typeof specActions.download === 'function') {
                specActions.download(resolved);
              }
            } catch (err) {
              // ensure the search string includes the leading '?'
              window.location.search = '?' + sp.toString();
            }
          }

          function openRaw() {
            const val = document.getElementById('docSelectPlugin')?.value || '1';
            const u = mapping[val] || defaultUrl;
            // use noopener for safety
            window.open(u, '_blank', 'noopener');
          }

          // We replace the built-in download input with a DOM-based select/button
          // to preserve exact layout. Do not render a second dropdown here.

          // After mounting, replace the existing .download-url-wrapper with our selector to keep layout identical
          setTimeout(() => {
            try {
              const downloadWrapper = document.querySelector('.download-url-wrapper');
              if (downloadWrapper) {
                // create replacement node that matches structure and classes
                const repl = document.createElement('form');
                repl.className = 'download-url-wrapper';
                repl.style.display = 'flex';
                repl.style.alignItems = 'center';

                const sel = document.createElement('select');
                // stable id used by helper functions
                sel.id = 'docSelectPlugin';
                sel.className = 'download-url-input';
                sel.style.height = '30px';
                sel.style.marginRight = '8px';
                const opt1 = document.createElement('option'); opt1.value = '1'; opt1.text = 'Deutschen Digitalen Bibliothek, Version 1';
                const opt2 = document.createElement('option'); opt2.value = '2'; opt2.text = 'Deutschen Digitalen Bibliothek, Version 2';
                sel.add(opt1); sel.add(opt2);
                const initialKey = findKeyForUrl(currentUrl) || '1';
                sel.value = initialKey;

                const btn = document.createElement('button');
                btn.className = 'download-url-button button';
                btn.type = 'button';
                btn.textContent = 'Explore';

                btn.addEventListener('click', (ev) => {
                  ev.preventDefault();
                  const val = sel.value || '1';
                  // only allow mapped values here (no arbitrary URLs)
                  const resolved = mapping[val] || defaultUrl;
                  const sp = new URLSearchParams(window.location.search);
                  sp.set('url', resolved);
                  history.replaceState(null, '', window.location.pathname + '?' + sp.toString());
                  try {
                    if (specActions && typeof specActions.updateUrl === 'function') specActions.updateUrl(resolved);
                    if (specActions && typeof specActions.download === 'function') specActions.download(resolved);
                  } catch (e) {
                    // ensure the search string includes the leading '?'
                    window.location.search = '?' + sp.toString();
                  }
                });

                sel.addEventListener('change', () => {
                  // keep URL in sync when changed; only use mapping keys
                  const val = sel.value || '1';
                  const resolved = mapping[val] || defaultUrl;
                  const sp = new URLSearchParams(window.location.search);
                  sp.set('url', resolved);
                  history.replaceState(null, '', window.location.pathname + '?' + sp.toString());
                });

                repl.appendChild(sel);
                repl.appendChild(btn);

                downloadWrapper.parentNode.replaceChild(repl, downloadWrapper);
              }

              // Logo handling: always use the white RGB logo file
              const link = document.querySelector('.topbar .link');
              if (link) {
                // remove children safely
                while (link.firstChild) link.removeChild(link.firstChild);
                const img = document.createElement('img');
                img.id = 'ddb-logo-img';
                img.alt = 'DDB';
                img.style.height = '40px';
                img.style.display = 'inline-block';
                img.src = 'images/logo-ddbpro-RGB-white.svg';
                link.appendChild(img);
                // Only set anchor attributes if element is an anchor
                if (link.tagName && link.tagName.toLowerCase() === 'a') {
                  link.href = 'images/logo-ddbpro-RGB-white.svg';
                  link.setAttribute('rel', 'noopener noreferrer');
                  link.setAttribute('target', '_blank');
                }
              }

              // (logo already handled above)
            } catch (e) {
              // ignore DOM errors
              console.warn('ddb plugin DOM replace failed', e);
            }
          }, 0);

          return React.createElement(Original, props);
        }
      }
    };
  };

  // --- Logo Plugin ---
  const DDBLogoPlugin = function () {
    return {
      wrapComponents: {
        Topbar: (Original, { React }) => (props) => {
          const logo = React.createElement('img', {
            className: 'ddbLogo',
            width: '200px',
            src: 'images/logo-ddbpro.svg',
            style: { marginRight: '12px' }
          });

          const original = React.createElement(Original, props);
          const wrapper = React.createElement('div', { className: 'wrapper', style: { display: 'flex', alignItems: 'center' } }, [logo, original]);
          return wrapper;
        }
      }
    };
  };

  // Expose
  window.ApiSelectorPlugin = ApiSelectorPlugin;
  window.DDBLogoPlugin = DDBLogoPlugin;
  window.computeInitialApiUrl = computeInitialApiUrl;
})();

