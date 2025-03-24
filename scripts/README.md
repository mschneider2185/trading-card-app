# eBay Card Sales Scraper

This script scrapes eBay sold listings for trading cards, extracting sale prices, dates, and card images.

## Prerequisites

1. Python 3.x installed on your system
2. Chrome browser installed
3. ChromeDriver matching your Chrome version

## Setup Instructions

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Download ChromeDriver:
   - Visit [ChromeDriver Downloads](https://sites.google.com/chromium.org/driver/)
   - Download the version matching your Chrome browser
   - Add ChromeDriver to your system PATH or place it in the same directory as the script

3. Create required directories:
   ```bash
   mkdir card_images
   ```

## Usage

Run the script:
```bash
python scraper.py
```

The script will:
1. Search eBay for sold listings of the specified card
2. Extract sale prices, dates, and card images
3. Save images to the `card_images` directory
4. Generate a CSV file with all scraped data

## Output

- `ebay_sales_with_images.csv`: Contains all scraped data including:
  - Listing title
  - Sale price
  - Sale date
  - Card details
  - Image URLs and local paths
- `card_images/`: Directory containing downloaded card images

## Notes

- The script includes delays to avoid overwhelming eBay's servers
- Images are saved with unique filenames based on the listing title
- Error handling is included for failed downloads or parsing issues
- The script runs Chrome in headless mode for efficiency 