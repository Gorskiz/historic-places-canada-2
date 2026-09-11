# Missing-record recovery (issue #9)

`candidate-ids.txt` is the reporter's list of 2,534 IDs from
[issue #9](https://github.com/Gorskiz/historic-places-canada-2/issues/9#issuecomment-3923828258),
downloaded from the [attachment](https://github.com/user-attachments/files/25402216/missing_records.txt).
None appears among the 11,082 English records in the project's v1.0 JSON archive.
The archive also contains 11,063 French records. This is an audit of the reported
IDs, not proof that every record on the source site has been discovered.

Recovery results (2026-09-11): **2,500 places recovered in both languages**
(5,000 language records). All recovered records have province and municipality
metadata; 2,473 per language have both coordinates. Another 28 IDs redirect to
the search page in both languages. Six IDs still time out in both languages
after three attempts per request: **22454, 22455, 22456, 22457, 22475, 22514**.
These remain unresolved; issue #9 should stay open until they are recovered or
their absence is confirmed. `report.json` records every result.

The recovery files contain:

- `records.jsonl.gz`: UTF-8 JSON lines containing API-compatible `place` objects
  and source image references, including their attribution text.
- `places.sql.gz`: additive SQL for the existing `places` table. Each insert
  checks `(id, language)` and preserves records already present, including
  curated changes. It is safe to apply the same file again.
- `report.json`: the result for every ID in both languages. `unavailable` means
  an explicit HTTP 404/410 or redirect to the source site's search page;
  `error` means recovery must be retried. The counts are language records,
  not distinct historic places.

Source: the Canadian Register of Historic Places, `www.historicplaces.ca`.
Every recovered place retains its source URL and retrieval timestamp. The
repository's data-use and attribution conditions apply to these files.

## Repeat or resume recovery

Requires Python 3.10 or later; no extra packages are needed. Run from the repo root:

```sh
python scripts/recover_records.py --ids data/recovery/issue-9/candidate-ids.txt --output data/recovery/issue-9
python -m unittest discover -s test -p test_recover_records.py
```

On Windows, use `py -3` in place of `python` if necessary. The default is four
concurrent requests. Completed requests are cached in `.cache/recovery`;
failed downloads are retried on the next run. If changing the parser, use a
fresh `--cache` directory to regenerate records. A run with unresolved errors
exits with code 1 and still writes the successful recoveries and report.

## Import

The checked-in `historic_places.db` is a zero-byte placeholder. Use the existing
populated database and its schema; this patch does not create or replace them.
Export the recovered records into a new directory of 100-record SQL batches:

```sh
python scripts/recover_records.py --output data/recovery/issue-9 --export-sql .cache/issue-9-sql
```

This export does not make network requests. Use a new directory for each export
to avoid accidentally including stale files. Batches avoid the large single-file
import stalling observed in the local Wrangler runtime.

Validate against a populated local copy before importing into the hosted
database. In PowerShell:

```powershell
Get-ChildItem .cache/issue-9-sql/*.sql | Sort-Object Name | ForEach-Object {
    npx wrangler d1 execute historic-canada-db --local --file $_.FullName
    if ($LASTEXITCODE -ne 0) { throw "Import failed: $($_.Name)" }
}
```

For deployment, apply the same batches using Wrangler's `--remote` option to the
existing database. Applying this data patch and deploying the Worker are
separate operations; a code deployment does not import data or update the
v1.0 release archive.

Images are **references to the original source**, not new R2 uploads. The SQL
only inserts place records. Mirror those images to the project's image storage
and add their image-table rows as a separate preservation step. Until then,
recovered places are available to search and the map after import, but will
not appear in the image-only home-page listings.
