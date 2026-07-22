from pathlib import Path
import base64
import gzip
import runpy
import tempfile

root = Path(__file__).resolve().parents[1]
payload = (root / "tools/evolutions_patch.b64").read_text(encoding="utf-8").strip()
source = gzip.decompress(base64.b64decode(payload))

with tempfile.NamedTemporaryFile("wb", suffix=".py", delete=False) as handle:
    handle.write(source)
    temp_path = handle.name

runpy.run_path(temp_path, run_name="__main__")
