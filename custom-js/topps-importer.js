#!/usr/bin/env node

const { program } = require('commander');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
const ora = require('ora').default;
const { default: inquirer } = require('inquirer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Rate limiting helpers
const sleep = async () => {
  const baseDelay = parseInt(process.env.SCRAPER_DELAY) || 2500;
  const randomDelay = parseInt(process.env.SCRAPER_DELAY_RANDOM) || 1000;
  const delay = baseDelay + Math.random() * randomDelay;
  return new Promise(resolve => setTimeout(resolve, delay));
};

const handleRateLimit = async (retryCount = 0) => {
  const maxRetries = parseInt(process.env.SCRAPER_MAX_RETRIES) || 3;
  const multiplier = parseInt(process.env.SCRAPER_BACKOFF_MULTIPLIER) || 2;
  const baseDelay = parseInt(process.env.SCRAPER_DELAY) || 2500;
  
  if (retryCount >= maxRetries) {
    throw new Error('Max retries exceeded');
  }
  
  const backoffDelay = baseDelay * Math.pow(multiplier, retryCount);
  await new Promise(resolve => setTimeout(resolve, backoffDelay));
  return retryCount + 1;
};

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Ensure we have credentials
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file');
  process.exit(1);
}

// Base directory for downloads
const BASE_DIR = path.join('D:\\topps-data');
const CHECKLISTS_DIR = path.join(BASE_DIR, 'checklists');

// Create directories if they don't exist
if (!fs.existsSync(BASE_DIR)) {
  fs.mkdirSync(BASE_DIR);
}
if (!fs.existsSync(CHECKLISTS_DIR)) {
  fs.mkdirSync(CHECKLISTS_DIR);
}

// Set up CLI
program
  .name('topps-importer')
  .description('CLI to import TOPPS checklists into Supabase')
  .version('1.0.0');

