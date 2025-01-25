import os
import html2text
from bs4 import BeautifulSoup
import sys

def extract_text_from_html_dir(directory):
    """
    Extracts text from all HTML files in a directory, skipping files with errors.
    """
    extracted_text = {}
    for filename in os.listdir(directory):
        if filename.endswith(".html") or filename.endswith(".htm"):
            filepath = os.path.join(directory, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    html_content = f.read()
                    soup = BeautifulSoup(html_content, "html.parser")
                    for tag in soup(["script", "style"]):
                        tag.decompose()
                    text = soup.get_text(separator="\n", strip=True)
                    extracted_text[filename] = text
            except Exception as e:
                print(f"Error processing {filename}: {e}", file=sys.stderr)  # Print to stderr
    return extracted_text

if __name__ == "__main__":
    html_directory = "src"  # Replace with the actual path
    extracted_data = extract_text_from_html_dir(html_directory)

    for filename, text in extracted_data.items():
        try:
            sys.stdout.buffer.write((f"Text extracted from {filename}:\n{text[:500]}...\n").encode('utf-8'))
        except UnicodeEncodeError as e:
            print(f"Encoding error for {filename} (output skipped): {e}", file=sys.stderr)


        # Optional: Save to files (with error handling)
        try:
            output_filename = f"txt/{filename}.txt"
            with open(output_filename, "w", encoding="utf-8") as outfile:
                outfile.write(text)
        except Exception as e:
           print(f"Error saving {filename}: {e}", file=sys.stderr)