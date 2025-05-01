import { chromium, Browser } from "playwright";
import { BROWSER } from "./constants";

let browserInstance: Browser | null = null;

export const getBrowser = async (): Promise<Browser> => {
  if (!browserInstance) {
    browserInstance = await chromium.connect({
      wsEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`,
      timeout: BROWSER.TIMEOUT,
    });
  }
  return browserInstance;
};