// Command to scrape checklists
program
  .command('scrape')
  .description('Scrape checklists from TOPPS website')
  .option('-l, --limit <number>', 'Limit number of PDFs to download', '10')
  .action(async (options) => {
    const spinner = ora('Starting browser...').start();
    
    try {
      console.log('Launching browser...');
      const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: [
          '--start-maximized',
          '--disable-web-security',
          '--no-sandbox'
        ]
      });
      console.log('Browser launched successfully');
      
      const page = await browser.newPage();
      console.log('New page created');
      
      // Enable detailed logging
      page.on('console', msg => console.log('Browser console:', msg.text()));
      page.on('pageerror', err => console.error('Page error:', err.message));
      page.on('requestfailed', request => console.error('Failed request:', request.url()));
      
      // Set download behavior
      const client = await page.target().createCDPSession();
      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: CHECKLISTS_DIR
      });
      
      // Set custom headers to look more like a browser
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.topps.com/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });
      console.log('Custom headers set');

      spinner.text = 'Navigating to TOPPS checklists page...';
      console.log('Attempting to navigate to checklists page...');
      
      // Navigate to the page and wait for content to load
      await page.goto('https://www.topps.com/pages/checklists', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      console.log('Navigation complete');
      
      // Handle cookie consent with more detailed logging
      spinner.text = 'Handling cookie consent...';
      try {
        console.log('Looking for cookie consent banner...');
        
        // Wait for cookie banner with longer timeout
        await page.waitForSelector('#onetrust-banner-sdk', { 
          visible: true,
          timeout: 10000 
        });
        console.log('Cookie banner found');
        
        // Look for the accept button
        const acceptButton = await page.$('#onetrust-accept-btn-handler');
        if (acceptButton) {
          console.log('Accept button found, clicking...');
          await acceptButton.click();
          console.log('Accept button clicked');
          
          // Wait for banner to disappear
          await page.waitForSelector('#onetrust-banner-sdk', { 
            hidden: true,
            timeout: 5000 
          });
          console.log('Cookie banner disappeared');
        } else {
          console.log('Accept button not found');
        }
      } catch (error) {
        console.log('Cookie consent handling error:', error.message);
      }
      
      // Log the page content for debugging
      spinner.info('Checking page content...');
      console.log('Page URL:', page.url());
      console.log('Page title:', await page.title());
      
      // Check if we're on the right page
      const pageContent = await page.content();
      if (!pageContent.includes('checklists')) {
        console.log('Page content does not contain expected text. Current content:');
        console.log(pageContent.substring(0, 500) + '...');
      }
      
      // Add initial delay after main page load
      console.log('Waiting for initial delay...');
      await sleep();
      console.log('Initial delay complete');
      
      // Check for PDF links with more detailed logging
      spinner.text = 'Finding checklist links...';
      console.log('Searching for PDF links on the page...');
      
      const allChecklistLinks = await page.evaluate(() => {
        console.log('Starting PDF link search...');
        const links = Array.from(document.querySelectorAll('a[href$=".pdf"]'));
        console.log('Raw links found:', links.length);
        
        // Log some details about the links found
        links.forEach((link, index) => {
          console.log(`Link ${index + 1}:`, {
            href: link.href,
            text: link.textContent,
            visible: link.offsetParent !== null
          });
        });
        
        return links.map((link, index) => ({
          url: link.href,
          title: link.textContent.trim(),
          selector: `a[href$=".pdf"]:nth-of-type(${index + 1})`
        }));
      });
      
      if (allChecklistLinks.length === 0) {
        console.log('No PDF links found. Checking page structure...');
        const pageStructure = await page.evaluate(() => {
          return {
            bodyText: document.body.textContent.substring(0, 200),
            totalLinks: document.querySelectorAll('a').length,
            h1Tags: Array.from(document.querySelectorAll('h1')).map(h => h.textContent),
            h2Tags: Array.from(document.querySelectorAll('h2')).map(h => h.textContent)
          };
        });
        console.log('Page structure:', pageStructure);
      }
      
      // Limit the number of PDFs to download
      const limit = parseInt(options.limit);
      const checklistLinks = allChecklistLinks.slice(0, limit);
      
      spinner.succeed(`Found ${allChecklistLinks.length} checklists, will download ${checklistLinks.length}`);
      
      // Ask user to confirm download
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `Download ${checklistLinks.length} checklists?`,
        default: true
      }]);
      
      if (!confirm) {
        console.log('Operation cancelled');
        await browser.close();
        return;
      }
      
      // Download each PDF checklist
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < checklistLinks.length; i++) {
        const { url, title, selector } = checklistLinks[i];
        spinner.start(`Downloading ${i+1}/${checklistLinks.length}: ${title}`);
        
        // Extract filename from URL
        const filename = url.split('/').pop();
        const outputPath = path.join(CHECKLISTS_DIR, filename);
        
        // Skip if already downloaded and valid
        if (fs.existsSync(outputPath)) {
          const stats = fs.statSync(outputPath);
          if (stats.size > 1000) { // Skip if file exists and is larger than 1KB
            spinner.info(`Already downloaded: ${filename}`);
            successCount++;
            continue;
          }
          // If file exists but is too small, delete it and try again
          fs.unlinkSync(outputPath);
        }
        
        let retryCount = 0;
        let success = false;
        
        while (!success && retryCount < (parseInt(process.env.SCRAPER_MAX_RETRIES) || 3)) {
          try {
            // Scroll the link into view
            await page.evaluate((selector) => {
              const element = document.querySelector(selector);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, selector);
            
            // Wait a bit for the scroll to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try to download using fetch API
            const pdfData = await page.evaluate(async (pdfUrl) => {
              try {
                const response = await fetch(pdfUrl, {
                  method: 'GET',
                  credentials: 'include',
                  headers: {
                    'Accept': 'application/pdf'
                  }
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const blob = await response.blob();
                return await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result);
                  reader.readAsDataURL(blob);
                });
              } catch (error) {
                console.error('Error fetching PDF:', error);
                return null;
              }
            }, url);
            
            if (!pdfData) {
              throw new Error('Failed to fetch PDF data');
            }
            
            // Convert base64 data to buffer and save
            const base64Data = pdfData.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            
            if (buffer.length < 1000) {
              throw new Error('Downloaded file too small');
            }
            
            fs.writeFileSync(outputPath, buffer);
            
            // Verify the file
            const stats = fs.statSync(outputPath);
            if (stats.size > 1000) {
              spinner.succeed(`Downloaded: ${filename} (${Math.round(stats.size / 1024)}KB)`);
              success = true;
              successCount++;
            } else {
              fs.unlinkSync(outputPath);
              throw new Error('Saved file too small');
            }
            
            // Wait before next request with randomized delay
            await sleep();
            
          } catch (error) {
            console.error(`Error downloading ${filename}:`, error.message);
            if (error.message.includes('429')) {
              retryCount = await handleRateLimit(retryCount);
            } else {
              retryCount++;
              await sleep();
            }
          }
        }
        
        if (!success) {
          spinner.fail(`Failed to download ${filename} after ${retryCount} retries`);
          failCount++;
        }
      }
      
      await browser.close();
      console.log(`\nDownload Summary:`);
      console.log(`- Successfully downloaded: ${successCount} PDFs`);
      console.log(`- Failed to download: ${failCount} PDFs`);
      
    } catch (error) {
      spinner.fail('Error scraping checklists');
      console.error(error);
    }
  });

