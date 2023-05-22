--  RUN 1st
create extension vector;

-- RUN 2nd
CREATE TABLE IF NOT EXISTS website_data (
    id bigserial primary key,
    url TEXT,
    title TEXT,
    description TEXT,
    chunk TEXT NOT NULL,
    chunk_length bigint,
    chunk_tokens bigint,
    embedding vector (1536)
);

-- RUN 3rd after running the scripts
create or replace function pg_search (
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int
)
returns table (
  id bigint,
  title text,
  url text,
  description text,
  chunk text,
  chunk_length bigint,
  chunk_tokens bigint,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    wd.id,
    wd.title,
    wd.url,
    wd.description,
    wd.chunk,
    wd.chunk_length,
    wd.chunk_tokens,
    1 - (wd.embedding <=> query_embedding) as similarity
  from website_data wd
  where 1 - (wd.embedding <=> query_embedding) > similarity_threshold
  order by wd.embedding <=> query_embedding
  limit match_count;
end;
$$;


-- RUN 4th
create index on website_data 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

