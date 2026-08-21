const { chromium } = require('playwright');
const nodemailer = require('nodemailer');

// Target selector on the BookMyShow page
const TARGET_URL = 'https://in.bookmyshow.com/movies/national-capital-region-ncr/the-odyssey/buytickets/ET00480917/20260821?etCodes=ET00480917&language=english&refEventCode=ET00480917';
const TARGET_SELECTOR = '[id="20260825"]'; // Replace with actual element selector

async function sendNotification(currentCursor) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use a Gmail App Password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECEIVER_EMAIL,
    subject: '🚨 BookMyShow Ticket Alert: Cursor Changed!',
    text: `The booking cursor style changed to "${currentCursor}"!\n\nCheck the link: ${TARGET_URL}`,
  };

  await transporter.sendMail(mailOptions);
  console.log('Notification email sent successfully!');
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  try {
    console.log('Navigating to target page...');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for the target element to load
    await page.waitForSelector(TARGET_SELECTOR, { timeout: 15000 });

    // Extract computed CSS cursor style
    const cursorStyle = await page.$eval(TARGET_SELECTOR, (el) => {
      return window.getComputedStyle(el).cursor;
    });

    console.log(`Current computed cursor style: "${cursorStyle}"`);

    // Check if cursor turned into pointer (or anything other than not-allowed)
    if (cursorStyle === 'pointer') {
      console.log('Cursor turned to pointer! Triggering email...');
      await sendNotification(cursorStyle);
    } else {
        await sendNotification(cursorStyle);
      console.log('Tickets are still unavailable (cursor is not pointer).');
    }

  } catch (error) {
    console.error('Error during execution:', error.message);
  } finally {
    await browser.close();
  }
}

run();