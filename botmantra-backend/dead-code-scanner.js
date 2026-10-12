/**
 * Dead Code Scanner
 * Identifies unused files, deprecated code, and cleanup opportunities
 */

const fs = require('fs');
const path = require('path');

const BACKEND_DIR = __dirname;
const SCAN_EXTENSIONS = ['.js', '.json', '.sql', '.md'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build'];

// Track findings
const findings = {
  unusedFiles: [],
  deprecatedFunctions: [],
  duplicateCode: [],
  largeFiles: [],
  emptyFiles: [],
  recommendations: []
};

// Known deprecated patterns
const DEPRECATED_PATTERNS = [
  { pattern: /require\('request'\)/, message: 'Use axios or fetch instead of deprecated request library' },
  { pattern: /\.createConnection\(/, message: 'Direct DB connections - should use Supabase client' },
  { pattern: /mysql\./, message: 'MySQL direct usage - should use Supabase' },
  { pattern: /mongodb\./, message: 'MongoDB direct usage - not aligned with Supabase' },
  { pattern: /eval\(/, message: 'Dangerous eval() usage' },
  { pattern: /new Function\(/, message: 'Dynamic function creation - security risk' }
];

// Files that should exist
const REQUIRED_FILES = [
  'package.json',
  'server.js',
  '.env.example',
  'rpc-handler.js',
  'routes/api-routes-v1.js'
];

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else {
      const ext = path.extname(file);
      if (SCAN_EXTENSIONS.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const stats = fs.statSync(filePath);
  const relativePath = path.relative(BACKEND_DIR, filePath);

  // Check if file is empty
  if (content.trim().length === 0) {
    findings.emptyFiles.push(relativePath);
    return;
  }

  // Check file size (> 5MB)
  if (stats.size > 5 * 1024 * 1024) {
    findings.largeFiles.push({
      file: relativePath,
      size: (stats.size / 1024 / 1024).toFixed(2) + ' MB'
    });
  }

  // Check for deprecated patterns
  DEPRECATED_PATTERNS.forEach(({ pattern, message }) => {
    if (pattern.test(content)) {
      findings.deprecatedFunctions.push({
        file: relativePath,
        issue: message
      });
    }
  });

  // Check for potential dead code indicators
  if (filePath.endsWith('.js')) {
    // Check if file exports anything
    if (!content.includes('module.exports') && !content.includes('export ')) {
      // Check if it's not an executable script
      if (!content.includes('if (require.main === module)')) {
        findings.unusedFiles.push({
          file: relativePath,
          reason: 'No exports found - might be unused'
        });
      }
    }
  }
}

function findDuplicateFiles(files) {
  const filesByName = {};

  files.forEach(file => {
    const basename = path.basename(file);
    if (!filesByName[basename]) {
      filesByName[basename] = [];
    }
    filesByName[basename].push(path.relative(BACKEND_DIR, file));
  });

  Object.keys(filesByName).forEach(name => {
    if (filesByName[name].length > 1) {
      findings.duplicateCode.push({
        filename: name,
        locations: filesByName[name]
      });
    }
  });
}

function checkRequiredFiles() {
  REQUIRED_FILES.forEach(file => {
    const filePath = path.join(BACKEND_DIR, file);
    if (!fs.existsSync(filePath)) {
      findings.recommendations.push({
        type: 'missing_file',
        message: `Required file missing: ${file}`
      });
    }
  });
}

function analyzePackageJson() {
  const packagePath = path.join(BACKEND_DIR, 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    // Check for unused dependencies
    if (pkg.dependencies) {
      const deps = Object.keys(pkg.dependencies);
      
      // Known deprecated packages
      const deprecated = ['request', 'mongodb', 'mysql', 'express-graphql'];
      deps.forEach(dep => {
        if (deprecated.includes(dep)) {
          findings.recommendations.push({
            type: 'deprecated_dependency',
            message: `Deprecated dependency: ${dep} - consider removing`
          });
        }
      });
    }

    // Check scripts
    if (!pkg.scripts || !pkg.scripts.test) {
      findings.recommendations.push({
        type: 'missing_script',
        message: 'No test script defined in package.json'
      });
    }

    if (!pkg.scripts || !pkg.scripts.start) {
      findings.recommendations.push({
        type: 'missing_script',
        message: 'No start script defined in package.json'
      });
    }
  }
}

function scanForOldMigrations() {
  const migrationsDir = path.join(BACKEND_DIR, 'db-migrations');
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql'));

    if (sqlFiles.length > 50) {
      findings.recommendations.push({
        type: 'cleanup',
        message: `${sqlFiles.length} migration files found - consider archiving old migrations`
      });
    }

    // Check for very old migrations (before 2025)
    sqlFiles.forEach(file => {
      if (file.match(/202[0-4]/)) {
        findings.recommendations.push({
          type: 'old_migration',
          message: `Old migration file: ${file} - consider archiving`
        });
      }
    });
  }
}

function generateCleanupScript() {
  let script = `#!/bin/bash
# Auto-generated cleanup script
# Review before running!

echo "🧹 Starting cleanup..."

`;

  // Add commands to delete empty files
  if (findings.emptyFiles.length > 0) {
    script += '\n# Remove empty files\n';
    findings.emptyFiles.forEach(file => {
      script += `# rm "${file}"\n`;
    });
  }

  // Add commands for old migrations
  const oldMigrations = findings.recommendations.filter(r => r.type === 'old_migration');
  if (oldMigrations.length > 0) {
    script += '\n# Archive old migrations\n';
    script += '# mkdir -p archive/migrations\n';
    oldMigrations.forEach(({ message }) => {
      const file = message.split(': ')[1]?.split(' -')[0];
      if (file) {
        script += `# mv "db-migrations/${file}" archive/migrations/\n`;
      }
    });
  }

  script += '\necho "✅ Cleanup complete!"\n';

  return script;
}

// ============================================
// MAIN SCANNER
// ============================================

console.log('╔════════════════════════════════════════╗');
console.log('║     DEAD CODE SCANNER                 ║');
console.log('╚════════════════════════════════════════╝\n');

console.log('📂 Scanning directory:', BACKEND_DIR);

const allFiles = getAllFiles(BACKEND_DIR);
console.log(`📄 Found ${allFiles.length} files to analyze\n`);

// Run analysis
allFiles.forEach(analyzeFile);
findDuplicateFiles(allFiles);
checkRequiredFiles();
analyzePackageJson();
scanForOldMigrations();

// Generate report
console.log('╔════════════════════════════════════════╗');
console.log('║           SCAN RESULTS                ║');
console.log('╚════════════════════════════════════════╝\n');

console.log(`📊 Summary:`);
console.log(`   Empty Files: ${findings.emptyFiles.length}`);
console.log(`   Large Files: ${findings.largeFiles.length}`);
console.log(`   Deprecated Code: ${findings.deprecatedFunctions.length}`);
console.log(`   Duplicate Files: ${findings.duplicateCode.length}`);
console.log(`   Potentially Unused: ${findings.unusedFiles.length}`);
console.log(`   Recommendations: ${findings.recommendations.length}`);

if (findings.emptyFiles.length > 0) {
  console.log('\n📭 Empty Files (safe to delete):');
  findings.emptyFiles.forEach(file => console.log(`   - ${file}`));
}

if (findings.largeFiles.length > 0) {
  console.log('\n📦 Large Files (consider splitting):');
  findings.largeFiles.forEach(({ file, size }) => {
    console.log(`   - ${file} (${size})`);
  });
}

if (findings.deprecatedFunctions.length > 0) {
  console.log('\n⚠️  Deprecated Code:');
  findings.deprecatedFunctions.forEach(({ file, issue }) => {
    console.log(`   - ${file}`);
    console.log(`     ${issue}`);
  });
}

if (findings.duplicateCode.length > 0) {
  console.log('\n📋 Duplicate Filenames:');
  findings.duplicateCode.forEach(({ filename, locations }) => {
    console.log(`   ${filename}:`);
    locations.forEach(loc => console.log(`     - ${loc}`));
  });
}

if (findings.unusedFiles.length > 0) {
  console.log('\n🗑️  Potentially Unused Files:');
  findings.unusedFiles.slice(0, 10).forEach(({ file, reason }) => {
    console.log(`   - ${file}`);
    console.log(`     ${reason}`);
  });
  if (findings.unusedFiles.length > 10) {
    console.log(`   ... and ${findings.unusedFiles.length - 10} more`);
  }
}

if (findings.recommendations.length > 0) {
  console.log('\n💡 Recommendations:');
  findings.recommendations.forEach(({ type, message }) => {
    console.log(`   [${type}] ${message}`);
  });
}

// Save full report
const reportPath = path.join(BACKEND_DIR, 'DEAD_CODE_REPORT.json');
fs.writeFileSync(reportPath, JSON.stringify(findings, null, 2));
console.log(`\n📄 Full report saved to: DEAD_CODE_REPORT.json`);

// Generate cleanup script
const cleanupScript = generateCleanupScript();
const scriptPath = path.join(BACKEND_DIR, 'cleanup.sh');
fs.writeFileSync(scriptPath, cleanupScript);
console.log(`📜 Cleanup script saved to: cleanup.sh`);
console.log(`   Review the script and uncomment lines before running!`);

console.log('\n✨ Scan complete!\n');