// Helper function to determine sport based on set name
function determineSport(setName) {
  const setNameLower = setName.toLowerCase();
  
  if (/baseball|mlb|series|heritage|chrome|bowman/.test(setNameLower)) {
    return 'Baseball';
  } else if (/football|nfl|gridiron/.test(setNameLower)) {
    return 'Football';
  } else if (/basketball|nba|court|hoops/.test(setNameLower)) {
    return 'Basketball';
  } else if (/hockey|nhl|ice|puck/.test(setNameLower)) {
    return 'Hockey';
  } else if (/soccer|mls|pitch/.test(setNameLower)) {
    return 'Soccer';
  } else {
    return 'Other';
  }
}

// Process a single PDF checklist
async function processChecklist(filePath) {
  try {
    console.log('Reading file:', filePath);
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);
    
    // Extract filename (without extension) to get set information
    const filename = path.basename(filePath, '.pdf');
    console.log('Filename:', filename);
    
    // Parse year and set name from filename
    const yearMatch = filename.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? parseInt(yearMatch[0]) : null;
    console.log('Year from filename:', year);
    
    // Basic set name extraction
    let setName = filename.replace(/\b(19|20)\d{2}\b/, '').trim();
    setName = setName.replace(/[-_]/g, ' ').trim();
    console.log('Set name:', setName);
    
    // If no year found in filename, try to extract from content
    let detectedYear = year;
    if (!detectedYear) {
      const yearInContent = pdfData.text.match(/\b(19|20)\d{2}\b/);
      if (yearInContent) {
        detectedYear = parseInt(yearInContent[0]);
      }
    }
    console.log('Detected year:', detectedYear);
    
    // Parse the text content
    console.log('PDF Text content:', pdfData.text.substring(0, 500) + '...');
    const lines = pdfData.text.split('\n').filter(line => line.trim().length > 0);
    console.log('Number of lines:', lines.length);
    console.log('First 5 lines:', lines.slice(0, 5));
    
    const cards = [];
    
    // Different regex patterns for different card formats
    const patterns = [
      /^(\d+)\s+(.+?)(?:\s+(RC|ROOKIE))?(?:\s+(AUTO|AU))?(?:\s+(PATCH|RELIC))?$/i,
      /^(\d+)\s*[-–]\s*(.+?)(?:\s+(RC|ROOKIE))?(?:\s+(AUTO|AU))?(?:\s+(PATCH|RELIC))?$/i,
      /(\d+)[^\w\d]+(.*?)(?:\s+(RC|ROOKIE))?(?:\s+(AUTO|AU))?(?:\s+(PATCH|RELIC))?$/i,
    ];
    
    for (const line of lines) {
      let matched = false;
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          console.log('Matched line:', line);
          console.log('Match groups:', match);
          
          const cardNumber = match[1];
          const playerName = match[2].trim();
          const isRookie = Boolean(match[3]);
          const isAutographed = Boolean(match[4]);
          const isPatch = Boolean(match[5]);
          
          // Skip if player name is empty or too short (likely a header/footer)
          if (!playerName || playerName.length < 2) {
            console.log('Skipping line due to invalid player name:', line);
            continue;
          }
          
          cards.push({
            sport: determineSport(setName),
            year: detectedYear,
            brand: 'Topps',
            set_name: setName,
            player_name: playerName,
            card_number: cardNumber,
            is_rookie: isRookie,
            is_autographed: isAutographed,
            is_patch: isPatch
          });
          
          matched = true;
          break;
        }
      }
      
      if (!matched && line.trim().length > 0) {
        console.log('Unmatched line:', line);
      }
    }
    
    console.log('Total cards found:', cards.length);
    return { cards, year: detectedYear, setName };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return { cards: [], year: null, setName: null };
  }
}

