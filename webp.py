"""
웹사이트 이미지 WebP 변환 및 HTML 최적화 스크립트

기능:
  1. prettify_all_html_files    - HTML 파일 들여쓰기 자동 정리
  2. convert_images_to_webp     - JPG/PNG 이미지를 WebP로 변환 (원본 유지, 동일 경로에 .webp 생성)
  3. convert_html_img_tags      - HTML의 <img> 태그를 <picture> + <source> 구조로 변환 (WebP 우선, 원본 fallback)

  모든 기능은 지정한 디렉토리의 하위 폴더를 재귀적으로 탐색합니다.

실행:
  python webp.py <디렉토리 경로>
  예) python webp.py "C:/project/static/src"

  기본적으로 convert_images_to_webp만 실행됨.
  다른 기능을 사용하려면 하단 __main__ 블록에서 주석을 해제할 것.

의존성:
  pip install Pillow beautifulsoup4
"""

from pathlib import Path
from PIL import Image
from bs4 import BeautifulSoup

# 1. HTML 들여쓰기 정리
def prettify_all_html_files(root_dir):
    for html_path in Path(root_dir).rglob("*.html"):
        try:
            print(f"[Prettify 🔍] Processing: {html_path}")
            with open(html_path, "r", encoding="utf-8") as f:
                soup = BeautifulSoup(f, "html.parser")

            with open(html_path, "w", encoding="utf-8") as f:
                f.write(soup.prettify())

            print(f"[Prettify 💾] Formatted: {html_path}")

        except Exception as e:
            print(f"[Prettify ❌] {html_path} - {e}")

# 2. 이미지 파일을 WebP로 변환
def convert_images_to_webp_recursively(root_dir):
    for img_path in Path(root_dir).rglob("*.[jp][pn]g"):
        webp_path = img_path.with_suffix(".webp")
        if not webp_path.exists():
            try:
                with Image.open(img_path) as img:
                    img.save(webp_path, "webp")
                print(f"[Image ✅] {img_path} → {webp_path}")
            except Exception as e:
                print(f"[Image ❌] {img_path} - {e}")

# 3. <img> 태그를 <picture> 구조로 변환
def convert_html_img_tags_recursively(root_dir):
    for html_path in Path(root_dir).rglob("*.html"):
        try:
            print(f"[HTML 🔍] Processing: {html_path}")
            with open(html_path, "r", encoding="utf-8") as f:
                soup = BeautifulSoup(f, "html.parser")

            modified = False
            for img in soup.find_all("img"):
                src = img.get("src")
                if not src or not (src.endswith(".jpg") or src.endswith(".png")) or src.endswith(".webp") or src.startswith("http"):
                    continue

                webp_src = Path(src).with_suffix(".webp")

                picture = soup.new_tag("picture")
                source = soup.new_tag("source", srcset=str(webp_src), type="image/webp")
                picture.append(source)

                img.insert_before(picture)  # 기존 위치에 <picture> 삽입
                picture.append(img)         # <img>를 안으로 이동 (fallback 역할)

                print(f"[HTML ✅] Wrapped <img src='{src}'> in <picture>")
                modified = True

            if modified:
                with open(html_path, "w", encoding="utf-8") as f:
                    f.write(soup.prettify())
                print(f"[HTML 💾] Overwritten: {html_path}")

        except Exception as e:
            print(f"[HTML ❌] {html_path} - {e}")

# 실행 시작
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="이미지 WebP 변환 및 HTML 처리 도구")
    parser.add_argument("path", type=str, help="처리할 루트 디렉토리 경로")
    args = parser.parse_args()

    root_dir = Path(args.path)
    if not root_dir.exists() or not root_dir.is_dir():
        print(f"[Error] 유효하지 않은 경로입니다: {root_dir}")
        exit(1)

    # prettify_all_html_files(root_dir)
    convert_images_to_webp_recursively(root_dir)
    # convert_html_img_tags_recursively(root_dir)
