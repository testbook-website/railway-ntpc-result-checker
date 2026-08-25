import os
import re
import json
import pypdf

def clean_zone_name(filename):
    # Remove file extension
    name = filename.lower()
    if name.endswith(".pdf"):
        name = name[:-4]
        
    # Words to remove
    words_to_remove = ["rrb", "ntpc", "ug", "cbt1", "cbt-1", "publishing", "report", "v1.0", "07_2025", "07-2025", "results", "result"]
    for w in words_to_remove:
        name = name.replace(w, " ")
        
    # Replace separators with spaces
    for char in "-_()[]/\\":
        name = name.replace(char, " ")
        
    # Remove multiple spaces
    name = " ".join(name.split())
    
    # Return Title Case
    return name.title()

def extract_roll_numbers():
    # Target directory for output
    output_dir = "data"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")

    # List files in current directory
    current_files = os.listdir(".")
    pdf_files = [f for f in current_files if f.lower().endswith(".pdf")]

    if not pdf_files:
        print("No PDF files found in the current directory.")
        return

    processed_zones = []

    for pdf_file in pdf_files:
        zone_name = clean_zone_name(pdf_file)
        if not zone_name:
            zone_name = os.path.splitext(pdf_file)[0]
            
        zone_key = zone_name.lower().replace(" ", "_")
        # Save as JS file instead of JSON to bypass local file CORS policy
        output_file = os.path.join(output_dir, f"{zone_key}.js")
        
        print(f"Processing PDF: '{pdf_file}' -> Zone: '{zone_name}'...")
        
        try:
            reader = pypdf.PdfReader(pdf_file)
            num_pages = len(reader.pages)
            print(f"  - Pages: {num_pages}")
            
            all_text = ""
            for idx in range(num_pages):
                page_text = reader.pages[idx].extract_text()
                if page_text:
                    all_text += page_text + "\n"

            # CEN 07/2025 RRB Roll numbers are 15-digit numeric sequences
            roll_numbers = re.findall(r'\b\d{15}\b', all_text)
            
            # Deduplicate and sort
            unique_rolls = sorted(list(set(roll_numbers)))
            
            print(f"  - Extracted {len(roll_numbers)} roll numbers ({len(unique_rolls)} unique)")
            
            # Save as JavaScript definition
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(f"window.rrb_{zone_key} = ")
                json.dump(unique_rolls, f)
                f.write(";\n")
                
            print(f"  - Saved to: {output_file}")
            processed_zones.append({
                "id": zone_key,
                "name": zone_name
            })
            
        except Exception as e:
            print(f"  - Error processing {pdf_file}: {str(e)}")

    print("\nExtraction Summary:")
    print("-------------------")
    print("Add these zones to your ZONES array in script.js:")
    for zone in processed_zones:
        print(f'  {{ id: "{zone["id"]}", name: "{zone["name"]}", active: true }},')

if __name__ == "__main__":
    extract_roll_numbers()