// Command to process PDFs
program
  .command('process')
  .description('Process downloaded PDFs and extract card data')
  .option('-f, --file <file>', 'Process a specific PDF file')
  .option('-p, --preview', 'Preview data without inserting into database')
  .option('-y, --year <year>', 'Override year detection')
  .option('-s, --set <name>', 'Override set name detection')
  .option('-l, --limit <number>', 'Limit number of files to process')
  .action(async (options) => {
    try {
      if (options.file) {
        // Process a single file
        const filePath = options.file.startsWith('/') 
          ? options.file 
          : path.join(CHECKLISTS_DIR, options.file);
        
        if (!fs.existsSync(filePath)) {
          console.error(`File not found: ${filePath}`);
          return;
        }
        
        const spinner = ora(`Processing ${path.basename(filePath)}...`).start();
        const { cards, year, setName } = await processChecklist(filePath);
        
        spinner.succeed(`Extracted ${cards.length} cards from ${path.basename(filePath)}`);
        
        // Override with command line options
        const finalYear = options.year ? parseInt(options.year) : year;
        const finalSetName = options.set || setName;
        
        // Update cards with overrides
        const finalCards = cards.map(card => ({
          ...card,
          year: finalYear,
          set_name: finalSetName
        }));
        
        if (options.preview) {
          console.log('Preview of extracted cards:');
          console.log(finalCards.slice(0, 5));
          console.log(`...and ${finalCards.length - 5} more cards`);
        } else if (finalCards.length > 0) {
          // Confirm before inserting
          const { confirm } = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirm',
            message: `Insert ${finalCards.length} cards into the database?`,
            default: true
          }]);
          
          if (!confirm) {
            console.log('Database insert cancelled');
            return;
          }
          
          // Insert in batches
          const batchSize = 50;
          const batches = Math.ceil(finalCards.length / batchSize);
          
          for (let i = 0; i < finalCards.length; i += batchSize) {
            const batch = finalCards.slice(i, i + batchSize);
            spinner.start(`Inserting batch ${Math.floor(i/batchSize) + 1}/${batches}...`);
            
            const { data, error } = await supabase
              .from('cards')
              .insert(batch);
            
            if (error) {
              spinner.fail(`Error inserting batch: ${error.message}`);
            } else {
              spinner.succeed(`Inserted batch ${Math.floor(i/batchSize) + 1}/${batches}`);
            }
          }
        }
      } else {
        // Process all PDFs
        const files = fs.readdirSync(CHECKLISTS_DIR)
          .filter(file => file.endsWith('.pdf'));
        
        if (files.length === 0) {
          console.log('No PDF files found. Run the scrape command first.');
          return;
        }
        
        console.log(`Found ${files.length} PDF files to process`);
        
        // Limit if specified
        let filesToProcess = files;
        if (options.limit) {
          filesToProcess = files.slice(0, parseInt(options.limit));
          console.log(`Processing only the first ${filesToProcess.length} files`);
        }
        
        // Process files one by one
        const spinner = ora().start();
        let totalCards = 0;
        
        for (let i = 0; i < filesToProcess.length; i++) {
          const file = filesToProcess[i];
          const filePath = path.join(CHECKLISTS_DIR, file);
          
          spinner.text = `Processing ${i+1}/${filesToProcess.length}: ${file}`;
          const { cards, year, setName } = await processChecklist(filePath);
          totalCards += cards.length;
          
          // Override with command line options
          const finalYear = options.year ? parseInt(options.year) : year;
          const finalSetName = options.set || setName;
          
          // Update cards with overrides
          const finalCards = cards.map(card => ({
            ...card,
            year: finalYear,
            set_name: finalSetName
          }));
          
          if (!options.preview && finalCards.length > 0) {
            // Insert in batches
            const batchSize = 50;
            const batches = Math.ceil(finalCards.length / batchSize);
            
            for (let j = 0; j < finalCards.length; j += batchSize) {
              const batch = finalCards.slice(j, j + batchSize);
              
              const { error } = await supabase
                .from('cards')
                .insert(batch);
              
              if (error) {
                spinner.fail(`Error inserting batch from ${file}: ${error.message}`);
                break;
              }
            }
          }
          
          spinner.succeed(`Processed ${file}: ${cards.length} cards extracted`);
        }
        
        console.log(`Total: ${totalCards} cards extracted from ${filesToProcess.length} files`);
        
        if (options.preview) {
          console.log('Preview mode: No data was inserted into the database');
        }
      }
    } catch (error) {
      console.error('Error processing PDFs:', error);
    }
  });

