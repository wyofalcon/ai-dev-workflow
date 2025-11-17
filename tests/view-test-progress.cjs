#!/usr/bin/env node
/**
 * Test Progress Viewer
 * 
 * Displays the current test progress in a readable format
 * 
 * Usage:
 *   node tests/view-test-progress.cjs                    # View all tests
 *   node tests/view-test-progress.cjs --summary          # Summary only
 *   node tests/view-test-progress.cjs --category auth    # Specific category
 *   node tests/view-test-progress.cjs --failed           # Show only failed
 *   node tests/view-test-progress.cjs --pending          # Show only pending
 */

const fs = require('fs').promises;
const path = require('path');

const PROGRESS_FILE = path.join(__dirname, 'test-progress.json');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function getStatusIcon(status, result) {
  if (status === 'completed') {
    if (result === 'pass') return colorize('✅', 'green');
    if (result === 'fail') return colorize('❌', 'red');
    if (result === 'undetermined') return colorize('❓', 'yellow');
  }
  if (status === 'running') return colorize('🏃', 'blue');
  if (status === 'needs-human') return colorize('⏸️ ', 'yellow');
  if (status === 'skipped') return colorize('⏭️ ', 'gray');
  return colorize('⏳', 'gray');
}

function formatDate(isoString) {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function loadProgress() {
  try {
    const content = await fs.readFile(PROGRESS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load progress file:', error.message);
    process.exit(1);
  }
}

function calculateStats(data) {
  let total = 0;
  let passed = 0;
  let failed = 0;
  let undetermined = 0;
  let notStarted = 0;
  let needsHuman = 0;
  let running = 0;
  let skipped = 0;
  
  for (const tests of Object.values(data.tests)) {
    for (const test of Object.values(tests)) {
      total++;
      if (test.status === 'completed') {
        if (test.result === 'pass') passed++;
        else if (test.result === 'fail') failed++;
        else if (test.result === 'undetermined') undetermined++;
      } else if (test.status === 'not-started') {
        notStarted++;
      } else if (test.status === 'needs-human') {
        needsHuman++;
      } else if (test.status === 'running') {
        running++;
      } else if (test.status === 'skipped') {
        skipped++;
      }
    }
  }
  
  const completed = passed + failed + undetermined;
  const progress = (completed / total * 100).toFixed(1);
  const passRate = completed > 0 ? (passed / completed * 100).toFixed(1) : 0;
  
  return {
    total,
    passed,
    failed,
    undetermined,
    notStarted,
    needsHuman,
    running,
    skipped,
    completed,
    progress,
    passRate
  };
}

function printSummary(data, stats) {
  console.log('\n' + '═'.repeat(80));
  console.log(colorize('  CVSTOMIZE TEST PROGRESS DASHBOARD', 'bright'));
  console.log('═'.repeat(80));
  
  if (data.lastRun) {
    console.log(`  Last Run: ${formatDate(data.lastRun)}`);
  }
  if (data.currentTest) {
    console.log(`  Current Test: ${colorize(data.currentTest, 'cyan')}`);
  }
  
  console.log('\n' + colorize('  Overall Progress', 'bright'));
  console.log('  ' + '─'.repeat(78));
  
  const progressBar = createProgressBar(stats.progress);
  console.log(`  ${progressBar} ${stats.progress}%`);
  console.log(`  ${stats.completed} of ${stats.total} tests completed\n`);
  
  console.log(colorize('  Test Results', 'bright'));
  console.log('  ' + '─'.repeat(78));
  console.log(`  ${getStatusIcon('completed', 'pass')} Passed:       ${colorize(stats.passed.toString().padStart(3), 'green')}`);
  console.log(`  ${getStatusIcon('completed', 'fail')} Failed:       ${colorize(stats.failed.toString().padStart(3), 'red')}`);
  console.log(`  ${getStatusIcon('completed', 'undetermined')} Undetermined: ${colorize(stats.undetermined.toString().padStart(3), 'yellow')}`);
  console.log(`  ${getStatusIcon('needs-human')} Needs Human:  ${colorize(stats.needsHuman.toString().padStart(3), 'yellow')}`);
  console.log(`  ${getStatusIcon('running')} Running:      ${colorize(stats.running.toString().padStart(3), 'blue')}`);
  console.log(`  ${getStatusIcon('skipped')} Skipped:      ${colorize(stats.skipped.toString().padStart(3), 'gray')}`);
  console.log(`  ${getStatusIcon('not-started')} Not Started:  ${colorize(stats.notStarted.toString().padStart(3), 'gray')}`);
  
  if (stats.completed > 0) {
    console.log(`\n  Pass Rate: ${colorize(stats.passRate + '%', stats.passRate >= 80 ? 'green' : 'yellow')}`);
  }
  
  console.log('═'.repeat(80) + '\n');
}

function createProgressBar(percent, width = 50) {
  const filled = Math.round(width * percent / 100);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  let color = 'red';
  if (percent >= 80) color = 'green';
  else if (percent >= 50) color = 'yellow';
  
  return colorize(bar, color);
}

function printCategoryDetails(categoryName, tests) {
  const categoryStats = {
    total: 0,
    passed: 0,
    failed: 0,
    pending: 0
  };
  
  for (const test of Object.values(tests)) {
    categoryStats.total++;
    if (test.status === 'completed' && test.result === 'pass') categoryStats.passed++;
    else if (test.status === 'completed' && test.result === 'fail') categoryStats.failed++;
    else categoryStats.pending++;
  }
  
  console.log(colorize(`\n  ${categoryName.toUpperCase().replace(/-/g, ' ')}`, 'bright'));
  console.log(`  ${colorize(categoryStats.passed.toString(), 'green')} passed | ${colorize(categoryStats.failed.toString(), 'red')} failed | ${colorize(categoryStats.pending.toString(), 'gray')} pending`);
  console.log('  ' + '─'.repeat(78));
  
  for (const [testId, test] of Object.entries(tests)) {
    const icon = getStatusIcon(test.status, test.result);
    const idColor = test.status === 'completed' ? 'green' : 'gray';
    
    console.log(`  ${icon} ${colorize(testId.padEnd(30), idColor)} ${test.name}`);
    
    if (test.lastAttempt) {
      console.log(`      ${colorize('Last attempt:', 'gray')} ${formatDate(test.lastAttempt)}`);
    }
    
    if (test.notes) {
      console.log(`      ${colorize('Notes:', 'gray')} ${test.notes}`);
    }
    
    if (test.requiresHuman && test.status === 'not-started') {
      console.log(`      ${colorize('⚠️  Requires human verification', 'yellow')}`);
    }
  }
}

function printDetailedView(data, filter = null) {
  for (const [categoryName, tests] of Object.entries(data.tests)) {
    if (filter && !categoryName.includes(filter)) continue;
    printCategoryDetails(categoryName, tests);
  }
  console.log('\n');
}

function printFilteredTests(data, filterFn, title) {
  console.log('\n' + colorize(`  ${title}`, 'bright'));
  console.log('  ' + '─'.repeat(78));
  
  let found = false;
  for (const [categoryName, tests] of Object.entries(data.tests)) {
    for (const [testId, test] of Object.entries(tests)) {
      if (filterFn(test)) {
        found = true;
        const icon = getStatusIcon(test.status, test.result);
        console.log(`  ${icon} ${colorize(categoryName, 'cyan')} → ${colorize(testId, 'blue')}`);
        console.log(`      ${test.name}`);
        if (test.notes) {
          console.log(`      ${colorize('Notes:', 'gray')} ${test.notes}`);
        }
        if (test.lastAttempt) {
          console.log(`      ${colorize('Last attempt:', 'gray')} ${formatDate(test.lastAttempt)}`);
        }
        console.log();
      }
    }
  }
  
  if (!found) {
    console.log(colorize('  No tests match this filter.', 'gray'));
  }
  console.log();
}

async function main() {
  const args = process.argv.slice(2);
  const data = await loadProgress();
  const stats = calculateStats(data);
  
  // Always show summary first
  printSummary(data, stats);
  
  // Handle different views
  if (args.includes('--summary')) {
    // Only summary, already shown
    return;
  }
  
  if (args.includes('--failed')) {
    printFilteredTests(
      data,
      test => test.status === 'completed' && test.result === 'fail',
      'FAILED TESTS'
    );
    return;
  }
  
  if (args.includes('--pending')) {
    printFilteredTests(
      data,
      test => test.status === 'not-started' || test.status === 'running',
      'PENDING TESTS'
    );
    return;
  }
  
  if (args.includes('--needs-human')) {
    printFilteredTests(
      data,
      test => test.status === 'needs-human' || test.requiresHuman,
      'TESTS REQUIRING HUMAN VERIFICATION'
    );
    return;
  }
  
  const categoryArg = args.find(arg => arg.startsWith('--category='));
  if (categoryArg) {
    const category = categoryArg.split('=')[1];
    printDetailedView(data, category);
    return;
  }
  
  // Default: show all details
  printDetailedView(data);
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
