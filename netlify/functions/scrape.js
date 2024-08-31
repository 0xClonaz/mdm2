const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

exports.handler = async function(event, context) {
  try {
    // Launch the browser using chrome-aws-lambda
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.goto('https://medium.oldcai.com/', { waitUntil: 'networkidle2' });
    await page.waitForSelector('table.table.table-bordered.table-striped.table-hover');

    // Extract the table data
    const tags = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table.table.table-bordered.table-striped.table-hover tbody tr'));
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 5) {
          return {
            rank: cells[0].innerText.trim(),
            name: cells[1].innerText.trim().split(' ')[0], // Remove the icon
            value: cells[2].innerText.trim(),
            followers: cells[3].innerText.trim(),
            stories: cells[4].innerText.trim(),
          };
        }
        return null;
      }).filter(row => row !== null);
    });

    await browser.close();

    return {
      statusCode: 200,
      body: JSON.stringify(tags),
    };
  } catch (error) {
    console.error('Error in /api/scrape:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data' }),
    };
  }
};
