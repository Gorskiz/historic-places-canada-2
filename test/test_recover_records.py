import sqlite3
import json
import gzip
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from scripts.recover_records import parse_record, record_sql, recover_one, export_sql_batches


PAGE = '''<html lang="en"><head>
<meta name="PlaceId" content="25583"><meta name="Language" content="English">
<meta name="CommonName" content="Tailors &amp; Co.">
<meta name="Location" content="314 W Hastings St, Vancouver, British Columbia">
<meta name="PlaceLatitude" content="49.2828"><meta name="PlaceLongitude" content="-123.110590">
</head><body>
<span id="prefix_PlacePage1_lblPlaceCommonName">Tailors &amp; Co.</span>
<span id="prefix_PlacePage1_lblPlaceStreetAddress">314 W Hastings St, Vancouver, British Columbia, Canada</span>
<span id="prefix_PlacePage1_lblDescription">A shop.</span>
<span id="prefix_PlacePage1_lblHeritageValue">First paragraph.</p><p>Second &amp; third.</span>
<span id="prefix_PlacePage1_lblCharacterDefiningElements">Roof<br/>Windows</span>
<span id="prefix_PlacePage1_lblRecognitionDate">2023/06/29</span>
<h3>Theme - Category and Type</h3><p><dl><dt>Developing Economies</dt><dd>Trade</dd></dl></p>
<h3>Function - Category and Type</h3><dl><dt>Commerce</dt><dd>Shop</dd></dl>
<img id="prefix_PlacePage1_imgImage1" src="/hpimages/Thumbnails/93604_Medium.jpg" alt="Shop; Photographer" title="Front">
<img id="prefix_PlacePage1_imgImage2" src="/hpimages/noimage.gif">
<img id="prefix_PlacePage1_imgNearby1" src="/nearby.jpg">
</body></html>'''


