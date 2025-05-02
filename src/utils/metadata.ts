import * as cheerio from "cheerio";
import { getMetadataFromBrowser } from "./browser";
import { BROWSER } from "./constants";

type ImageMetadata = {
  url: string | null;
  secureUrl: string | null;
  type: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
};

type VideoMetadata = {
  url: string | null;
  secureUrl: string | null;
  type: string | null;
  width: number | null;
  height: number | null;
};

type AudioMetadata = {
  url: string | null;
  secureUrl: string | null;
  type: string | null;
};

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

  // structured metadata
  imageMetadata: ImageMetadata;
  videoMetadata: VideoMetadata;
  audioMetadata: AudioMetadata;

  // additional og tags
  determiner: string | null;
  localeAlternate: string[];
  audio: string | null;
  video: string | null;

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
      determiner: $('meta[property="og:determiner"]').attr("content") || null,
      audio: $('meta[property="og:audio"]').attr("content") || null,
      video: $('meta[property="og:video"]').attr("content") || null,
    };

    // extract structured image metadata
    const imageMetadata: ImageMetadata = {
      url: $('meta[property="og:image"]').attr("content") || null,
      secureUrl:
        $('meta[property="og:image:secure_url"]').attr("content") || null,
      type: $('meta[property="og:image:type"]').attr("content") || null,
      width:
        parseInt($('meta[property="og:image:width"]').attr("content") || "0") ||
        null,
      height:
        parseInt(
          $('meta[property="og:image:height"]').attr("content") || "0",
        ) || null,
      alt: $('meta[property="og:image:alt"]').attr("content") || null,
    };

    // extract structured video metadata
    const videoMetadata: VideoMetadata = {
      url: $('meta[property="og:video"]').attr("content") || null,
      secureUrl:
        $('meta[property="og:video:secure_url"]').attr("content") || null,
      type: $('meta[property="og:video:type"]').attr("content") || null,
      width:
        parseInt($('meta[property="og:video:width"]').attr("content") || "0") ||
        null,
      height:
        parseInt(
          $('meta[property="og:video:height"]').attr("content") || "0",
        ) || null,
    };

    // extract structured audio metadata
    const audioMetadata: AudioMetadata = {
      url: $('meta[property="og:audio"]').attr("content") || null,
      secureUrl:
        $('meta[property="og:audio:secure_url"]').attr("content") || null,
      type: $('meta[property="og:audio:type"]').attr("content") || null,
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

    // extract alternate locales
    const localeAlternate: string[] = [];
    $('meta[property="og:locale:alternate"]').each((_, element) => {
      const content = $(element).attr("content");
      if (content) {
        localeAlternate.push(content);
      }
    });

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
      imageMetadata,
      videoMetadata,
      audioMetadata,
      determiner: ogTags.determiner,
      localeAlternate,
      audio: ogTags.audio,
      video: ogTags.video,
      metaTags,
    };
  } catch (error) {
    console.error("Error extracting metadata:", error);
    throw error;
  }
};