// Command to clean up the database
program
  .command('clean')
  .description('Remove duplicate or problematic entries')
  .option('-d, --duplicates', 'Remove duplicate cards')
  .option('-s, --set <name>', 'Clean a specific set')
  .option('-y, --year <year>', 'Clean cards from a specific year')
  .action(async (options) => {
    const spinner = ora('Preparing database cleanup...').start();
    
    try {
      if (options.duplicates) {
        spinner.text = 'Finding duplicate cards...';
        
        // Build query based on options
        let query = supabase.from('cards');
        
        if (options.year) {
          query = query.eq('year', parseInt(options.year));
        }
        
        if (options.set) {
          query = query.eq('set_name', options.set);
        }
        
        // Get all matching cards
        const { data: cards, error } = await query.select('*');
        
        if (error) {
          spinner.fail(`Error fetching cards: ${error.message}`);
          return;
        }
        
        // Find duplicates based on unique attributes
        const seen = new Map();
        const duplicates = [];
        
        cards.forEach(card => {
          // Create a unique key for each card
          const key = `${card.brand}-${card.set_name}-${card.year}-${card.card_number}-${card.player_name}`;
          
          if (seen.has(key)) {
            // This is a duplicate, add to list
            duplicates.push(card.id);
          } else {
            seen.set(key, card.id);
          }
        });
        
        spinner.succeed(`Found ${duplicates.length} duplicate cards`);
        
        if (duplicates.length > 0) {
          // Confirm before deleting
          const { confirm } = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirm',
            message: `Delete ${duplicates.length} duplicate cards?`,
            default: false
          }]);
          
          if (!confirm) {
            console.log('Deletion cancelled');
            return;
          }
          
          // Delete in batches
          const batchSize = 100;
          const batches = Math.ceil(duplicates.length / batchSize);
          
          for (let i = 0; i < duplicates.length; i += batchSize) {
            const batch = duplicates.slice(i, i + batchSize);
            spinner.start(`Deleting batch ${Math.floor(i/batchSize) + 1}/${batches}...`);
            
            const { error } = await supabase
              .from('cards')
              .delete()
              .in('id', batch);
            
            if (error) {
              spinner.fail(`Error deleting batch: ${error.message}`);
            } else {
              spinner.succeed(`Deleted batch ${Math.floor(i/batchSize) + 1}/${batches}`);
            }
          }
          
          console.log(`Successfully removed ${duplicates.length} duplicate cards`);
        }
      }
    } catch (error) {
      spinner.fail('Error during database cleanup');
      console.error(error);
    }
  });

