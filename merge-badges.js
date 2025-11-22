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

console.log('🔄 Extracting SVG symbols from HTML files...\n');

let allSymbols = '';
let allGradients = '';

htmlFiles.forEach(file => {
  const filePath = path.join(badgesDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract gradients (only once)
  if (allGradients === '') {
    const gradientMatch = content.match(/<linearGradient[\s\S]*?<\/linearGradient>/g);
    if (gradientMatch) {
      allGradients = gradientMatch.join('\n        ');
    }
  }

  // Extract all symbol blocks
  const symbolMatches = content.match(/<symbol[\s\S]*?<\/symbol>/g);
  if (symbolMatches) {
    allSymbols += symbolMatches.join('\n\n        ');
    console.log(`✓ Extracted ${symbolMatches.length} symbols from ${file}`);
  }
});

// Create combined SVG sprite
const spriteContent = `<!-- Auto-generated badge sprite - DO NOT EDIT MANUALLY -->
<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
    <defs>
        ${allGradients}
    </defs>

        ${allSymbols}
</svg>`;

// Write to public folder
const outputPath = 'C:\\Users\\Farukest-Working\\Desktop\\PROJECT\\Jobless\\frontend\\public\\badge-sprite.svg';
fs.writeFileSync(outputPath, spriteContent);

console.log(`\n✅ Created badge sprite: ${outputPath}`);
console.log('📝 Total symbols extracted');
