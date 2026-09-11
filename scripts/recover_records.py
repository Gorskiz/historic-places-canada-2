"""Recover explicitly identified CRHP records; never infer records from ID gaps.

Python 3.10+, standard library only. Downloads are cached and imports only insert
missing (id, language) pairs. Image source references are retained separately;
they must be mirrored before adding them to the production images table.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import gzip
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import time
from urllib.error import HTTPError
from urllib.parse import parse_qs, urljoin, urlparse
from urllib.request import Request, urlopen

ORIGIN = 'https://www.historicplaces.ca'
PROVINCES = (
    'Newfoundland and Labrador', 'Terre-Neuve-et-Labrador', 'Terre-Neuve et Labrador',
    'Northwest Territories', 'Territoires du Nord-Ouest',
    'Prince Edward Island', 'Île-du-Prince-Édouard',
    'British Columbia', 'Colombie-Britannique',
    'New Brunswick', 'Nouveau-Brunswick', 'Nova Scotia', 'Nouvelle-Écosse',
    'Alberta', 'Saskatchewan', 'Manitoba', 'Ontario', 'Quebec', 'Québec',
    'Nunavut', 'Yukon',
)
FIELDS = {
    'name': 'PlaceCommonName', 'address': 'PlaceStreetAddress',
    'jurisdiction': 'Jurisdiction', 'recognition_authority': 'RecognitionAuthority',
    'recognition_statute': 'RecognitionStatute', 'recognition_type': 'RecognitionType',
    'recognition_date': 'RecognitionDate', 'description': 'Description',
    'heritage_value': 'HeritageValue', 'character_elements': 'CharacterDefiningElements',
    'significant_dates': 'SignificantDates', 'architect': 'Architect',
    'builder': 'Builder', 'status': 'Status',
}


def clean_text(parts):
    return '\n'.join(' '.join(line.split()) for line in ''.join(parts).splitlines() if line.strip())


class PlaceParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta = {}
        self.labels = {}
        self.images = []
        self.active_label = None
        self.span_depth = 0
        self.heading = None
        self.in_themes = False
        self.theme_item = None
        self.themes = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        element_id = attrs.get('id', '')
        if tag == 'meta' and 'name' in attrs:
            self.meta[attrs['name']] = attrs.get('content', '')
        if tag == 'span':
            if self.active_label:
                self.span_depth += 1
            elif '_PlacePage1_lbl' in element_id:
                self.active_label = element_id.split('_PlacePage1_lbl')[-1]
                self.labels[self.active_label] = []
                self.span_depth = 1
        if tag in ('p', 'br', 'li') and self.active_label:
            self.labels[self.active_label].append('\n')
        if tag == 'h3':
            self.heading = []
            self.in_themes = False
        if tag in ('dt', 'dd') and self.in_themes:
            self.theme_item = []
        if tag == 'img' and re.search(r'_PlacePage1_imgImage\d+$', element_id):
            url = urljoin(ORIGIN, attrs.get('src', ''))
            if url.startswith(ORIGIN + '/hpimages/') and urlparse(url).path.rsplit('/', 1)[-1].lower() != 'noimage.gif':
                self.images.append({'url': url, 'alt': attrs.get('alt', ''),
                                    'title': attrs.get('title', ''), 'display_order': len(self.images)})

    def handle_endtag(self, tag):
        if tag == 'span' and self.active_label:
            self.span_depth -= 1
            if self.span_depth == 0:
                self.active_label = None
        if tag == 'h3' and self.heading is not None:
            heading = clean_text(self.heading).casefold()
            self.in_themes = heading.startswith(('theme -', 'thème -'))
            self.heading = None
        if tag in ('dt', 'dd') and self.theme_item is not None:
            self.themes.append(clean_text(self.theme_item))
            self.theme_item = None

    def handle_data(self, data):
        if self.active_label:
            self.labels[self.active_label].append(data)
        if self.heading is not None:
            self.heading.append(data)
        if self.theme_item is not None:
            self.theme_item.append(data)


def parse_record(html, place_id, language):
    parser = PlaceParser()
    parser.feed(html)
    if parser.meta.get('PlaceId') != str(place_id):
        raise ValueError('Missing or mismatched PlaceId')
    expected_language = {'en': 'English', 'fr': 'French'}[language]
    if parser.meta.get('Language') != expected_language:
        raise ValueError('Missing or mismatched record language')
    place = {'id': place_id, 'language': language}
    place.update({key: clean_text(parser.labels.get(label, [])) or None for key, label in FIELDS.items()})
    if not place['name']:
        raise ValueError('Missing place name')
    location = parser.meta.get('LocationDisplay') or parser.meta.get('Location', '')
    parts = [part.strip() for part in location.split(',')]
    province_index = next((i for i in range(len(parts) - 1, -1, -1) if parts[i] in PROVINCES), None)
    place['province'] = parts[province_index] if province_index is not None else None
    place['municipality'] = parts[province_index - 1] if province_index is not None and province_index > 0 else None
    for field, meta_key, maximum in [('latitude', 'PlaceLatitude', 90), ('longitude', 'PlaceLongitude', 180)]:
        value = parser.meta.get(meta_key, '')
        try:
            number = float(value)
            place[field] = number if -maximum <= number <= maximum else None
        except ValueError:
            place[field] = None
    place['themes'] = ', '.join(parser.themes) or None
    place['scraped_at'] = datetime.now(timezone.utc).isoformat()
    place['url'] = f'{ORIGIN}/{language}/rep-reg/place-lieu.aspx?id={place_id}'
    return {'place': place, 'images': parser.images}


def sql_value(value):
    if value is None:
        return 'NULL'
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + value.replace("'", "''") + "'"


def record_sql(record):
    place = record['place']
    columns = ', '.join('"' + key + '"' for key in place)
    values = ', '.join(sql_value(value) for value in place.values())
    return (f'INSERT INTO places ({columns}) SELECT {values} WHERE NOT EXISTS '
            f'(SELECT 1 FROM places WHERE id = {sql_value(place["id"])} '
            f'AND language = {sql_value(place["language"])});\n')


def export_sql_batches(source, output, batch_size=100):
    if batch_size < 1:
        raise ValueError('Batch size must be positive')
    # A new directory prevents stale chunks from an older export being imported.
    output.mkdir(parents=True, exist_ok=False)
    paths = []
    batch = []
    with gzip.open(source, 'rt', encoding='utf-8') as stream:
        for line in stream:
            batch.append(record_sql(json.loads(line)))
            if len(batch) == batch_size:
                path = output / f'{len(paths) + 1:04d}.sql'
                path.write_text(''.join(batch), encoding='utf-8')
                paths.append(path)
                batch = []
    if batch:
        path = output / f'{len(paths) + 1:04d}.sql'
        path.write_text(''.join(batch), encoding='utf-8')
        paths.append(path)
    return paths


def recover_one(place_id, language, cache):
    cached = cache / f'{place_id}-{language}.json'
    if cached.exists():
        try:
            result = json.loads(cached.read_text(encoding='utf-8'))
            if result['status'] in ('recovered', 'unavailable'):
                return result
        except (json.JSONDecodeError, KeyError):
            pass  # Retry a cache file interrupted during an earlier run.
    url = f'{ORIGIN}/{language}/rep-reg/place-lieu.aspx?id={place_id}'
    result = {'id': place_id, 'language': language, 'url': url}
    for attempt in range(3):
        try:
            request = Request(url, headers={'User-Agent': 'HistoricPlacesCanada2-Recovery/1.0 (+https://github.com/Gorskiz/historic-places-canada-2)'})
            with urlopen(request, timeout=20) as response:
                final_url = response.url
                html = response.read().decode('utf-8-sig')
            parsed_url = urlparse(final_url)
            if parsed_url.hostname != 'www.historicplaces.ca':
                raise ValueError(f'Unexpected redirect: {final_url}')
            if parsed_url.path in (f'/{language}/rep-reg/search-recherche.aspx', f'/{language}/rep-reg/recherche-search.aspx'):
                result.update(status='unavailable', reason='redirect', final_url=final_url)
            elif parsed_url.path != f'/{language}/rep-reg/place-lieu.aspx' or parse_qs(parsed_url.query).get('id') != [str(place_id)]:
                raise ValueError('Redirected to a different record')
            else:
                record = parse_record(html, place_id, language)
                result.pop('reason', None)
                result.update(status='recovered', record=record)
            break
        except HTTPError as error:
            if error.code in (404, 410):
                result.update(status='unavailable', reason=f'HTTP {error.code}')
                break
            result.update(status='error', reason=str(error))
        except Exception as error:
            result.update(status='error', reason=str(error))
        if attempt < 2:
            time.sleep(2 ** (attempt + 1))
    temporary = cached.with_suffix('.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
    temporary.replace(cached)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ids', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--export-sql', type=Path, help='Export existing records to a NEW directory of 100-record SQL batches; no downloads')
    parser.add_argument('--cache', type=Path, default=Path('.cache/recovery'))
    parser.add_argument('--workers', type=int, default=4, choices=range(1, 9))
    args = parser.parse_args()
    if args.export_sql:
        paths = export_sql_batches(args.output / 'records.jsonl.gz', args.export_sql)
        print(f'Exported {len(paths)} SQL batches to {args.export_sql}')
        return 0
    if not args.ids:
        parser.error('--ids is required for recovery')
    ids = sorted({int(line.strip()) for line in args.ids.read_text(encoding='utf-8-sig').splitlines() if line.strip()})
    if not ids or any(place_id <= 0 for place_id in ids):
        parser.error('IDs must be positive integers')
    args.output.mkdir(parents=True, exist_ok=True)
    args.cache.mkdir(parents=True, exist_ok=True)
    results = []
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        tasks = [pool.submit(recover_one, place_id, language, args.cache) for place_id in ids for language in ('en', 'fr')]
        for task in as_completed(tasks):
            results.append(task.result())
            if len(results) % 100 == 0 or len(results) == len(tasks):
                counts = {status: sum(row['status'] == status for row in results) for status in ('recovered', 'unavailable', 'error')}
                print(f'{len(results)}/{len(tasks)} {counts}', flush=True)
    results.sort(key=lambda row: (row['id'], row['language']))
    with gzip.open(args.output / 'records.jsonl.gz', 'wt', encoding='utf-8') as records, gzip.open(args.output / 'places.sql.gz', 'wt', encoding='utf-8') as sql:
        for result in results:
            if result['status'] == 'recovered':
                record = result.pop('record')
                records.write(json.dumps(record, ensure_ascii=False) + '\n')
                sql.write(record_sql(record))
    report = {'source_issue': 'https://github.com/Gorskiz/historic-places-canada-2/issues/9',
              'generated_at': datetime.now(timezone.utc).isoformat(), 'candidate_ids': len(ids),
              'counts': {status: sum(row['status'] == status for row in results) for status in ('recovered', 'unavailable', 'error')},
              'results': results}
    (args.output / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report['counts']), flush=True)
    return 1 if report['counts']['error'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
