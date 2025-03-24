import os
import time
import requests
import pandas as pd
from datetime import datetime
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import StaleElementReferenceException, TimeoutException
from urllib.parse import urljoin
import json
import logging
from pathlib import Path
import re

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(r"D:\My Projects\card-images", "scraper.log"))
    ]
)
logger = logging.getLogger(__name__)

# Configure Chrome options for headless mode
chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.add_argument("--window-size=1920,1080")

# Set the base directory path
BASE_DIR = Path(r"D:\My Projects\card-images")
IMAGES_DIR = BASE_DIR / "images"
CSV_FILE = BASE_DIR / "ebay_sales_with_images.csv"

# Known NHL player names (expand this list as needed)
NHL_PLAYERS = {
    "Kirill Kaprizov", "Connor McDavid", "Auston Matthews", "Sidney Crosby",
    "Nathan MacKinnon", "Leon Draisaitl", "Cale Makar", "Jack Hughes",
    "Ilya Sorokin", "Igor Shesterkin", "Trevor Zegras", "Mason McTavish"
}

# Known card set names
CARD_SETS = {
    "Upper Deck", "Young Guns", "The Cup", "SP Authentic", "O-Pee-Chee",
    "Black Diamond", "Artifacts", "Ice", "SPx", "Trilogy", "Ultimate Collection",
    "Premier", "Rookie Box Set", "Series 1", "Series 2"
}

def retry_on_stale(func, max_attempts=3):
    """Retry function on StaleElementReferenceException."""
    for attempt in range(max_attempts):
        try:
            return func()
        except StaleElementReferenceException:
            if attempt == max_attempts - 1:
                raise
            time.sleep(1)

def setup_driver():
    """Initialize and return a Selenium WebDriver instance."""
    try:
        logger.info("Initializing Chrome WebDriver...")
        driver = webdriver.Chrome(options=chrome_options)
        logger.info("Chrome WebDriver initialized successfully")
        return driver
    except Exception as e:
        logger.error(f"Error initializing Chrome WebDriver: {e}")
        raise

def parse_price(price_str):
    """Convert price string to float."""
    try:
        if not price_str:
            return None
        # Remove currency symbols, commas, and whitespace
        price_str = price_str.replace("$", "").replace(",", "").replace("USD", "").strip()
        return float(price_str)
    except Exception as e:
        logger.error(f"Error parsing price '{price_str}': {e}")
        return None

def parse_date(date_str):
    """Convert eBay date string to YYYY-MM-DD format."""
    try:
        if not date_str:
            return None
            
        # Remove "Sold" prefix if present
        date_str = date_str.replace("Sold", "").strip()
        
        # Try different date formats
        formats = [
            "%b %d, %Y",  # Feb 20, 2024
            "%b-%d-%y",   # Mar-23-24
            "%b %d %Y",   # Feb 20 2024
            "%Y-%m-%d",   # 2024-02-20
            "%m/%d/%y"    # 02/20/24
        ]
        
        for fmt in formats:
            try:
                date_obj = datetime.strptime(date_str, fmt)
                # Ensure year is in correct century
                if date_obj.year < 100:
                    if date_obj.year > 50:  # Assume 19xx for years > 50
                        date_obj = date_obj.replace(year=date_obj.year + 1900)
                    else:  # Assume 20xx for years <= 50
                        date_obj = date_obj.replace(year=date_obj.year + 2000)
                return date_obj.strftime("%Y-%m-%d")
            except ValueError:
                continue
                
        logger.warning(f"Could not parse date: {date_str}")
        return None
    except Exception as e:
        logger.error(f"Error parsing date '{date_str}': {e}")
        return None

def download_image(url, filename, max_attempts=3):
    """Download image from URL and save to local directory with retries."""
    for attempt in range(max_attempts):
        try:
            logger.info(f"Downloading image (attempt {attempt + 1}/{max_attempts}): {filename}")
            response = requests.get(url, timeout=15)
            if response.status_code == 200:
                # Clean filename of invalid characters
                clean_filename = "".join(c for c in filename if c.isalnum() or c in (' ', '-', '_', '.'))
                filepath = IMAGES_DIR / clean_filename
                filepath.write_bytes(response.content)
                logger.info(f"Successfully saved image to: {filepath}")
                return str(filepath)
            else:
                logger.error(f"Failed to download image. Status code: {response.status_code}")
        except Exception as e:
            logger.error(f"Error downloading image (attempt {attempt + 1}): {e}")
            if attempt < max_attempts - 1:
                time.sleep(2)
                continue
    return None