// Command to show statistics
program
  .command('stats')
  .description('Show statistics about the card database')
  .action(async () => {
    const spinner = ora('Fetching database statistics...').start();
    
    try {
      // Get total count
      const { count: totalCount, error: countError } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        spinner.fail(`Error fetching count: ${countError.message}`);
        return;
      }
      
      // Get counts by sport
      const { data: sportCounts, error: sportError } = await supabase.rpc(
        'get_card_counts_by_field',
        { field_name: 'sport' }
      );
      
      // Get counts by year
      const { data: yearCounts, error: yearError } = await supabase.rpc(
        'get_card_counts_by_field',
        { field_name: 'year' }
      );
      
      // Get counts by set
      const { data: setCounts, error: setError } = await supabase.rpc(
        'get_card_counts_by_field',
        { field_name: 'set_name' }
      );
      
      spinner.succeed('Retrieved database statistics');
      
      console.log(`\nTotal cards in database: ${totalCount}\n`);
      
      if (sportCounts && !sportError) {
        console.log('Cards by sport:');
        sportCounts.forEach(item => {
          console.log(`  ${item.field_value || 'Unknown'}: ${item.count}`);
        });
        console.log('');
      }
      
      if (yearCounts && !yearError) {
        console.log('Cards by year:');
        yearCounts.sort((a, b) => {
          const yearA = parseInt(a.field_value) || 0;
          const yearB = parseInt(b.field_value) || 0;
          return yearB - yearA; // Most recent years first
        }).slice(0, 10).forEach(item => {
          console.log(`  ${item.field_value || 'Unknown'}: ${item.count}`);
        });
        console.log('  ...');
        console.log('');
      }
      
      if (setCounts && !setError) {
        console.log('Top 10 sets by card count:');
        setCounts.sort((a, b) => b.count - a.count)
          .slice(0, 10)
          .forEach(item => {
            console.log(`  ${item.field_value || 'Unknown'}: ${item.count}`);
          });
      }
      
    } catch (error) {
      spinner.fail('Error fetching statistics');
      console.error(error);
    }
  });

// Preview command
program
  .command('preview')
  .description('Preview card data extraction by writing to a CSV file')
  .option('-d, --dir <directory>', 'Directory containing PDF files to process', 'D:\\topps-data\\checklists')
  .option('-f, --file <file>', 'Single PDF file to process')
  .option('-o, --output <file>', 'Output CSV file', 'preview-output.csv')
  .action(async (options) => {
    const spinner = ora('Processing files...').start();
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    
    try {
      const csvWriter = createCsvWriter({
        path: options.output,
        header: [
          { id: 'cardNumber', title: 'Card Number' },
          { id: 'playerName', title: 'Player Name' },
          { id: 'team', title: 'Team' },
          { id: 'setName', title: 'Set Name' },
          { id: 'year', title: 'Year' },
          { id: 'sport', title: 'Sport' },
          { id: 'isRookie', title: 'Is Rookie' }
        ]
      });

      let files = [];
      if (options.file) {
        files = [options.file];
      } else {
        files = fs.readdirSync(options.dir)
          .filter(file => file.toLowerCase().endsWith('.pdf'))
          .map(file => path.join(options.dir, file));
      }

      if (files.length === 0) {
        spinner.fail('No PDF files found to process');
        return;
      }

      let allCards = [];
      let uniqueSets = new Set();
      let uniqueTeams = new Set();
      let sportCounts = {};

      for (const file of files) {
        spinner.text = `Processing ${path.basename(file)}...`;
        const result = await processChecklist(file);
        if (result && result.cards) {
          allCards = allCards.concat(result.cards);
          result.cards.forEach(card => {
            if (card.setName) uniqueSets.add(card.setName);
            if (card.team) uniqueTeams.add(card.team);
            if (card.sport) {
              sportCounts[card.sport] = (sportCounts[card.sport] || 0) + 1;
            }
          });
        }
      }

      await csvWriter.writeRecords(allCards);

      spinner.succeed(`Processed ${files.length} file(s) and extracted ${allCards.length} cards`);
      
      console.log('\nSummary:');
      console.log(`Total files processed: ${files.length}`);
      console.log(`Total cards extracted: ${allCards.length}`);
      console.log('\nUnique sets found:');
      [...uniqueSets].sort().forEach(set => console.log(`  - ${set}`));
      console.log('\nUnique teams found:');
      [...uniqueTeams].sort().forEach(team => console.log(`  - ${team}`));
      console.log('\nCards by sport:');
      Object.entries(sportCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([sport, count]) => console.log(`  ${sport}: ${count}`));
      
      console.log(`\nOutput written to: ${options.output}`);
      
      // Display sample of the data
      console.log('\nSample data (first 5 cards):');
      console.table(allCards.slice(0, 5));

    } catch (error) {
      spinner.fail('Error processing files');
      console.error(error);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}