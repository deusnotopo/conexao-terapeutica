const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'src/services');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            const catchRegex = /catch\s*\(\s*e\s*:\s*any\s*\)\s*\{([\s\S]*?)return\s+Result\.fail\((.*?)\);/g;
            content = content.replace(catchRegex, (match, bodyText, failArg) => {
                modified = true;
                let defaultMsg = "'Erro interno'";
                const stringMatch = failArg.match(/'([^']+)'|"([^"]+)"/);
                if (stringMatch) {
                    defaultMsg = `'${stringMatch[1] || stringMatch[2]}'`;
                }
                return `catch (e: unknown) {${bodyText}const msg = e instanceof Error ? e.message : ${defaultMsg};\n      return Result.fail(msg);`;
            });

            const remainingCatchRegex = /catch\s*\(\s*e\s*:\s*any\s*\)/g;
            content = content.replace(remainingCatchRegex, () => {
                modified = true;
                return 'catch (e: unknown)';
            });

            const genericRegex = /storage\.getItem<any>/g;
            content = content.replace(genericRegex, () => {
                modified = true;
                return 'storage.getItem<unknown /* TODO: Check type */>';
            });

            const paramAnyRegex = /:\s*any(\s*[=,\)])/g;
            content = content.replace(paramAnyRegex, (match, suffix) => {
                modified = true;
                return `: unknown${suffix}`;
            });

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${file}`);
            }
        }
    }
}

processDir(servicesDir);
