import { PGEssay, PGJSON } from "@/types";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { Configuration, OpenAIApi } from "openai";

loadEnvConfig("");

const generateEmbeddings = async (websites: PGEssay[]) => {
  const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
  const openai = new OpenAIApi(configuration);

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  for (let i = 0; i < websites.length; i++) {
    const website = websites[i];

    for (let j = 0; j < website.chunks.length; j++) {
      const chunk = website.chunks[j];

      const { title, url, description, length, tokens } = chunk;

      const embeddingResponse = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: chunk.content
      });

      const [{ embedding }] = embeddingResponse.data.data;

      const { data, error } = await supabase
        .from("website_data")
        .insert({
          title,
          url,
          description,
          chunk: chunk.content,
          chunk_length: length,
          chunk_tokens: tokens,
          embedding
        })
        .select("*");

      if (error) {
        console.log("error", error);
      } else {
        console.log("saved", i, j);
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
};

(async () => {
  const json: PGJSON = JSON.parse(fs.readFileSync("scripts/pg.json", "utf8"));

  await generateEmbeddings(json.websites);
})();
