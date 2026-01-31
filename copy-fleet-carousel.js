const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'public/assets/images/carousel');
const destDir = path.join(__dirname, 'src/app/fleet-details/assets/images/carousel');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy all files
fs.readdirSync(sourceDir).forEach(file => {
  const sourceFile = path.join(sourceDir, file);
  const destFile = path.join(destDir, file);
  fs.copyFileSync(sourceFile, destFile);
  console.log(`Copied ${file}`);
});

console.log('All carousel images copied!');
