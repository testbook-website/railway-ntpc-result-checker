# RRB NTPC Result Checker Widget

A lightweight, beautiful, glassmorphic widget designed to check CEN No. 07/2025 (NTPC) results. It matches student roll numbers against qualified candidate lists locally in the browser at O(1) speeds, logs inquiry data (name, mobile, roll, zone, qualified status) to Google Sheets, and is optimized to run inside a small iframe.

## Project Structure

```
rrb-ntpc-result/
├── data/
│   └── ahmedabad.js         # Extracted roll numbers for Ahmedabad (JS Module)
├── index.html                 # Main widget structure
├── style.css                  # Custom styling (Outfit Font, Glassmorphism, Animations)
├── script.js                  # Frontend form validation, O(1) matching, and Sheets API integration
├── extract_roll_numbers.py    # Python utility to parse PDFs and create JSON files for zones
├── google-apps-script.js      # Copy-paste Apps Script code for Google Sheets logging
└── README.md                  # Instructions
```

---

## Setup Instructions

### 1. Google Sheets Data Logging Setup

To capture student details (Name, Roll Number, Mobile, Zone, Qualification Status):

1. Create a new **Google Sheet**.
2. Click **Extensions** > **Apps Script**.
3. Clear any template code and paste the code from [google-apps-script.js](file:///c:/Users/Admin/Desktop/rrb-ntpc-result/google-apps-script.js).
4. Click the **Save** icon (floppy disk) at the top.
5. Click the **Deploy** button (top right) and select **New deployment**.
6. Click the cogwheel icon next to "Select type" and choose **Web app**.
7. Configure the settings:
   - **Description**: `RRB NTPC Result Logger`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` (CRITICAL: Do not set to "Only myself" or the widget won't be able to log details).
8. Click **Deploy**. Authorize Google permissions if prompted (click Advanced > Go to Untitled project).
9. Copy the **Web app URL** or just the **Deployment ID** (the long string between `/s/` and `/exec` in the URL).
10. Open [script.js](file:///c:/Users/Admin/Desktop/rrb-ntpc-result/script.js) and paste your Deployment ID on line 6:
    ```javascript
    const APPS_SCRIPT_DEPLOYMENT_ID = "YOUR_DEPLOYMENT_ID_HERE";
    ```

---

### 2. How to Add More Zones

As soon as more RRB NTPC results are released:

1. Download the result PDF for the new zone.
2. Name it using the pattern: `RRB NTPC <Zone Name>.pdf` (e.g., `RRB NTPC Mumbai.pdf` or `RRB NTPC Secunderabad.pdf`).
3. Place the PDF in the project root directory.
4. Run the Python parser:
   ```bash
   python extract_roll_numbers.py
   ```
   *This will automatically read the PDF, extract all 15-digit numbers, sort them, and save them in `data/<zone_name>.js`.*
5. Register the new zone in [script.js](file:///c:/Users/Admin/Desktop/rrb-ntpc-result/script.js). Locate the `ZONES` array near the top of the file and add your new zone entry:
   ```javascript
   const ZONES = [
     { id: "ahmedabad", name: "Ahmedabad", active: true },
     { id: "mumbai", name: "Mumbai", active: true }, // Add this line
   ];
   ```
6. Commit the files to GitHub.

---

### 3. Deploying to GitHub Pages

1. Create a repository on GitHub (e.g., `rrb-ntpc-result`).
2. Initialize git in your local project and push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of NTPC result checker widget"
   git branch -M main
   git remote add origin https://github.com/yourusername/rrb-ntpc-result.git
   git push -u origin main
   ```
3. On GitHub, go to your repository's **Settings** tab.
4. Scroll down to **Pages** in the left sidebar.
5. Under **Build and deployment**, set the Source to **Deploy from a branch**.
6. Under **Branch**, select `main` and folder `/ (root)`, then click **Save**.
7. After a minute, GitHub will give you a live URL (e.g., `https://yourusername.github.io/rrb-ntpc-result/`).

---

### 4. Embedding the Widget (Iframe)

Once deployed to GitHub Pages, you can embed the widget in any webpage or site builder using this small-sized HTML iframe snippet:

```html
<iframe 
  src="https://yourusername.github.io/rrb-ntpc-result/" 
  width="100%" 
  max-width="420px"
  height="530px" 
  style="border: none; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); max-width: 420px; width: 100%; display: block; margin: 0 auto; overflow: hidden;"
  scrolling="no"
  frameborder="0"
  allowtransparency="true">
</iframe>
```

### Key Iframe Dimensions & Behaviors:
- **Recommended dimensions**: Width of `380px` to `420px`, height of `530px`.
- **Responsive**: Width is set to `100%` with `max-width: 420px` to ensure it resizes perfectly on mobile screens (shrinks gracefully down to `300px` without cutting off inputs).
- **Smooth transitions**: The card handles transitions between inputs and results internally with fading panels, so the iframe height does not need to change dynamically.
