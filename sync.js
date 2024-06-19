const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Function to upload a file link to Firestore
async function uploadFileLink(relativePath) {
  const repoUrl = 'https://raw.githubusercontent.com/your-username/your-repo/main/'; // Adjust the URL according to your repo
  const fileUrl = repoUrl + relativePath.split(path.sep).join('/');
  const docPath = relativePath.replace(/\//g, '_').replace(/\./g, '_'); // Create a valid Firestore document path
  const fileRef = db.collection('files').doc(docPath);
  await fileRef.set({ url: fileUrl });
}

// Recursively traverse the directory and upload file links
async function traverseDirectory(dir, relativePath = '') {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileRelativePath = path.join(relativePath, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      // Ignore .git directory and other unwanted directories
      if (!['.git', 'node_modules', '.github'].includes(file)) {
        await traverseDirectory(filePath, fileRelativePath);
      }
    } else {
      // Process only .png and .gif files
      if (file.endsWith('.png') || file.endsWith('.gif')) {
        await uploadFileLink(fileRelativePath);
      }
    }
  }
}

// Start the upload process from the repository root
traverseDirectory('.')
  .then(() => {
    console.log('Sync completed successfully.');
  })
  .catch(err => {
    console.error('Error during sync:', err);
  });
