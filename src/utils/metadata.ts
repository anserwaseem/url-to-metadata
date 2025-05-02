import * as cheerio from "cheerio";
import { getMetadataFromBrowser } from "./browser";
import { BROWSER } from "./constants";

type Metadata = {
  // basic metadata
  title: string;
  description: string | null;
  image: string | null;
  url: string;
  siteName: string | null;
  type: string | null;
  locale: string | null;
  favicon: string | null;
  language: string | null;
  // raw meta tags
  metaTags: Record<string, string>;
};

export const extractMetadata = async (url: string): Promise<Metadata> => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // extract OpenGraph tags
    const ogTags = {
      title: $('meta[property="og:title"]').attr("content") || null,
      description: $('meta[property="og:description"]').attr("content") || null,
      image: $('meta[property="og:image"]').attr("content") || null,
      url: $('meta[property="og:url"]').attr("content") || null,
      siteName: $('meta[property="og:site_name"]').attr("content") || null,
      type: $('meta[property="og:type"]').attr("content") || null,
      locale: $('meta[property="og:locale"]').attr("content") || null,
    };

    // extract SEO tags
    const seoTags = {
      title: $("title").text() || "",
      description: $('meta[name="description"]').attr("content") || null,
    };

    // extract language
    const language = $("html").attr("lang") || null;

    // extract favicon
    const favicon =
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      $('link[rel="apple-touch-icon"]').attr("href") ||
      null;

    // extract all meta tags
    const metaTags: Record<string, string> = {};
    $("meta").each((_, element) => {
      const name = $(element).attr("name") || $(element).attr("property");
      const content = $(element).attr("content");
      if (name && content) {
        metaTags[name] = content;
      }
    });

    return {
      title: seoTags.title || ogTags.title || "",
      description: seoTags.description || ogTags.description,
      image: ogTags.image,
      url: ogTags.url || url,
      siteName: ogTags.siteName,
      type: ogTags.type,
      locale: ogTags.locale,
      favicon,
      language,
      metaTags,
    };
  } catch (error) {
    console.error("Error extracting metadata:", error);
    throw error;
  }
};
