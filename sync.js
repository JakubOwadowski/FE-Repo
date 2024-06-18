const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Function to upload a file to Firestore
async function uploadFile(filePath, relativePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const components = relativePath.replace(/\//g, '_').split('_');
  if (components.length % 2 !== 0) {
    components.push('file');
  }
  const adjustedPath = components.join('_');
  const fileRef = db.doc(adjustedPath);
  await fileRef.set({ content: fileContent });
}

// Recursively traverse the directory and upload files
async function traverseDirectory(dir, relativePath = '') {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileRelativePath = path.join(relativePath, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      // Ignore .git directory and other unwanted directories
      if (file !== '.git') {
        await traverseDirectory(filePath, fileRelativePath);
      }
    } else {
      // Ignore .git files and other unwanted files
      if (!file.startsWith('.git')) {
        await uploadFile(filePath, fileRelativePath);
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
