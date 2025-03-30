/**
 * Tests for the dirUtils module
 */

const { dirUtils } = require('../src');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Create a temporary test directory
const TEST_DIR = path.join(os.tmpdir(), 'ai-tools-dir-test-' + Date.now());

// Setup and teardown
beforeAll(async () => {
  await fs.ensureDir(TEST_DIR);
});

afterAll(async () => {
  await fs.remove(TEST_DIR);
});

describe('dirUtils', () => {
  describe('createDirectory and directoryExists', () => {
    test('should create a directory and check if it exists', async () => {
      const dirPath = path.join(TEST_DIR, 'test-dir');
      
      await dirUtils.createDirectory(dirPath);
      const exists = await dirUtils.directoryExists(dirPath);
      
      expect(exists).toBe(true);
    });
    
    test('should create nested directories', async () => {
      const dirPath = path.join(TEST_DIR, 'nested', 'test-dir');
      
      await dirUtils.createDirectory(dirPath);
      const exists = await dirUtils.directoryExists(dirPath);
      
      expect(exists).toBe(true);
    });
    
    test('should return false for a non-existent directory', async () => {
      const dirPath = path.join(TEST_DIR, 'non-existent-dir');
      
      const exists = await dirUtils.directoryExists(dirPath);
      
      expect(exists).toBe(false);
    });
  });
  
  describe('listFiles', () => {
    beforeEach(async () => {
      // Create test files and directories
      const testFiles = [
        path.join(TEST_DIR, 'file1.txt'),
        path.join(TEST_DIR, 'file2.js'),
        path.join(TEST_DIR, 'file3.json'),
        path.join(TEST_DIR, 'nested', 'file4.txt'),
        path.join(TEST_DIR, 'nested', 'file5.js'),
        path.join(TEST_DIR, 'nested', 'deep', 'file6.json')
      ];
      
      for (const file of testFiles) {
        await fs.ensureDir(path.dirname(file));
        await fs.writeFile(file, 'test content');
      }
    });
    
    test('should list files in a directory', async () => {
      const files = await dirUtils.listFiles(TEST_DIR);
      
      expect(files).toHaveLength(3);
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.js');
      expect(files).toContain('file3.json');
    });
    
    test('should list files recursively', async () => {
      const files = await dirUtils.listFiles(TEST_DIR, { recursive: true });
      
      expect(files).toHaveLength(6);
      expect(files).toContain(path.join('nested', 'file4.txt'));
      expect(files).toContain(path.join('nested', 'deep', 'file6.json'));
    });
    
    test('should filter files by extension', async () => {
      const files = await dirUtils.listFiles(TEST_DIR, { 
        recursive: true,
        filter: '.js'
      });
      
      expect(files).toHaveLength(2);
      expect(files).toContain('file2.js');
      expect(files).toContain(path.join('nested', 'file5.js'));
    });
    
    test('should include directories in results', async () => {
      const items = await dirUtils.listFiles(TEST_DIR, { 
        includeDirectories: true
      });
      
      expect(items).toContain('nested');
    });
    
    test('should return full paths', async () => {
      const files = await dirUtils.listFiles(TEST_DIR, { 
        fullPaths: true
      });
      
      expect(files).toContain(path.join(TEST_DIR, 'file1.txt'));
    });
  });
  
  describe('copyDirectory', () => {
    beforeEach(async () => {
      // Create test files and directories
      const sourceDir = path.join(TEST_DIR, 'source');
      await fs.ensureDir(sourceDir);
      await fs.ensureDir(path.join(sourceDir, 'subdir'));
      await fs.writeFile(path.join(sourceDir, 'file1.txt'), 'content 1');
      await fs.writeFile(path.join(sourceDir, 'subdir', 'file2.txt'), 'content 2');
    });
    
    test('should copy a directory and its contents', async () => {
      const sourceDir = path.join(TEST_DIR, 'source');
      const destDir = path.join(TEST_DIR, 'destination');
      
      await dirUtils.copyDirectory(sourceDir, destDir);
      
      const destExists = await dirUtils.directoryExists(destDir);
      const file1Exists = await fs.pathExists(path.join(destDir, 'file1.txt'));
      const file2Exists = await fs.pathExists(path.join(destDir, 'subdir', 'file2.txt'));
      
      expect(destExists).toBe(true);
      expect(file1Exists).toBe(true);
      expect(file2Exists).toBe(true);
    });
  });
  
  describe('deleteDirectory', () => {
    beforeEach(async () => {
      // Create test directory
      const dirToDelete = path.join(TEST_DIR, 'to-delete');
      await fs.ensureDir(dirToDelete);
      await fs.ensureDir(path.join(dirToDelete, 'subdir'));
      await fs.writeFile(path.join(dirToDelete, 'file.txt'), 'content');
      await fs.writeFile(path.join(dirToDelete, 'subdir', 'file.txt'), 'content');
    });
    
    test('should delete a directory and its contents', async () => {
      const dirToDelete = path.join(TEST_DIR, 'to-delete');
      
      await dirUtils.deleteDirectory(dirToDelete);
      
      const exists = await dirUtils.directoryExists(dirToDelete);
      expect(exists).toBe(false);
    });
    
    test('should throw an error when deleting a non-existent directory', async () => {
      const dirPath = path.join(TEST_DIR, 'non-existent-dir');
      
      await expect(dirUtils.deleteDirectory(dirPath)).rejects.toThrow();
    });
  });
});
