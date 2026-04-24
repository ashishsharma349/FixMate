const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.json') || file.endsWith('.html')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('.');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
        console.log(`Fixing conflicts in: ${file}`);
        // Regex to keep only our part (HEAD) and remove the remote part
             // In most of our cases, HEAD is the local code we want to keep.
             return ourPart + '\n';
        });
        
        // Simpler approach for package.json and others: 
        // Just remove all markers and keep the first block.
        const lines = content.split('\n');
        let newLines = [];
        let keeping = true;
        
        for (let line of lines) {
                keeping = true;
                continue;
            }
                keeping = true;
                continue;
            }
            if (keeping) {
                newLines.push(line);
            }
        }
        
        fs.writeFileSync(file, newLines.join('\n'));
    }
});

console.log("--- ALL CONFLICTS RESOLVED ---");
