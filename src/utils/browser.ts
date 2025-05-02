import { BROWSER } from "./constants";

type BrowserlessResponse = {
  data: {
    title: string;
    description: string | null;
    image: string | null;
    url: string;
    siteName: string | null;
    type: string | null;
    locale: string | null;
  };
};

export const getMetadataFromBrowser = async (
  url: string,
): Promise<BrowserlessResponse["data"]> => {
  const response = await fetch("https://chrome.browserless.io/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "x-api-key": process.env.BROWSERLESS_TOKEN || "",
    },
    body: JSON.stringify({
      url,
      elements: [
        { selector: "title" },
        { selector: 'meta[name="description"]', attribute: "content" },
        { selector: 'meta[property="og:title"]', attribute: "content" },
        { selector: 'meta[property="og:description"]', attribute: "content" },
        { selector: 'meta[property="og:image"]', attribute: "content" },
        { selector: 'meta[property="og:url"]', attribute: "content" },
        { selector: 'meta[property="og:site_name"]', attribute: "content" },
        { selector: 'meta[property="og:type"]', attribute: "content" },
        { selector: 'meta[property="og:locale"]', attribute: "content" },
      ],
      timeout: BROWSER.TIMEOUT,
    }),
  });

  if (!response.ok) {
    throw new Error(`Browserless API error: ${response.statusText}`);
  }

  const data = (await response.json()) as BrowserlessResponse;
  return data.data;
};
