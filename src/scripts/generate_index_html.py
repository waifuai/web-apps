import os

def generate_index_html(webapps_dir="src/webapps", output_file="index.html"):
    """Generates an index.html file with links to all HTML files in the webapps directory."""

    html_files = [f for f in os.listdir(webapps_dir) if f.endswith(".html")]
    html_files.sort()  # Sort the files alphabetically

    with open(output_file, "w") as f:
        f.write("<!DOCTYPE html>\n")
        f.write("<html lang=\"en\">\n")
        f.write("<head>\n")
        f.write("    <meta charset=\"UTF-8\">\n")
        f.write("    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n")
        f.write("    <title>Web Apps Collection</title>\n")
        f.write("</head>\n")
        f.write("<body>\n")
        f.write("    <h1>My Web Apps</h1>\n")
        f.write("    <ul>\n")
        for html_file in html_files:
            f.write(f"        <li><a href=\"{os.path.join(webapps_dir, html_file)}\">{html_file}</a></li>\n")
        f.write("    </ul>\n")
        f.write("</body>\n")
        f.write("</html>\n")

if __name__ == "__main__":
    generate_index_html()