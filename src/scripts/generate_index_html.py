import os

def generate_index_html(webapps_dir="src/webapps", output_file="index.html"):
    """Generates an index.html file with links to all HTML files in the webapps directory and subdirectories."""

    html_files = []
    for root, dirs, files in os.walk(webapps_dir):
        for file in files:
            if file.endswith(".html"):
                # Relative path from webapps_dir
                rel_path = os.path.relpath(os.path.join(root, file), webapps_dir).replace('\\', '/')
                html_files.append(rel_path)

    html_files.sort()  # Sort the files alphabetically

    with open(output_file, "w", encoding="utf-8") as f:
        f.write("<!DOCTYPE html>\n")
        f.write("<html lang=\"en\">\n")
        f.write("<head>\n")
        f.write("    <meta charset=\"UTF-8\">\n")
        f.write("    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n")
        f.write("    <title>Web Apps Collection</title>\n")
        f.write("</head>\n")
        f.write("<body>\n")
        f.write("    <h1>My Web Apps</h1>\n")
        for html_file in html_files:
            category = html_file.split('/')[0] if '/' in html_file else 'Root'
            f.write(f"        <li><a href=\"{os.path.join(webapps_dir, html_file)}\">{html_file}</a> ({category})</li>\n")
        f.write("    </ul>\n")
        f.write("</body>\n")
        f.write("</html>\n")

if __name__ == "__main__":
    generate_index_html()