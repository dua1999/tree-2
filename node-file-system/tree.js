const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

async function generateTree(dirPath, depth) {
  const rootDir = path.basename(dirPath);
  const tree = {};

  async function traverse(currentPath, currentDepth) {
    if (currentDepth > depth) {
      return;
    }

    const files = await readdir(currentPath);

    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const fileStats = await stat(filePath);

      if (fileStats.isDirectory()) {
        if (!tree[file]) {
          tree[file] = {};
        }

        if (currentDepth < depth) {
          await traverse(filePath, currentDepth + 1);
        }
      } else {
        tree[file] = null;
      }
    }
  }

  await traverse(dirPath, 0);

  return { [rootDir]: tree };
}

function printTree(tree, indent = '') {
  const keys = Object.keys(tree);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = tree[key];

    console.log(`${indent}${i === keys.length - 1 ? '└──' : '├──'} ${key}`);

    if (value && typeof value === 'object') {
      printTree(value, `${indent}${i === keys.length - 1 ? '    ' : '│   '}`);
    }
  }
}

async function run() {
  const dirPath = process.argv[2];
  const depth = parseInt(process.argv[4]);

  if (!dirPath) {
    console.log('Please provide a directory path.');
    return;
  }

  if (isNaN(depth)) {
    console.log('Invalid depth value. Please provide a valid depth value.');
    return;
  }

  try {
    const tree = await generateTree(dirPath, depth);
    printTree(tree);

    const { directories, files } = countItems(tree);
    console.log(`\n${directories} directories, ${files} files`);
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

function countItems(tree) {
  let directories = 0;
  let files = 0;

  function countNodes(node) {
    const keys = Object.keys(node);

    for (const key of keys) {
      if (node[key] && typeof node[key] === 'object') {
        directories++;
        countNodes(node[key]);
      } else {
        files++;
      }
    }
  }

  countNodes(tree);

  return { directories, files };
}

run();
