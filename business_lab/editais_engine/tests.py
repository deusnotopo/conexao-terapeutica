import json
import tempfile
import unittest
from pathlib import Path

from acquisition import SourceConfig, compute_source_fingerprint, run_collection_cycle
from document_ingestion import ingest_file
from exporter import export_rows_to_csv, export_rows_to_json
from persistence import get_connection, get_notice_version_summary, init_db, upsert_notices
from profiles import load_profile_registry


class AcquisitionTests(unittest.TestCase):
    def test_http_json_strategy_uses_remote_payload_fingerprint(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            fixture = Path(temp_dir) / "fixture.json"
            fixture.write_text(
                json.dumps(
                    {
                        "items": [
                            {
                                "id": "abc",
                                "title": "Edital teste",
                                "body": "Corpo do edital em SP com R$ 100.000,00",
                                "deadline_days": 12,
                            }
                        ]
                    },
                    ensure_ascii=False,
                ),
                encoding="utf-8",
            )

            config = SourceConfig(
                name="live",
                listing_url=f"file:///{fixture.as_posix()}",
                strategy="http_json_v1",
                metadata={"remote_url": f"file:///{fixture.as_posix()}"},
            )
            notices, runs = run_collection_cycle([config], {})

            self.assertEqual(len(notices), 1)
            expected = compute_source_fingerprint(fixture.read_text(encoding="utf-8"))
            self.assertEqual(runs[0].source_fingerprint, expected)


class ExporterTests(unittest.TestCase):
    def test_export_json_and_csv(self):
        rows = [{"id": "1", "bucket": "ataque_imediato", "score": 90.0}]
        with tempfile.TemporaryDirectory() as temp_dir:
            json_path = export_rows_to_json(rows, str(Path(temp_dir) / "rankings.json"))
            csv_path = export_rows_to_csv(rows, str(Path(temp_dir) / "rankings.csv"))

            self.assertTrue(Path(json_path).exists())
            self.assertTrue(Path(csv_path).exists())
            self.assertIn("ataque_imediato", Path(json_path).read_text(encoding="utf-8"))
            self.assertIn("bucket", Path(csv_path).read_text(encoding="utf-8"))


class PersistenceTests(unittest.TestCase):
    def test_notice_versions_are_deduplicated_by_hash(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = str(Path(temp_dir) / "editais.db")
            conn = get_connection(db_path)
            init_db(conn)
            notice = type("Notice", (), {})
            n1 = notice()
            n1.source = "s"
            n1.source_id = "1"
            n1.title = "A"
            n1.body = "B"
            n1.metadata = {}
            n2 = notice()
            n2.source = "s"
            n2.source_id = "1"
            n2.title = "A"
            n2.body = "B"
            n2.metadata = {}
            upsert_notices(conn, [n1, n2])
            rows = get_notice_version_summary(conn)
            self.assertEqual(rows[0]["versions"], 1)
            conn.close()


class ProfileTests(unittest.TestCase):
    def test_profile_registry_loads_external_profiles(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config = Path(temp_dir) / "profiles.json"
            config.write_text(
                json.dumps({
                    "profiles": [{
                        "name": "externo",
                        "target_regions": ["SP"],
                        "positive_tags": ["engenharia"],
                        "negative_tags": [],
                        "required_capabilities": [],
                        "minimum_value": 1,
                        "maximum_value": 2,
                        "minimum_deadline_days": 3
                    }]}
                ),
                encoding="utf-8",
            )
            registry = load_profile_registry(str(config))
            self.assertIn("externo", registry)


class IngestionTests(unittest.TestCase):
    def test_csv_ingestion_extracts_table_text(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            csv_file = Path(temp_dir) / "planilha.csv"
            csv_file.write_text("coluna_a,coluna_b\n1,2\n", encoding="utf-8")
            document = ingest_file(str(csv_file))
            self.assertEqual(document.source_type, "csv")
            self.assertIn("coluna_a", document.extracted_text)


if __name__ == "__main__":
    unittest.main()
