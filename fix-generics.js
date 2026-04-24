const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'src/services');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Encontra `Promise<Result<TIPO_AQUI>>`
            // E depois `storage.getItem<unknown /* ... */>`
            content = content.replace(/Promise<Result<(.*?)>>[\s\S]*?storage\.getItem<unknown[^>]*>\(cacheKey\)/g, (match, typeArg) => {
                modified = true;
                return match.replace(/storage\.getItem<unknown[^>]*>/, `storage.getItem<${typeArg}>`);
            });

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Fixed generics in ${file}`);
            }
        }
    }
}

processDir(servicesDir);
