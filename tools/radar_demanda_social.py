import argparse
import csv
import re
import time
from dataclasses import dataclass
from html import unescape
from pathlib import Path
from typing import Iterable
from urllib.parse import quote_plus

import requests


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
}

INTENT_PATTERNS = [
    r"preciso (de|um|uma)",
    r"algu[eé]m indica",
    r"recomend[aá]",
    r"procuro (empresa|profissional|freelancer|ag[eê]ncia)",
    r"quem faz",
    r"or[cç]amento",
    r"site profissional",
    r"criar (site|app|aplicativo|sistema)",
    r"automatiza[cç][aã]o",
    r"software para",
    r"landing page",
    r"gest[aã]o de leads",
]


@dataclass
class LeadSignal:
    source: str
    keyword: str
    title: str
    snippet: str
    url: str
    matched_pattern: str


class DemandRadar:
    def __init__(self, pause_seconds: float = 1.2):
        self.pause_seconds = pause_seconds
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.results: list[LeadSignal] = []
        self.seen_urls: set[str] = set()

    def search_public_web(self, query: str, max_results: int = 10) -> list[dict]:
        searchers = [self.search_bing, self.search_duckduckgo]
        for searcher in searchers:
            try:
                results = searcher(query, max_results=max_results)
                if results:
                    return results
            except Exception:
                continue
        return []

    def search_duckduckgo(self, query: str, max_results: int = 10) -> list[dict]:
        url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
        response = self.session.get(url, timeout=15)
        response.raise_for_status()
        html = response.text

        items = []
        pattern = re.compile(
            r'<a[^>]*class="result__a"[^>]*href="(?P<url>[^"]+)"[^>]*>(?P<title>.*?)</a>.*?<a[^>]*class="result__snippet"[^>]*>(?P<snippet>.*?)</a>',
            re.S,
        )

        for match in pattern.finditer(html):
            title = self._clean_html(match.group("title"))
            snippet = self._clean_html(match.group("snippet"))
            result_url = unescape(match.group("url"))
            items.append({"title": title, "snippet": snippet, "url": result_url})
            if len(items) >= max_results:
                break
        return items

    def search_bing(self, query: str, max_results: int = 10) -> list[dict]:
        url = f"https://www.bing.com/search?q={quote_plus(query)}"
        response = self.session.get(url, timeout=15)
        response.raise_for_status()
        html = response.text

        items = []
        matches = re.finditer(
            r'<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>\s*</h2>(?:[\s\S]{0,1600}?<p[^>]*>(.*?)</p>)?',
            html,
            re.S,
        )

        for match in matches:
            title = self._clean_html(match.group(2))
            snippet = self._clean_html(match.group(3) if match.lastindex and match.group(3) else "")
            result_url = unescape(match.group(1))
            items.append({"title": title, "snippet": snippet, "url": result_url})
            if len(items) >= max_results:
                break
        return items

    def collect_public_intent(self, keywords: Iterable[str], max_results_per_query: int = 8):
        site_filters = {
            "linkedin": "site:linkedin.com/posts OR site:linkedin.com/feed OR site:linkedin.com/company",
            "reddit": "site:reddit.com",
            "youtube": "site:youtube.com/watch",
            "instagram": "site:instagram.com",
            "facebook": "site:facebook.com",
            "tiktok": "site:tiktok.com",
            "x": "site:x.com OR site:twitter.com",
            "forums": 'site:jusbrasil.com.br OR site:reclameaqui.com.br OR site:grupos.google.com OR site:medium.com',
            "web": "",
        }

        for keyword in keywords:
            for source, filter_query in site_filters.items():
                if source == "web":
                    composed_query = keyword
                else:
                    base_terms = f'"{keyword}" OR "preciso de {keyword}" OR "quem faz {keyword}" OR "indicação de {keyword}" OR "orçamento {keyword}"'
                    composed_query = f'{filter_query} ({base_terms})'.strip()
                try:
                    results = self.search_public_web(composed_query, max_results=max_results_per_query)
                except Exception:
                    continue

                for item in results:
                    if item["url"] in self.seen_urls:
                        continue
                    blob = f'{item["title"]} {item["snippet"]}'.lower()
                    matched = self._match_intent(blob) or self._keyword_match(blob, keyword) or f"query:{keyword}"
                    self.seen_urls.add(item["url"])
                    self.results.append(
                        LeadSignal(
                            source=source,
                            keyword=keyword,
                            title=item["title"],
                            snippet=item["snippet"],
                            url=item["url"],
                            matched_pattern=matched,
                        )
                    )
                time.sleep(self.pause_seconds)

    def save_csv(self, output: Path):
        output.parent.mkdir(parents=True, exist_ok=True)
        with output.open("w", newline="", encoding="utf-8") as fp:
            writer = csv.DictWriter(
                fp,
                fieldnames=["source", "keyword", "title", "snippet", "url", "matched_pattern"],
            )
            writer.writeheader()
            for row in self.results:
                writer.writerow(row.__dict__)

    def _match_intent(self, text: str) -> str:
        for pattern in INTENT_PATTERNS:
            if re.search(pattern, text, flags=re.I):
                return pattern
        return ""

    @staticmethod
    def _keyword_match(text: str, keyword: str) -> str:
        words = [word for word in re.split(r"\s+", keyword.lower()) if len(word) > 3]
        matches = sum(1 for word in words if word in text)
        return f"keyword:{keyword}" if matches >= max(1, min(2, len(words))) else ""

    @staticmethod
    def _clean_html(value: str) -> str:
        text = re.sub(r"<.*?>", " ", value)
        text = unescape(text)
        return re.sub(r"\s+", " ", text).strip()


def default_keywords() -> list[str]:
    return [
        "site para empresa",
        "criar aplicativo",
        "software sob medida",
        "automação comercial",
        "landing page",
        "dashboard empresarial",
        "sistema financeiro",
        "captação de leads",
        "inteligência artificial para empresa",
    ]


def main():
    parser = argparse.ArgumentParser(description="Coleta sinais públicos de intenção de compra em redes sociais e web aberta.")
    parser.add_argument("--keywords", nargs="*", help="Palavras-chave alvo")
    parser.add_argument("--saida", default="output/radar_demanda_social.csv", help="CSV de saída")
    parser.add_argument("--max-por-consulta", type=int, default=8, help="Máximo por consulta")
    args = parser.parse_args()

    keywords = args.keywords or default_keywords()
    radar = DemandRadar()
    radar.collect_public_intent(keywords, max_results_per_query=args.max_por_consulta)
    radar.save_csv(Path(args.saida))
    print(f"Concluído. {len(radar.results)} sinais públicos salvos em {args.saida}")


if __name__ == "__main__":
    main()