export class ScraperBlockedError extends Error {
  constructor(message = 'Google Maps blocked the scraper') {
    super(message);
    this.name = 'ScraperBlockedError';
  }
}

export class ScraperNoResultsError extends Error {
  constructor(message = 'No listings returned') {
    super(message);
    this.name = 'ScraperNoResultsError';
  }
}

export class ScraperTimeoutError extends Error {
  constructor(message = 'Scraper timed out') {
    super(message);
    this.name = 'ScraperTimeoutError';
  }
}