def get_element_safely(driver, by, selector, timeout=15):
    """Get element with WebDriverWait and handle TimeoutException."""
    try:
        element = WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((by, selector))
        )
        return element
    except TimeoutException:
        logger.warning(f"Timeout waiting for element: {selector}")
        return None
    except Exception as e:
        logger.error(f"Error finding element {selector}: {e}")
        return None

def extract_card_details(title):
    """Extract card details from listing title."""
    details = {
        "player_name": None,
        "year": None,
        "set_name": None,
        "card_number": None,
        "condition": None
    }
    
    try:
        # Extract year (4 digits)
        year_match = re.search(r'\b(19|20)\d{2}\b', title)
        if year_match:
            details["year"] = int(year_match.group())
        
        # Extract card number
        card_num_match = re.search(r'#\d+|RC-\d+|\b\d+/\d+\b', title)
        if card_num_match:
            details["card_number"] = card_num_match.group()
        
        # Extract condition
        condition_patterns = [
            r'PSA\s*\d+',
            r'BGS\s*\d+(\.\d+)?',
            r'SGC\s*\d+',
            r'\b(Mint|Near Mint|NM|NM-MT)\b'
        ]
        for pattern in condition_patterns:
            condition_match = re.search(pattern, title, re.IGNORECASE)
            if condition_match:
                details["condition"] = condition_match.group()
                break
        
        # Extract set name
        for set_name in CARD_SETS:
            if set_name.lower() in title.lower():
                details["set_name"] = set_name
                break
        
        # Extract player name
        words = title.split()
        for i in range(len(words)-1):
            name_candidate = f"{words[i]} {words[i+1]}"
            if name_candidate in NHL_PLAYERS:
                details["player_name"] = name_candidate
                break
        
        # If no known player found, try to extract based on position
        if not details["player_name"]:
            # Look for words before year or set name
            name_match = re.search(r'([A-Z][a-z]+ [A-Z][a-z]+)(?=.*\d{4}|.*Upper Deck|.*Young Guns)', title)
            if name_match:
                details["player_name"] = name_match.group(1)
        
        logger.info(f"Extracted card details: {json.dumps(details, indent=2)}")
        return details
        
    except Exception as e:
        logger.error(f"Error extracting card details from title '{title}': {e}")
        return details

def get_listing_data(listing):
    """Extract data from a listing element safely."""
    try:
        # Get title
        title_elem = listing.find_element(By.CSS_SELECTOR, "div.s-item__title")
        title = title_elem.text if title_elem else None
        
        if title and "Shop on eBay" in title:
            return None
        
        # Get price
        price_elem = listing.find_element(By.CSS_SELECTOR, "span.s-item__price")
        price = parse_price(price_elem.text) if price_elem else None
        
        # Get date (try multiple selectors)
        date_selectors = [
            "span.s-item__ended-date",  # New selector
            "div.s-item__title--tagblock span.POSITIVE",  # Old selector
            "span.s-item__time-left"  # Alternative selector
        ]
        
        sale_date = None
        for selector in date_selectors:
            try:
                date_elem = listing.find_element(By.CSS_SELECTOR, selector)
                if date_elem:
                    sale_date = parse_date(date_elem.text)
                    if sale_date:
                        break
            except:
                continue
        
        # Get URL
        url_elem = listing.find_element(By.CSS_SELECTOR, "a.s-item__link")
        url = url_elem.get_attribute("href") if url_elem else None
        
        # Extract card details from title
        card_details = extract_card_details(title) if title else {}
        
        return {
            "title": title,
            "price": price,
            "sale_date": sale_date,
            "url": url,
            "card_details": card_details
        }
    except StaleElementReferenceException:
        logger.error("Stale element encountered while extracting listing data")
        return None
    except Exception as e:
        logger.error(f"Error extracting listing data: {e}")
        return None

def scrape_listing_page(driver, url):
    """Scrape individual listing page for images with retries."""
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            logger.info(f"Scraping listing page (attempt {attempt + 1}/{max_attempts}): {url}")
            driver.get(url)
            time.sleep(2)
            
            # Try multiple image selectors
            image_selectors = [
                "img[src*='s-l1600']",
                "div.ux-image-carousel-item img",
                "div.ux-image-grid__image-wrapper img"
            ]
            
            images = None
            for selector in image_selectors:
                try:
                    images = WebDriverWait(driver, 15).until(
                        EC.presence_of_all_elements_located((By.CSS_SELECTOR, selector))
                    )
                    if images:
                        break
                except:
                    continue
            
            if not images:
                raise Exception("No images found with any selector")
            
            front_url = None
            back_url = None
            
            # Get high-resolution image URLs
            image_urls = []
            for img in images:
                src = img.get_attribute("src")
                if src:
                    # Try to get highest resolution version
                    high_res_src = src.replace("s-l64", "s-l1600").replace("s-l300", "s-l1600")
                    image_urls.append(high_res_src)
            
            if image_urls:
                front_url = image_urls[0]
                logger.info("Found front image")
                if len(image_urls) > 1:
                    back_url = image_urls[1]
                    logger.info("Found back image")
            
            return front_url, back_url
            
        except Exception as e:
            logger.error(f"Error scraping listing page (attempt {attempt + 1}): {e}")
            if attempt < max_attempts - 1:
                time.sleep(2)
                continue
            return None, None

