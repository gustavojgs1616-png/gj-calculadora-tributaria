import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "GJContabilPro/1.0",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
    ],
  },
});

const FEEDS = [
  { url: "https://www.contabeis.com.br/noticias/rss/",   source: "Portal Contábeis",  categoria: "Contabilidade" },
  { url: "https://www.jornalcontabil.com.br/feed/",       source: "Jornal Contábil",   categoria: "Fiscal"        },
  { url: "https://cfc.org.br/feed/",                      source: "CFC",               categoria: "Contabilidade" },
  { url: "https://fenacon.org.br/feed/",                  source: "Fenacon",           categoria: "Tributário"    },
  { url: "https://tributario.net/feed/",                  source: "Tributário.net",    categoria: "Tributário"    },
  { url: "https://www.contadorperito.com/feed/",          source: "Contador Perito",   categoria: "Contabilidade" },
];

const CATEGORIA_KEYWORDS = {
  "Reforma Tributária": ["reforma tributária", "reforma fiscal", "iva", "cbs", "ibs", "split payment"],
  "Simples Nacional":   ["simples nacional", "mei", "das", "supersimples"],
  "Tributário":         ["imposto", "tribut", "irpj", "csll", "pis", "cofins", "irrf", "darf"],
  "Fiscal":             ["fiscal", "receita federal", "sefaz", "nota fiscal", "nfe", "fisco"],
  "Contabilidade":      ["contab", "balanço", "cfc", "crc", "escrituração", "sped"],
};

function detectCategoria(title = "", summary = "", feedCategoria = "") {
  const text = `${title} ${summary}`.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORIA_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) return cat;
  }
  return feedCategoria;
}

function extractImage(item) {
  return (
    item.enclosure?.url ||
    item.mediaContent?.["$"]?.url ||
    item.mediaThumbnail?.["$"]?.url ||
    null
  );
}

function stripHtml(str = "") {
  return str.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}

async function fetchFeed(feed) {
  try {
    const data = await parser.parseURL(feed.url);
    return (data.items || []).slice(0, 12).map((item) => {
      const summary = stripHtml(item.contentSnippet || item.summary || item.content || "");
      return {
        id:        item.guid || item.link || Math.random().toString(36),
        title:     (item.title || "").trim(),
        link:      item.link || "#",
        summary:   summary.slice(0, 220),
        pubDate:   item.isoDate || item.pubDate || new Date().toISOString(),
        source:    feed.source,
        categoria: detectCategoria(item.title, summary, feed.categoria),
        image:     extractImage(item),
      };
    });
  } catch (err) {
    console.warn(`[noticias] Feed ${feed.source} falhou:`, err.message);
    return [];
  }
}

let cache = { data: null, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  if (cache.data && Date.now() - cache.timestamp < CACHE_TTL) {
    res.setHeader("Cache-Control", "s-maxage=300");
    return res.status(200).json({ items: cache.data, cached: true, updatedAt: cache.timestamp });
  }

  const settled = await Promise.allSettled(FEEDS.map(fetchFeed));
  const all = settled
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  const seen = new Set();
  const unique = all.filter((item) => {
    if (!item.title || seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });

  cache = { data: unique, timestamp: Date.now() };
  res.setHeader("Cache-Control", "s-maxage=300");
  res.status(200).json({ items: unique, cached: false, updatedAt: cache.timestamp });
}
