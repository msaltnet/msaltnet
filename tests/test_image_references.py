import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class ImageReferencesTest(unittest.TestCase):
    def test_all_responsive_images_have_available_variants(self):
        metadata = json.loads((ROOT / '_data/images.json').read_text(encoding='utf-8'))
        sources = list((ROOT / '_posts').glob('*.md')) + [ROOT / '_data/projects.yml']
        references = set()
        for source in sources:
            references.update(re.findall(r'/assets/img/[\w.-]+\.(?:jpg|jpeg|png|webp)', source.read_text(encoding='utf-8')))
        for reference in sorted(references):
            with self.subTest(image=reference):
                self.assertIn(reference, metadata)
                for key in ('src', 'mobile', 'social'):
                    self.assertTrue((ROOT / metadata[reference][key].lstrip('/')).is_file())
