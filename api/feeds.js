// /api/feeds.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    // List of RSS feeds (or JSON feeds)
    const feeds = [
      {
        name: "LawWeb",
        url: "https://www.lawweb.in/feeds/posts/default?alt=rss",
      },
      {
        name: "iPleaders",
        url: "https://blog.ipleaders.in/feed/",
      },
      {
        name: "Bar & Bench",
        url: "https://www.barandbench.com/feed",
      },
      {
        name: "SupremeToday",
        url: "https://supremetoday.in/feed/",
      },
      {
        name: "SCC Online",
        url: "https://www.scconline.com/rss",
      },
    ];

    const results = [];

    for (const feed of feeds) {
      try {
        // Fetch feed via allorigins proxy to avoid CORS
        const response = await fetch(
          `https://api.allorigins.win/get?url=${encodeURIComponent(feed.url)}`
        );
        const data = await response.json();
        const parser = new DOMParser();
        const xml = parser.parseFromString(data.contents, "application/xml");
        const items = xml.querySelectorAll("item");

        const feedItems = Array.from(items)
          .slice(0, 10) // latest 10 items
          .map((item) => ({
            site: feed.name,
            title: item.querySelector("title")?.textContent || "",
            link: item.querySelector("link")?.textContent || "",
            description: item.querySelector("description")?.textContent || "",
            pubDate: item.querySelector("pubDate")?.textContent || "",
          }));

        results.push(...feedItems);
      } catch (err) {
        console.error(`Failed to fetch ${feed.name}:`, err);
      }
    }

    // Sort by latest date
    results.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate"); // cache 10 mins
    res.status(200).json({ feeds: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch feeds" });
  }
}
