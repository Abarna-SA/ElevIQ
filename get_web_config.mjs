import { execSync } from 'child_process';
import fs from 'fs';

try {
  console.log('Fetching app list...');
  const output = execSync('npx firebase-tools apps:list --project elev-iq --json').toString();
  
  // Clean output by keeping only the JSON part
  const jsonStr = output.substring(output.indexOf('{'));
  const data = JSON.parse(jsonStr);
  const appId = data.result[0].appId;
  console.log(`Found Web App ID: ${appId}`);

  console.log('Fetching web SDK config...');
  const sdkOutput = execSync(`npx firebase-tools apps:sdkconfig web ${appId} --project elev-iq --json`).toString();
  const sdkJsonStr = sdkOutput.substring(sdkOutput.indexOf('{'));
  const sdkData = JSON.parse(sdkJsonStr);
  const c = sdkData.result.sdkConfig;

  const env = [
    `NEXT_PUBLIC_FIREBASE_API_KEY=${c.apiKey}`,
    `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${c.authDomain}`,
    `NEXT_PUBLIC_FIREBASE_PROJECT_ID=${c.projectId}`,
    `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${c.storageBucket}`,
    `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${c.messagingSenderId}`,
    `NEXT_PUBLIC_FIREBASE_APP_ID=${c.appId}`,
    `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=${c.measurementId || ''}`
  ].join('\n');
  
  fs.writeFileSync('eleviq_web/.env.local', env);
  console.log('.env.local has been populated successfully for the web app.');
} catch (e) {
  console.error('Script failed:', e.message);
  process.exit(1);
}
