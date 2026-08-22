const { chromium } = require('playwright');
const nodemailer = require('nodemailer');

// Target selector on the BookMyShow page
const TARGET_URL = 'https://in.bookmyshow.com/movies/national-capital-region-ncr/the-odyssey/buytickets/ET00480917/20260825';
const TEXT_TO_CHECK = 'Priya';
const TARGET_SELECTOR = `text=${TEXT_TO_CHECK}`;

async function sendNotification() {
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
    subject: `🚨 BookMyShow Alert: "${TEXT_TO_CHECK}" is now visible!`,
    text: `The text "${TEXT_TO_CHECK}" was found on the page!\n\nBook tickets here: ${TARGET_URL}`,
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
    
    // Check if the element with text "Priya" exists and is visible on the page
    console.log(`Checking for presence of text: "${TEXT_TO_CHECK}"...`);
    const element = page.locator(TARGET_SELECTOR).first();
    const isVisible = await element.isVisible({ timeout: 10000 }).catch(() => false);

    if (isVisible) {
      console.log(`Found "${TEXT_TO_CHECK}" on the page! Sending email notification...`);
      await sendNotification();
    } else {
      console.log(`"${TEXT_TO_CHECK}" is not present or visible yet. DONT CLICK THE LINK YET UNTIL THIS TEXT IS PRESENT IN THE BODY`);
    }
  } catch (error) {
    console.error('Error during execution:', error.message);
  } finally {
    await browser.close();
  }
}

run();
