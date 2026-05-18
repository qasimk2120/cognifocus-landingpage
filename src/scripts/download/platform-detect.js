export function detectDownloadPlatform() {
  const ua = navigator.userAgent || "";
  const uaData = navigator.userAgentData;
  const isAndroid =
    /android/i.test(ua) ||
    Boolean(
      uaData &&
        typeof uaData.platform === "string" &&
        /android/i.test(uaData.platform),
    );
  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const isInAppBrowser =
    /(instagram|fb_iab|fban|fbav|line|micromessenger|wv)/i.test(ua);

  return {
    isAndroid,
    isIOS,
    isInAppBrowser,
  };
}
