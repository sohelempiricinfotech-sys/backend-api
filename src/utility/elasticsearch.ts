import { Client } from "@elastic/elasticsearch";

const ELASTICSEARCH_HOST = process.env.ELASTICSEARCH_HOST || "localhost";
const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || "9200";
const ELASTICSEARCH_USERNAME = process.env.ELASTICSEARCH_USERNAME;
const ELASTICSEARCH_PASSWORD = process.env.ELASTICSEARCH_PASSWORD;

export const esClient = new Client({
  node: `http://${ELASTICSEARCH_HOST}:${ELASTICSEARCH_PORT}`,
  ...(ELASTICSEARCH_USERNAME && ELASTICSEARCH_PASSWORD
    ? { auth: { username: ELASTICSEARCH_USERNAME, password: ELASTICSEARCH_PASSWORD } }
    : {}),
});

export const pingElasticsearch = async (): Promise<boolean> => {
  try {
    await esClient.ping();
    return true;
  } catch {
    return false;
  }
};

export const getClusterHealth = async (): Promise<Record<string, unknown> | null> => {
  try {
    const health = await esClient.cluster.health();
    return health as unknown as Record<string, unknown>;
  } catch {
    return null;
  }
};