class RecoveryTests(unittest.TestCase):
    def test_extracts_record_and_preserves_paragraphs_and_image_attribution(self):
        record = parse_record(PAGE, 25583, 'en')
        self.assertEqual(record['place']['name'], 'Tailors & Co.')
        self.assertEqual(record['place']['province'], 'British Columbia')
        self.assertEqual(record['place']['municipality'], 'Vancouver')
        self.assertEqual(record['place']['latitude'], 49.2828)
        self.assertEqual(record['place']['heritage_value'], 'First paragraph.\nSecond & third.')
        self.assertEqual(record['place']['character_elements'], 'Roof\nWindows')
        self.assertEqual(record['place']['themes'], 'Developing Economies, Trade')
        self.assertEqual(record['images'], [{
            'url': 'https://www.historicplaces.ca/hpimages/Thumbnails/93604_Medium.jpg',
            'alt': 'Shop; Photographer', 'title': 'Front', 'display_order': 0,
        }])

    def test_rejects_search_pages_wrong_ids_and_wrong_languages(self):
        for html in ['<title>Search</title>', PAGE.replace('content="25583"', 'content="123"'),
                     PAGE.replace('content="English"', 'content="French"')]:
            with self.assertRaises(ValueError):
                parse_record(html, 25583, 'en')

    def test_french_labels_and_missing_coordinates(self):
        page = PAGE.replace('English', 'French').replace('British Columbia', 'Colombie-Britannique')
        page = page.replace('Theme - Category and Type', 'Thème - Catégorie et type')
        page = page.replace('content="49.2828"', 'content=""')
        record = parse_record(page, 25583, 'fr')
        self.assertEqual(record['place']['province'], 'Colombie-Britannique')
        self.assertEqual(record['place']['language'], 'fr')
        self.assertIsNone(record['place']['latitude'])
        self.assertEqual(record['place']['themes'], 'Developing Economies, Trade')

    def test_prefers_display_location_with_french_accents(self):
        page = PAGE.replace('English', 'French').replace('314 W Hastings St, Vancouver, British Columbia', '9707 Highway 4, Tracadie, Nouvelle-Ecosse')
        page = page.replace('</head>', '<meta name="LocationDisplay" content="9707 Highway 4, Tracadie, Nouvelle-Écosse"></head>')
        record = parse_record(page, 25583, 'fr')
        self.assertEqual(record['place']['province'], 'Nouvelle-Écosse')
        self.assertEqual(record['place']['municipality'], 'Tracadie')

    def test_recognizes_source_newfoundland_spelling(self):
        page = PAGE.replace('English', 'French').replace('314 W Hastings St, Vancouver, British Columbia', 'Fogo, Terre-Neuve et Labrador')
        record = parse_record(page, 25583, 'fr')
        self.assertEqual(record['place']['province'], 'Terre-Neuve et Labrador')
        self.assertEqual(record['place']['municipality'], 'Fogo')

    def test_sql_is_additive_repeatable_and_handles_quotes(self):
        record = parse_record(PAGE.replace('A shop.', "A tailor's shop."), 25583, 'en')
        db = sqlite3.connect(':memory:')
        columns = ', '.join('"' + key + '"' for key in record['place'])
        db.execute(f'CREATE TABLE places ({columns}, PRIMARY KEY(id, language))')
        sql = record_sql(record)
        db.executescript(sql)
        db.executescript(sql)
        self.assertEqual(db.execute('SELECT description FROM places').fetchall(), [("A tailor's shop.",)])
        db.execute("UPDATE places SET name = 'Curated name'")
        db.executescript(sql)
        self.assertEqual(db.execute('SELECT name FROM places').fetchone()[0], 'Curated name')
        record['place']['language'] = 'fr'
        db.executescript(record_sql(record))
        self.assertEqual(db.execute('SELECT COUNT(*) FROM places').fetchone()[0], 2)

    def test_retries_download_errors_and_repairs_a_truncated_cache(self):
        class Response:
            url = 'https://www.historicplaces.ca/en/rep-reg/place-lieu.aspx?id=25583'

            def __enter__(self):
                return self

            def __exit__(self, *args):
                pass

            def read(self):
                return PAGE.encode('utf-8')

        with tempfile.TemporaryDirectory() as directory:
            cache = Path(directory)
            (cache / '25583-en.json').write_text('{', encoding='utf-8')
            with patch('scripts.recover_records.urlopen', side_effect=[TimeoutError('timeout'), Response()]), patch('scripts.recover_records.time.sleep'):
                result = recover_one(25583, 'en', cache)
            self.assertEqual(result['status'], 'recovered')
            self.assertNotIn('reason', result)
            self.assertEqual(result['record']['place']['name'], 'Tailors & Co.')
            self.assertEqual(json.loads((cache / '25583-en.json').read_text(encoding='utf-8'))['status'], 'recovered')
            # A resumed run needs no network for a successfully cached record.
            with patch('scripts.recover_records.urlopen', side_effect=AssertionError('unexpected download')):
                self.assertEqual(recover_one(25583, 'en', cache), result)

    def test_only_known_search_redirects_count_as_unavailable(self):
        class Response:
            def __init__(self, url):
                self.url = url

            def __enter__(self):
                return self

            def __exit__(self, *args):
                pass

            def read(self):
                return b'<h1>Search or maintenance</h1>'

        for destination, status in [
            ('https://www.historicplaces.ca/en/rep-reg/search-recherche.aspx', 'unavailable'),
            ('https://www.historicplaces.ca/maintenance.html', 'error'),
        ]:
            with tempfile.TemporaryDirectory() as directory:
                with patch('scripts.recover_records.urlopen', return_value=Response(destination)), patch('scripts.recover_records.time.sleep'):
                    result = recover_one(25583, 'en', Path(directory))
                self.assertEqual(result['status'], status)

    def test_sql_batches_preserve_multiline_values_and_refuse_stale_output(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'records.jsonl.gz'
            first = parse_record(PAGE, 25583, 'en')
            first['place']['description'] = "A semicolon;\nand a tailor's shop."
            second = json.loads(json.dumps(first))
            second['place']['language'] = 'fr'
            with gzip.open(source, 'wt', encoding='utf-8') as stream:
                for record in [first, second]:
                    stream.write(json.dumps(record) + '\n')
            target = Path(directory) / 'sql'
            paths = export_sql_batches(source, target, batch_size=1)
            self.assertEqual(len(paths), 2)
            self.assertEqual(paths[0].read_text(encoding='utf-8'), record_sql(first))
            self.assertEqual(paths[1].read_text(encoding='utf-8'), record_sql(second))
            with self.assertRaises(FileExistsError):
                export_sql_batches(source, target, batch_size=1)


if __name__ == '__main__':
    unittest.main()
