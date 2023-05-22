import { PGChunk, PGEssay, PGJSON } from "@/types";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import { encode } from "gpt-3-encoder";
import { NodeHtmlMarkdown } from 'node-html-markdown';

const CHUNK_SIZE = 200;

// create an instance of NodeHtmlMarkdown
const nhm = new NodeHtmlMarkdown();

const getMetaData = async (url: string) => {
  const html = await axios.get(url);
  const $ = cheerio.load(html.data);

  const title = $('meta[property="og:title"]').attr('content') || $('title').text();
  const description = $('meta[name="description"]').attr('content') || '';
  
  return { url, title, description };
};

const getWebsite = async (url: string) => {
  const { title, description } = await getMetaData(url);

  const html = await axios.get(url);
  const $ = cheerio.load(html.data);

  // find the div with data-elementor-type="wp-page" attribute and convert its HTML to markdown
  const htmlContent = $('div[data-elementor-type="wp-page"]').html() || '';
  const markdownContent = nhm.translate(htmlContent);

  let cleanedText = markdownContent.replace(/\s+/g, " ");
  cleanedText = cleanedText.replace(/\.([a-zA-Z])/g, ". $1");

  const trimmedContent = cleanedText.trim();

  const website: PGEssay = {
    title,
    url,
    description,
    content: trimmedContent,
    length: trimmedContent.length,
    tokens: encode(trimmedContent).length,
    chunks: []
  };

  return website;
};

const chunkWebsite = async (website: PGEssay) => {
  const { title, url, description, content } = website;

  let websiteTextChunks = [];

  if (encode(content).length > CHUNK_SIZE) {
    const split = content.split(". ");
    let chunkText = "";

    for (let i = 0; i < split.length; i++) {
      const sentence = split[i];
      const sentenceTokenLength = encode(sentence);
      const chunkTextTokenLength = encode(chunkText).length;

      if (chunkTextTokenLength + sentenceTokenLength.length > CHUNK_SIZE) {
        websiteTextChunks.push(chunkText);
        chunkText = "";
      }

      if (sentence[sentence.length - 1].match(/[a-z0-9]/i)) {
        chunkText += sentence + ". ";
      } else {
        chunkText += sentence + " ";
      }
    }

    websiteTextChunks.push(chunkText.trim());
  } else {
    websiteTextChunks.push(content.trim());
  }

  const websiteChunks = websiteTextChunks.map((text) => {
    const trimmedText = text.trim();

    const chunk: PGChunk = {
      url,
      title,
      description,
      content: trimmedText,
      length: trimmedText.length,
      tokens: encode(trimmedText).length,
      embedding: []
    };

    return chunk;
  });

  const chunkedWebsite: PGEssay = {
    ...website,
    chunks: websiteChunks
  };

  return chunkedWebsite;
};

(async () => {
  // Read URLs from an external file. Here, we expect a file named urls.txt
  // in the same directory, with one URL per line.
  const fileContent = fs.readFileSync("scripts/urls.txt", "utf-8");
  const urls = fileContent.split("\n").map(line => line.trim()).filter(Boolean);

  let websites = [];

  for (let i = 0; i < urls.length; i++) {
    const website = await getWebsite(urls[i]);
    const chunkedWebsite = await chunkWebsite(website);
    websites.push(chunkedWebsite);
  }

  const json: PGJSON = {
    current_date: "2023-03-01",
    url: "Multiple",
    length: websites.reduce((acc, website) => acc + website.length, 0),
    tokens: websites.reduce((acc, website) => acc + website.tokens, 0),
    websites
  };

  fs.writeFileSync("scripts/pg.json", JSON.stringify(json));
})();