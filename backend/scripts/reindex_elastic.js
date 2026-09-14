const { initElasticsearch } = require("../dist/modules/search/elastic.client");
const { reindexAllInElasticsearch } = require("../dist/modules/search/document-indexer.service");

async function main() {
  console.log("==========================================");
  console.log("   RESETTING & RE-INDEXING ELASTICSEARCH   ");
  console.log("==========================================\n");

  try {
    // 1. Reset Elasticsearch Index
    console.log("🧹 Resetting Elasticsearch index 'sdems_search_index'...");
    const initRes = await initElasticsearch(true);
    console.log("✓ Index reset & initialized:", initRes);

    // 2. Sync all documents & evidence from PostgreSQL
    console.log("\n📦 Re-indexing all current PostgreSQL documents and evidence items...");
    const { documentsIndexed, evidenceIndexed } = await reindexAllInElasticsearch();

    console.log("\n✅ ELASTICSEARCH RE-INDEX COMPLETE!");
    console.log("==========================================");
    console.log(`  Documents Indexed : ${documentsIndexed}`);
    console.log(`  Evidence Indexed  : ${evidenceIndexed}`);
    console.log("==========================================\n");
    process.exit(0);
  } catch (err) {
    console.error("❌ Re-index failed:", err.message || err);
    process.exit(1);
  }
}

main();
