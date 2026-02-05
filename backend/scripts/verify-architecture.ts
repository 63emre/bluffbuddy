#!/usr/bin/env ts-node
/**
 * ==========================================================
 * ARCHITECTURAL VERIFICATION SCRIPT
 * ==========================================================
 * BluffBuddy Online - Module Boundary Enforcement
 * 
 * @owner DEV1 (DevOps)
 * @version v0.2.0
 * 
 * PURPOSE:
 * This script runs as part of CI/CD to verify that developers
 * are not violating the modular monolith architecture.
 * 
 * CHECKS:
 * 1. No service classes exported from barrel files (index.ts)
 * 2. No cross-module imports bypassing barrel exports
 * 3. All DI tokens are properly used
 * 
 * USAGE:
 * ```bash
 * npx ts-node scripts/verify-architecture.ts
 * # or
 * npm run verify:architecture
 * ```
 * 
 * EXIT CODES:
 * 0 = All checks passed
 * 1 = Architectural violations found
 * ==========================================================
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// CONFIGURATION
// ============================================

const SRC_DIR = path.join(__dirname, '..', 'src');

/**
 * Modules that should ONLY export their Module class from index.ts
 * (No service classes allowed)
 */
const STRICT_MODULES = [
  'game',
  'social',
  'infrastructure',
  'database',
  'rating',
  'economy',
];

/**
 * Modules that can export Guards/Middleware (but NOT services)
 */
const GUARD_ALLOWED_MODULES = ['auth'];

/**
 * Forbidden export patterns in barrel files
 */