def scrape_ebay_sales():
    """Main function to scrape eBay sold listings."""
    logger.info("=== Starting eBay Card Scraper ===")
    
    # Create directories
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"Directory ready: {IMAGES_DIR}")
    
    driver = None
    sales_data = []
    
    try:
        driver = setup_driver()
        
        # Search URL for NHL trading cards
        search_url = "https://www.ebay.com/sch/i.html?_from=R40&_nkw=NHL+trading+cards&_sacat=0&LH_Sold=1&LH_Complete=1&_ipg=240"
        logger.info(f"Navigating to search URL: {search_url}")
        driver.get(search_url)
        time.sleep(3)
        
        # Get all listings data first
        listings_data = []
        page = 1
        max_pages = 5
        
        while page <= max_pages:
            # Wait for listings to load
            listings = WebDriverWait(driver, 15).until(
                EC.presence_of_all_elements_located((By.CSS_SELECTOR, "li.s-item"))
            )
            
            logger.info(f"Found {len(listings)} listings on page {page}")
            
            # Extract data from listings
            for listing in listings[1:]:  # Skip first item (template)
                data = retry_on_stale(lambda: get_listing_data(listing))
                if data:
                    listings_data.append(data)
            
            # Check for next page
            if page < max_pages:
                try:
                    next_button = driver.find_element(By.CSS_SELECTOR, "a.pagination__next")
                    if not next_button.is_enabled():
                        logger.info("No more pages available")
                        break
                    next_button.click()
                    time.sleep(2)
                    page += 1
                except Exception as e:
                    logger.error(f"Error navigating to next page: {e}")
                    break
            else:
                break
        
        # Process each listing's data
        for index, data in enumerate(listings_data, 1):
            try:
                logger.info(f"Processing listing {index}/{len(listings_data)}")
                
                # Skip if no URL
                if not data["url"]:
                    continue
                
                # Scrape images
                front_url, back_url = scrape_listing_page(driver, data["url"])
                
                # Download images
                front_path = None
                back_path = None
                if front_url:
                    front_path = download_image(front_url, f"nhl_card_{index}_front.jpg")
                if back_url:
                    back_path = download_image(back_url, f"nhl_card_{index}_back.jpg")
                
                # Add to sales data
                sales_data.append({
                    "title": data["title"],
                    "price": data["price"],
                    "sale_date": data["sale_date"],
                    "card_details": json.dumps(data["card_details"]),
                    "front_image_url": front_url,
                    "back_image_url": back_url,
                    "front_image_path": front_path,
                    "back_image_path": back_path
                })
                
                logger.info(f"Successfully processed listing {index}")
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"Error processing listing {index}: {e}")
                continue
    
    except Exception as e:
        logger.error(f"Error in main scraping function: {e}")
    finally:
        if driver:
            driver.quit()
            logger.info("Chrome WebDriver closed")
    
    # Save data
    try:
        if not sales_data:
            logger.error("No data was collected!")
            return
        
        logger.info("Saving data to CSV...")
        df = pd.DataFrame(sales_data)
        
        # Print summary
        logger.info("\nData Summary:")
        logger.info(f"Total listings processed: {len(df)}")
        logger.info(f"Listings with prices: {df['price'].notna().sum()}")
        logger.info(f"Listings with dates: {df['sale_date'].notna().sum()}")
        logger.info(f"Listings with front images: {df['front_image_path'].notna().sum()}")
        logger.info(f"Listings with back images: {df['back_image_path'].notna().sum()}")
        
        # Save to CSV
        df.to_csv(CSV_FILE, index=False)
        logger.info(f"Successfully saved data to {CSV_FILE}")
        
        # Print sample
        logger.info("\nFirst few listings:")
        print(df[['title', 'price', 'sale_date', 'card_details']].head().to_string())
        
    except Exception as e:
        logger.error(f"Error saving CSV file: {e}")
    
    logger.info("=== Scraping Complete ===")

if __name__ == "__main__":
    scrape_ebay_sales() 