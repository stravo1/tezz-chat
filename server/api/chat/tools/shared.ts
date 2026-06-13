// Timezone to country mapping (shared across web search / news tools).
// Tavily's `country` param expects a full lowercase country NAME, not an ISO code.
export const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Asia/Kolkata': 'india',
  'Asia/Dubai': 'united arab emirates',
  'Asia/Singapore': 'singapore',
  'Asia/Tokyo': 'japan',
  'Asia/Shanghai': 'china',
  'Europe/London': 'united kingdom',
  'Europe/Paris': 'france',
  'Europe/Berlin': 'germany',
  'America/New_York': 'united states',
  'America/Los_Angeles': 'united states',
  'America/Chicago': 'united states',
  'Australia/Sydney': 'australia',
  'Pacific/Auckland': 'new zealand',
};

/** Extract a clean hostname (without leading "www.") from a URL. */
export const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

/** Build a favicon URL for a given page URL via Google's favicon service. */
export const getFaviconUrl = (url: string): string => {
  const domain = getDomain(url);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
};
