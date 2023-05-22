import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseHybridSearch } from "langchain/retrievers/supabase";
import { supabaseAdmin } from "@/utils"; // Keep the existing import for supabaseAdmin

export const config = {
  runtime: "edge"
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { query, apiKey, matches } = (await req.json()) as {
      query: string;
      apiKey: string;
      matches: number;
    };

    const input = query.replace(/\n/g, " ");

    // Here, we use OpenAIEmbeddings to get the embeddings for our input text
    const embeddings = new OpenAIEmbeddings(apiKey, "text-embedding-ada-002");

    // Now, we use SupabaseHybridSearch to retrieve relevant documents
    const retriever = new SupabaseHybridSearch(embeddings, {
  client: supabaseAdmin,
  similarityK: matches,
  keywordK: matches,
  tableName: "website_data",
  similarityQueryName: {
    function: "pg_search",
    parameters: {
      query_embedding: embeddings,
      similarity_threshold: 0.01,
      match_count: matches,
    }
  },
  keywordQueryName: "kw_search",
});


    const results = await retriever.getRelevantDocuments(input);

    console.log(results);

    return new Response(JSON.stringify(results), { status: 200 });
  } catch (error) {
    console.error("Server error:", error);
    return new Response("Error", { status: 500 });
  }
};

export default handler;