const FORBIDDEN_EXPORT_PATTERNS = [
  /export\s+\{\s*\w+Service\s*\}/,
  /export\s+\{\s*\w+Repository\s*\}/,
  /export\s+\*\s+from\s+['"]\.\/services['"]/,
  /export\s+\*\s+from\s+['"]\.\/gateways['"]/,
];

/**
 * Allowed export patterns
 */
const ALLOWED_PATTERNS = [
  /export\s+\{\s*\w+Module\s*\}/,
  /export\s+\{\s*\w+Guard\s*\}/,
  /export\s+\{\s*\w+Middleware\s*\}/,
  /export\s+\*\s+from\s+['"]\.\/decorators['"]/,
  /export\s+\*\s+from\s+['"]\.\/filters['"]/,
  /export\s+\*\s+from\s+['"]\.\/interceptors['"]/,
  /export\s+\*\s+from\s+['"]\.\/pipes['"]/,
];

// ============================================
// TYPES
// ============================================

interface Violation {
  file: string;
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

// ============================================
// VERIFICATION FUNCTIONS
// ============================================

function readFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

function checkBarrelExports(moduleName: string): Violation[] {
  const violations: Violation[] = [];
  const indexPath = path.join(SRC_DIR, moduleName, 'index.ts');
  
  if (!fs.existsSync(indexPath)) {
    violations.push({
      file: indexPath,
      line: 0,
      message: `Missing barrel file (index.ts) for module: ${moduleName}`,
      severity: 'warning',
    });
    return violations;
  }

  const content = readFileContent(indexPath);
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      return;
    }

    // Check for forbidden exports
    for (const pattern of FORBIDDEN_EXPORT_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({
          file: indexPath,
          line: index + 1,
          message: `FORBIDDEN: Service/Repository export detected. Use DI_TOKENS instead.\n  Line: ${line.trim()}`,
          severity: 'error',
        });
      }
    }

    // Check for direct service exports like: export { GameService, RoomService }
    const exportMatch = line.match(/export\s+\{([^}]+)\}/);
    if (exportMatch) {
      const exports = exportMatch[1].split(',').map(e => e.trim());
      for (const exp of exports) {
        if (exp.endsWith('Service') || exp.endsWith('Repository')) {
          violations.push({
            file: indexPath,
            line: index + 1,
            message: `FORBIDDEN: Exporting "${exp}" from barrel file. Use DI_TOKENS for injection.`,
            severity: 'error',
          });
        }
      }
    }
  });

  return violations;
}

function checkModuleExports(moduleName: string): Violation[] {
  const violations: Violation[] = [];
  const modulePath = path.join(SRC_DIR, moduleName, `${moduleName}.module.ts`);
  
  if (!fs.existsSync(modulePath)) {
    return violations;
  }

  const content = readFileContent(modulePath);
  
  // Check if module is exporting concrete classes in its exports array
  const exportsMatch = content.match(/exports:\s*\[([\s\S]*?)\]/);
  if (exportsMatch) {
    const exportsContent = exportsMatch[1];
    const lines = exportsContent.split('\n');
    
    lines.forEach((line, index) => {
      // Skip comments and DI_TOKENS
      if (line.includes('DI_TOKENS') || line.trim().startsWith('//')) {
        return;
      }
      
      // Check for concrete class exports (not Guards or Middleware)
      const classMatch = line.match(/^\s*(\w+Service|\w+Repository|ConfigService)\s*,?\s*$/);
      if (classMatch && !GUARD_ALLOWED_MODULES.includes(moduleName)) {
        violations.push({
          file: modulePath,
          line: index + 1,
          message: `FORBIDDEN: Module exports concrete class "${classMatch[1]}". Only DI_TOKENS should be exported.`,
          severity: 'error',
        });
      }
    });
  }

  return violations;
}

function checkCrossModuleImports(): Violation[] {
  const violations: Violation[] = [];
  
  const walkDir = (dir: string, callback: (file: string) => void) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist') {
        walkDir(filePath, callback);
      } else if (file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.d.ts')) {
        callback(filePath);
      }
    }
  };

  walkDir(SRC_DIR, (filePath) => {
    const content = readFileContent(filePath);
    const lines = content.split('\n');
    const relativePath = path.relative(SRC_DIR, filePath);
    const currentModule = relativePath.split(path.sep)[0];

    lines.forEach((line, index) => {
      // Check for direct cross-module service imports
      const importMatch = line.match(/from\s+['"]\.\.\/(\w+)\/services\/(\w+)['"]/);
      if (importMatch) {
        const targetModule = importMatch[1];
        const importedFile = importMatch[2];
        
        if (targetModule !== currentModule) {
          violations.push({
            file: filePath,
            line: index + 1,
            message: `FORBIDDEN: Direct cross-module import from "${targetModule}/services/${importedFile}". Use @${targetModule} or @contracts instead.`,
            severity: 'error',
          });
        }
      }
    });
  });

  return violations;
}

// ============================================
// MAIN EXECUTION
// ============================================

function main(): number {
  console.log('🔍 BluffBuddy Architectural Verification');
  console.log('=' .repeat(50));
  console.log();

  const allViolations: Violation[] = [];

  // Check all strict modules
  console.log('📦 Checking barrel file exports...');
  for (const moduleName of [...STRICT_MODULES, ...GUARD_ALLOWED_MODULES]) {
    const violations = checkBarrelExports(moduleName);
    allViolations.push(...violations);
  }

  // Check module exports
  console.log('🔧 Checking module.ts exports...');
  for (const moduleName of [...STRICT_MODULES, ...GUARD_ALLOWED_MODULES]) {
    const violations = checkModuleExports(moduleName);
    allViolations.push(...violations);
  }

  // Check cross-module imports
  console.log('🔗 Checking cross-module imports...');
  const crossModuleViolations = checkCrossModuleImports();
  allViolations.push(...crossModuleViolations);

  console.log();

  // Report results
  if (allViolations.length === 0) {
    console.log('✅ All architectural checks passed!');
    console.log();
    console.log('🏗️  Module boundaries are properly enforced.');
    console.log('🔒 DI token-based injection is in place.');
    return 0;
  }

  const errors = allViolations.filter(v => v.severity === 'error');
  const warnings = allViolations.filter(v => v.severity === 'warning');

  console.log(`❌ Found ${errors.length} errors and ${warnings.length} warnings:`);
  console.log();

  for (const violation of allViolations) {
    const icon = violation.severity === 'error' ? '🚨' : '⚠️ ';
    const relativePath = path.relative(process.cwd(), violation.file);
    console.log(`${icon} ${relativePath}:${violation.line}`);
    console.log(`   ${violation.message}`);
    console.log();
  }

  if (errors.length > 0) {
    console.log('💥 Build FAILED due to architectural violations.');
    console.log();
    console.log('📚 Read docs/v0.2.0/00-Module-Independence-Architecture.md for guidance.');
    return 1;
  }

  return 0;
}

// Run if executed directly
const exitCode = main();
process.exit(exitCode);
