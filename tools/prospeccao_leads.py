import argparse
import csv
import re
import time
from pathlib import Path
from urllib.parse import quote_plus

import requests


EMAIL_RE = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
PHONE_RE = r"(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9?\d{4})[-\s]?\d{4}"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
}


class Prospector:
    def __init__(self):
        self.leads = []
        self.seen = set()
        self.session = requests.Session()
        self.session.headers.update(HEADERS)

    def extract_emails(self, html: str):
        emails = set(re.findall(EMAIL_RE, html or ""))
        blocked = ("example", "wixpress", "sentry", ".png", ".jpg", ".jpeg", ".webp", ".svg")
        return sorted(email for email in emails if not any(b in email.lower() for b in blocked))

    def extract_phones(self, html: str):
        phones = set(re.findall(PHONE_RE, html or ""))
        cleaned = []
        for phone in phones:
            digits = re.sub(r"\D", "", phone)
            if len(digits) >= 10:
                cleaned.append(phone.strip())
        return sorted(set(cleaned))

    def scrape_maps(self, query: str, max_results: int = 15):
        url = f"https://www.bing.com/search?q={quote_plus(query)}"
        response = self.session.get(url, timeout=20)
        response.raise_for_status()
        html = response.text

        results = self._extract_bing_results(html)

        count = 0
        for item in results:
            if count >= max_results:
                break

            website = item.get("url", "")
            company = self._clean_html(item.get("title", "")) or f"Empresa {count + 1}"
            if company in self.seen:
                continue
            self.seen.add(company)

            snippet = self._clean_html(item.get("snippet", ""))
            email = ""
            phone = ""

            if website and website.startswith("http"):
                try:
                    site_response = self.session.get(website, timeout=15)
                    site_html = site_response.text
                    emails = self.extract_emails(site_html)
                    phones = self.extract_phones(site_html)
                    email = ", ".join(emails[:3])
                    phone = ", ".join(phones[:3])
                except Exception:
                    pass

            self.leads.append(
                {
                    "empresa": company,
                    "telefone": phone,
                    "site": website,
                    "email": email,
                    "nota": "",
                    "consulta": query if not snippet else f"{query} | {snippet[:120]}",
                }
            )
            count += 1

    def _extract_bing_results(self, html: str):
        results = []
        matches = re.finditer(
            r'<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>\s*</h2>(?:[\s\S]{0,1600}?<p[^>]*>(.*?)</p>)?',
            html,
            re.S,
        )
        for url_match in matches:
            results.append(
                {
                    "url": url_match.group(1),
                    "title": url_match.group(2),
                    "snippet": url_match.group(3) if url_match.lastindex and url_match.group(3) else "",
                }
            )
        return results

    @staticmethod
    def _clean_html(value: str) -> str:
        text = re.sub(r"<.*?>", " ", value or "")
        return re.sub(r"\s+", " ", text).strip()

    def save_csv(self, output: Path):
        output.parent.mkdir(parents=True, exist_ok=True)
        fields = ["empresa", "telefone", "site", "email", "nota", "consulta"]
        with output.open("w", newline="", encoding="utf-8") as fp:
            writer = csv.DictWriter(fp, fieldnames=fields)
            writer.writeheader()
            writer.writerows(self.leads)


def build_queries(city: str):
    targets = [
        "clinica odontologica",
        "advogado",
        "clinica estetica",
        "contabilidade",
        "imobiliaria",
        "clinica veterinaria",
        "escola particular",
        "empresa de energia solar",
    ]
    return [f"{target} {city}" for target in targets]


def main():
    parser = argparse.ArgumentParser(description="Coleta leads de empresas com potencial de precisar de site, app ou automação.")
    parser.add_argument("--cidade", required=True, help="Cidade alvo. Ex: Sao Paulo SP")
    parser.add_argument("--max-por-busca", type=int, default=8, help="Quantidade máxima por busca")
    parser.add_argument("--saida", default="output/leads_prospeccao.csv", help="Arquivo CSV de saída")
    args = parser.parse_args()

    prospector = Prospector()
    for query in build_queries(args.cidade):
        prospector.scrape_maps(query, args.max_por_busca)
        time.sleep(1)

    prospector.save_csv(Path(args.saida))
    print(f"Concluído. {len(prospector.leads)} leads salvos em {args.saida}")


if __name__ == "__main__":
    main()