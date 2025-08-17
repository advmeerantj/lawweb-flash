// /api/feeds.js
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
  try {
    const feeds = [
      { name: "LawWeb", url: "https://www.lawweb.in/feeds/posts/default?alt=rss", type: "rss" },
      { name: "iPleaders", url: "https://blog.ipleaders.in/feed/", type: "rss" },
      { name: "Bar & Bench", url: "https://www.barandbench.com/feed", type: "rss" },
      { name: "SupremeToday", url: "https://supremetoday.in/feed/", type: "rss" },
      { name: "SCC Online", url: "https://www.scconline.com/rss", type: "rss" },
      { name: "Indian Kanoon", url: "https://indiankanoon.org/search/?court=SC&court=Madras+High+Court&sort=date&format=rss", type: "rss" },
      { name: "CaseMine", url: "https://www.casemine.com/feed/sc-madras-court/reportable", type: "rss" } // hypothetical feed
    ];

    const results = [];

    for (const feed of feeds) {
      try {
        if(feed.type === "rss") {
          // fetch RSS via allorigins
          const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(feed.url)}`);
          const data = await response.json();
          const parser = new JSDOM().window.DOMParser;
          const xml = new parser().parseFromString(data.contents, "application/xml");
          const items = xml.querySelectorAll("item");

          const feedItems = Array.from(items).slice(0, 10).map(item => ({
            site: feed.name,
            title: item.querySelector("title")?.textContent || "",
            link: item.querySelector("link")?.textContent || "",
            description: item.querySelector("description")?.textContent || "",
            pubDate: item.querySelector("pubDate")?.textContent || "",
          }));

          results.push(...feedItems);
        }
      } catch(err) {
        console.error(`Failed to fetch ${feed.name}:`, err);
      }
    }

    // Sort by latest date
    results.sort((a,b) => new Date(b.pubDate) - new Date(a.pubDate));

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate"); // 10 min cache
    res.status(200).json({ feeds: results });

  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch feeds" });
  }
}
