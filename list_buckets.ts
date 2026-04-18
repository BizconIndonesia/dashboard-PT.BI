
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

async function listBuckets() {
  try {
    // In firebase-admin, admin.storage() returns a Storage object from @google-cloud/storage
    // but we might need to access it differently depending on version.
    const storageService = admin.storage();
    // @ts-ignore
    const storage = storageService.storage || storageService;
    
    console.log('Attempting to list buckets for project:', firebaseConfig.projectId);
    
    // @ts-ignore
    const [buckets] = await storage.getBuckets();
    console.log('Available buckets:');
    if (buckets.length === 0) {
      console.log(' (No buckets found)');
    }
    buckets.forEach((bucket: any) => {
      console.log(' - ' + bucket.name);
    });
  } catch (err) {
    console.error('Error listing buckets:', err);
  }
}

listBuckets();
