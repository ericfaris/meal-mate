#!/usr/bin/env node

/**
 * Version Bump Script
 *
 * Usage:
 *   node scripts/bump-version.js [patch|minor|major]
 *   node scripts/bump-version.js --set 1.2.3
 *
 * This script updates version.json which is the single source of truth
 * for versioning across the entire project (backend Docker, frontend Expo/EAS).
 */

const fs = require('fs');
const path = require('path');

const VERSION_FILE = path.join(__dirname, '..', 'version.json');

function readVersion() {
  const content = fs.readFileSync(VERSION_FILE, 'utf8');
  return JSON.parse(content);
}

function writeVersion(data) {
  fs.writeFileSync(VERSION_FILE, JSON.stringify(data, null, 2) + '\n');
}

function bumpVersion(version, type) {
  const parts = version.split('.').map(Number);

  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2]++;
      break;
  }

  return parts.join('.');
}

function main() {
  const args = process.argv.slice(2);
  const versionData = readVersion();

  let newVersion;

  if (args[0] === '--set' && args[1]) {
    // Set specific version
    newVersion = args[1];
    if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
      console.error('Error: Version must be in format X.Y.Z');
      process.exit(1);
    }
  } else {
    // Bump version
    const bumpType = args[0] || 'patch';
    if (!['patch', 'minor', 'major'].includes(bumpType)) {
      console.error('Error: Bump type must be patch, minor, or major');
      process.exit(1);
    }
    newVersion = bumpVersion(versionData.version, bumpType);
  }

  const oldVersion = versionData.version;
  versionData.version = newVersion;
  versionData.buildNumber++;

  writeVersion(versionData);

  console.log(`Version bumped: ${oldVersion} -> ${newVersion}`);
  console.log(`Build number: ${versionData.buildNumber}`);
  console.log(`\nUpdated ${VERSION_FILE}`);

  // Output for CI/CD pipelines
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${newVersion}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `build_number=${versionData.buildNumber}\n`);
  }
}

main();
