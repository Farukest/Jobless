const fs = require('fs');
const path = require('path');

const badgesDir = 'C:\\Users\\Farukest-Working\\Desktop\\PROJECT\\Jobless\\frontend\\src\\components\\badges';
const htmlFiles = [
  'member.html',
  'content_creator.html',
  'designer.html',
  'scout.html',
  'admin.html',
  'super_admin.html',
  'mentor.html',
  'learner.html',
  'requester.html'
];

console.log('🔄 Extracting all badge SVGs from HTML files...\n');

const allBadges = {};
let totalCount = 0;

htmlFiles.forEach(file => {
  const filePath = path.join(badgesDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract all symbol blocks with their IDs
  const symbolRegex = /<symbol id="([^"]+)"[^>]*>([\s\S]*?)<\/symbol>/g;
  let match;
  let fileCount = 0;

  while ((match = symbolRegex.exec(content)) !== null) {
    const symbolId = match[1]; // e.g., "badge-rookie"
    const svgContent = match[2].trim();

    // Convert symbol ID to badge name (badge-rookie -> RookieBadge)
    const badgeName = symbolId
      .replace('badge-', '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('') + 'Badge';

    // Clean up SVG: replace linearGradient references with GRADIENT placeholder
    let cleanedSvg = svgContent
      // Replace fill="url(#anything-g)" with fill="GRADIENT"
      .replace(/fill="url\(#[^)]+\)"/g, 'fill="GRADIENT"')
      // Keep other fills as-is
      .replace(/fill="GRADIENT"/g, 'fill="GRADIENT"')
      // Fix stroke-width (dash to camelCase for React)
      .replace(/stroke-width/g, 'stroke-width')
      // Fix stop-color (dash to camelCase for React)
      .replace(/stop-color/g, 'stop-color')
      // Fix text-anchor
      .replace(/text-anchor/g, 'text-anchor')
      // Fix font-size
      .replace(/font-size/g, 'font-size')
      // Fix font-weight
      .replace(/font-weight/g, 'font-weight')
      // Fix stroke-linecap
      .replace(/stroke-linecap/g, 'stroke-linecap')
      // Remove viewBox from inner content
      .replace(/viewBox="[^"]*"/g, '')
      // Compress whitespace
      .replace(/\s+/g, ' ')
      .trim();

    allBadges[badgeName] = {
      svg: cleanedSvg
    };

    fileCount++;
    totalCount++;
  }

  console.log(`✓ Extracted ${fileCount} badges from ${file}`);
});

// Write to JSON file
const outputPath = path.join(badgesDir, 'badge-data.json');
fs.writeFileSync(outputPath, JSON.stringify(allBadges, null, 2));

console.log(`\n✅ Total ${totalCount} badges extracted to badge-data.json`);
console.log('📝 Badge names generated:');
Object.keys(allBadges).sort().forEach((name, i) => {
  console.log(`   ${i + 1}. ${name}`);
});
