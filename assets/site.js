/* mogit: privacy-first, opt-in GA4 integration. */
(() => {
  'use strict';
  const MEASUREMENT_ID = 'G-12DCQR1HCZ';
  const APP_STORE_URL = 'https://apps.apple.com/jp/app/mogit/id6797540728';
  const STORAGE_KEY = 'mogit_analytics_consent_v1';
  const consent = () => { try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; } };
  // Apply the stored choice before any analytics code can execute.
  window['ga-disable-' + MEASUREMENT_ID] = consent() !== 'accepted';
  let enabled = false;
  let loading = false;
  const saveConsent = value => { try { localStorage.setItem(STORAGE_KEY, value); } catch (_) { /* browser storage unavailable */ } };
  function startAnalytics() {
    if (enabled || loading) return;
    loading = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, { 'anonymize_ip': true });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
    script.onload = () => { enabled = true; loading = false; };
    script.onerror = () => { loading = false; };
    document.head.appendChild(script);
  }
  function clearSiteAnalyticsCookies() {
    // Best effort: delete first-party GA cookies that are readable from this origin.
    // HttpOnly cookies or cookies belonging to another domain cannot be removed here.
    const names = document.cookie.split(';').map(part => part.trim().split('=')[0]);
    const host = window.location.hostname;
    const domainVariants = [''];
    if (host && host !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      const parts = host.split('.');
      for (let i = 0; i < parts.length - 1; i++) {
        domainVariants.push(parts.slice(i).join('.'));
      }
    }
    for (const name of names) {
      if (!/^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name)) continue;
      for (const domain of domainVariants) {
        const domainPart = domain ? '; domain=' + domain : '';
        document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax' + domainPart;
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + domainPart;
      }
    }
  }
  function stopAnalytics() {
    // Stop new events immediately; a page reload unloads any previously loaded tag.
    window['ga-disable-' + MEASUREMENT_ID] = true;
    enabled = false;
    clearSiteAnalyticsCookies();
  }
  const banner = document.getElementById('analytics-consent');
  const settings = document.getElementById('analytics-settings');
  const hideBanner = () => { if (banner) banner.hidden = true; };
  const showBanner = () => { if (banner) banner.hidden = false; };
  const choice = consent();
  if (choice === 'accepted') { window['ga-disable-' + MEASUREMENT_ID] = false; startAnalytics(); }
  else if (choice === 'declined') { stopAnalytics(); hideBanner(); }
  else showBanner();
  document.getElementById('analytics-accept')?.addEventListener('click', () => {
    saveConsent('accepted');
    if (consent() !== 'accepted') return;
    window['ga-disable-' + MEASUREMENT_ID] = false; startAnalytics(); hideBanner();
  });
  document.getElementById('analytics-decline')?.addEventListener('click', () => {
    const choiceBeforeDecline = consent();
    saveConsent('declined'); stopAnalytics(); hideBanner();
    // Reload only if GA was previously permitted, to unload the injected tag.
    if (choiceBeforeDecline === 'accepted') window.location.reload();
  });
  settings?.addEventListener('click', () => showBanner());
  document.querySelectorAll('a[href="' + APP_STORE_URL + '"]').forEach(link => {
    link.addEventListener('click', () => {
      const detail = {
        page_location: window.location.href,
        cta_position: link.dataset.ctaPosition || 'content',
        cta_label: link.dataset.ctaLabel || link.textContent.trim()
      };
      document.dispatchEvent(new CustomEvent('mogit:app_store_click', { detail }));
      if (consent() === 'accepted' && typeof window.gtag === 'function') {
        window.gtag('event', 'app_store_click', { ...detail, transport_type: 'beacon' });
      }
    });
  });
  document.querySelectorAll('details[data-faq-item]').forEach(item => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      document.querySelectorAll('details[data-faq-item]').forEach(other => { if (other !== item) other.open = false; });
    });
  });
})();
