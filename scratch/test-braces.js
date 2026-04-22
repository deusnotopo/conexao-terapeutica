const fs = require('fs');
const path = require('path');

function checkBraces(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            checkBraces(fullPath);
        } else if (file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const opens = (content.match(/\{/g) || []).length;
            const closes = (content.match(/\}/g) || []).length;
            if (opens !== closes) {
                console.error(`❌ UNBALANCED (${opens - closes}): ${fullPath}`);
            } else {
                console.log(`✅ Balanced: ${fullPath}`);
            }
        }
    }
}

console.log('Checking services...');
checkBraces('./src/services');
console.log('\nChecking hooks...');
checkBraces('./src/hooks');
