Okay, I see the updated directory structure. You want to run the script from within the `webapps/src` directory, and the structure is now:

```
webapps/src/
├── scripts/
│   ├── README.md
│   ├── extract.py
│   └── merge_webapps.sh
├── webapps-1/
├── webapps-2/
├── webapps-3/
└── webapps-all/  (This is where the merged files will go)
```

I'll refactor the script to work correctly with this layout. Here's the adjusted version:

```bash
#!/bin/bash

# Parent directory (now the current directory where the script is run)
parent_dir="." 
# Target directory for merged files (relative to the current directory)
target_dir="webapps-all"

# Create the target directory if it doesn't exist
mkdir -p "$target_dir"

# Counter for the new sequential numbering
counter=1

# Loop through the webapps directories in the desired order
for dir_num in 1 2 3; do
    source_dir="${parent_dir}/webapps-${dir_num}"

    # Check if the source directory exists
    if [ ! -d "$source_dir" ]; then
        echo "Warning: Directory $source_dir does not exist. Skipping."
        continue
    fi

    # Loop through files in the current source directory
    for file in "$source_dir"/*.html; do
        # Extract the base filename (without path)
        filename=$(basename "$file")

        # Extract the descriptive part of the filename
        desc="${filename#*-}"

        # Pad the counter with leading zeros
        padded_counter=$(printf "%03d" "$counter")

        # Construct the new filename (relative to target_dir)
        new_filename="${target_dir}/${padded_counter}-${desc}"

        # Copy and rename the file (using -i for interactive mode)
        cp -i "$file" "$new_filename"

        # Increment the counter
        counter=$(expr "$counter" + 1)
    done
done

echo "Files merged and renumbered into: $target_dir"
```

**Changes:**

1. **`parent_dir="."`:** The `parent_dir` is now set to ".", which represents the current directory (where you run the script from).
2. **`target_dir="webapps-all"`:** The `target_dir` is now simply "webapps-all" because it's a direct subdirectory of where the script is run.
3. **`new_filename="${target_dir}/${padded_counter}-${desc}"`:** The `new_filename` is constructed relative to the `target_dir`.

**How to Use:**

1. **Save:** Save this updated script in your `webapps/src/scripts` directory (or wherever you prefer).
2. **Make Executable:** `chmod +x merge_webapps.sh`
3. **Navigate:** Go to the `webapps/src` directory in your terminal: `cd webapps/src`
4. **Run:** Execute the script from the `webapps/src` directory. Since the script is in the `scripts` subdirectory, run it like this: `./scripts/merge_webapps.sh`

This refactored script should work flawlessly within your updated directory structure. It will correctly merge the contents of `webapps-1`, `webapps-2`, and `webapps-3` into `webapps-all`, maintaining the correct order and sequential numbering, while you run it from within `webapps/src`.
