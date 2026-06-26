const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Load environment variables manually if .env exists
try {
  const dotenvPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(dotenvPath)) {
    const dotenv = fs.readFileSync(dotenvPath, 'utf8');
    dotenv.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
          value = value.replace(/\\n/gm, '\n');
        }
        value = value.replace(/(^['"]|['"]$)/g, ''); // strip single/double quotes
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (err) {
  console.warn('Could not read local .env file. Relying on environment variables.', err.message);
}

// Configuration
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(__dirname, '../service-account.json');
const SUPABASE_PROJECT_ID = process.env.EXPO_PUBLIC_SUPABASE_PROJECT_ID || '';
const DEFAULT_WEBHOOK_URL = SUPABASE_PROJECT_ID 
  ? `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/drive-webhook`
  : '';
const WEBHOOK_URL = process.env.DRIVE_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;

// Retrieve Folder ID from environment variable or command line arguments
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || process.argv[2];

async function setupWatch() {
  console.log('--- Google Drive Watch Channel Setup ---');
  
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`ERROR: Service account file not found at: ${SERVICE_ACCOUNT_PATH}`);
    console.error('Please place your Google Service Account JSON file at the root of the project as "service-account.json",');
    console.error('or set the GOOGLE_APPLICATION_CREDENTIALS environment variable.');
    process.exit(1);
  }

  if (!WEBHOOK_URL) {
    console.error('ERROR: Webhook URL is not configured.');
    console.error('Please set EXPO_PUBLIC_SUPABASE_PROJECT_ID or DRIVE_WEBHOOK_URL in your .env file.');
    process.exit(1);
  }

  if (!FOLDER_ID) {
    console.error('ERROR: Google Drive Folder ID is required.');
    console.error('Usage: node scripts/setup-drive-watch.js <FOLDER_ID>');
    console.error('Or set GOOGLE_DRIVE_FOLDER_ID in your .env file.');
    process.exit(1);
  }

  try {
    console.log(`Using credentials from: ${SERVICE_ACCOUNT_PATH}`);
    console.log(`Webhook URL: ${WEBHOOK_URL}`);
    console.log(`Monitoring Folder ID: ${FOLDER_ID}`);

    // Authenticate with Google API
    const auth = new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_PATH,
      scopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.metadata.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Generate a unique channel ID for this watch subscription
    const channelId = crypto.randomUUID();

    // Watch channel expiration is max 24 hours (86,400 seconds) for file/folder changes.
    // Set expiration to 24 hours from now.
    const expiration = Date.now() + 24 * 60 * 60 * 1000;

    console.log('Sending watch request to Google Drive API...');

    const response = await drive.files.watch({
      fileId: FOLDER_ID,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: WEBHOOK_URL,
        expiration: expiration.toString(),
        token: 'aiesnaf_drive_watch_token'
      },
    });

    console.log('\n✅ WATCH CHANNEL ESTABLISHED SUCCESSFULLY!');
    console.log('---------------------------------------------');
    console.log(`Channel ID (Subscription ID):  ${response.data.id}`);
    console.log(`Resource ID (Watched Folder):  ${response.data.resourceId}`);
    console.log(`Resource URI:                  ${response.data.resourceUri}`);
    console.log(`Expiration (Epoch MS):         ${response.data.expiration}`);
    console.log(`Expiration (Readable):         ${new Date(parseInt(response.data.expiration)).toLocaleString()}`);
    console.log('---------------------------------------------');
    console.log('Google Drive will now send push notifications to drive-webhook whenever');
    console.log('changes are detected inside the specified folder.');

  } catch (error) {
    console.error('❌ Failed to establish watch channel:', error.message);
    if (error.response && error.response.data) {
      console.error('API Error Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

setupWatch();
