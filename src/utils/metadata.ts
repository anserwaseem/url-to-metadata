import * as cheerio from "cheerio";
import { getMetadataFromBrowser } from "./browser";
import { BROWSER } from "./constants";

type Metadata = {
  title: string;
  description: string | null;
  image: string | null;
  url: string;
  siteName: string | null;
  type: string | null;
  locale: string | null;
};

export const extractMetadata = async (url: string): Promise<Metadata> => {
  try {
    // fetch the page content
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // extract basic metadata
    const metadata: Metadata = {
      title:
        $("title").text() ||
        $('meta[property="og:title"]').attr("content") ||
        "",
      description:
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        null,
      image: $('meta[property="og:image"]').attr("content") || null,
      url: $('meta[property="og:url"]').attr("content") || url,
      siteName: $('meta[property="og:site_name"]').attr("content") || null,
      type: $('meta[property="og:type"]').attr("content") || null,
      locale: $('meta[property="og:locale"]').attr("content") || null,
    };

    // if we need to render JavaScript, use Browserless
    if (!metadata.title || !metadata.description) {
      const jsMetadata = await getMetadataFromBrowser(url);

      // merge with cheerio results
      return {
        ...metadata,
        title: metadata.title || jsMetadata.title,
        description: metadata.description || jsMetadata.description,
        image: metadata.image || jsMetadata.image,
      };
    }

    return metadata;
  } catch (error) {
    console.error("Error extracting metadata:", error);
    throw error;
  }
};
