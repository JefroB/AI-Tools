/**
 * Tests for the fileUtils module
 */

const { fileUtils } = require('../src');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Create a temporary test directory
const TEST_DIR = path.join(os.tmpdir(), 'ai-tools-test-' + Date.now());

// Setup and teardown
beforeAll(async () => {
  await fs.ensureDir(TEST_DIR);
});

afterAll(async () => {
  await fs.remove(TEST_DIR);
});

describe('fileUtils', () => {
  describe('writeFile and readFile', () => {
    test('should write and read a text file', async () => {
      const filePath = path.join(TEST_DIR, 'test.txt');
      const content = 'Hello, world!';
      
      await fileUtils.writeFile(filePath, content);
      const result = await fileUtils.readFile(filePath);
      
      expect(result).toBe(content);
    });
    
    test('should write and read a JSON file', async () => {
      const filePath = path.join(TEST_DIR, 'test.json');
      const content = { hello: 'world', number: 42 };
      
      await fileUtils.writeFile(filePath, content);
      const result = await fileUtils.readFile(filePath);
      
      expect(result).toEqual(content);
    });
    
    test('should create parent directories when writing a file', async () => {
      const filePath = path.join(TEST_DIR, 'nested', 'dir', 'test.txt');
      const content = 'Nested file content';
      
      await fileUtils.writeFile(filePath, content);
      const result = await fileUtils.readFile(filePath);
      
      expect(result).toBe(content);
    });
    
    test('should throw an error when reading a non-existent file', async () => {
      const filePath = path.join(TEST_DIR, 'non-existent.txt');
      
      await expect(fileUtils.readFile(filePath)).rejects.toThrow();
    });
  });
  
  describe('appendFile', () => {
    test('should append content to a file', async () => {
      const filePath = path.join(TEST_DIR, 'append.txt');
      const initialContent = 'Initial content';
      const appendedContent = '\nAppended content';
      
      await fileUtils.writeFile(filePath, initialContent);
      await fileUtils.appendFile(filePath, appendedContent);
      const result = await fileUtils.readFile(filePath);
      
      expect(result).toBe(initialContent + appendedContent);
    });
    
    test('should create a file when appending to a non-existent file', async () => {
      const filePath = path.join(TEST_DIR, 'append-new.txt');
      const content = 'New content';
      
      await fileUtils.appendFile(filePath, content);
      const result = await fileUtils.readFile(filePath);
      
      expect(result).toBe(content);
    });
  });
  
  describe('fileExists', () => {
    test('should return true for an existing file', async () => {
      const filePath = path.join(TEST_DIR, 'exists.txt');
      await fileUtils.writeFile(filePath, 'Content');
      
      const result = await fileUtils.fileExists(filePath);
      
      expect(result).toBe(true);
    });
    
    test('should return false for a non-existent file', async () => {
      const filePath = path.join(TEST_DIR, 'non-existent.txt');
      
      const result = await fileUtils.fileExists(filePath);
      
      expect(result).toBe(false);
    });
  });
  
  describe('deleteFile', () => {
    test('should delete an existing file', async () => {
      const filePath = path.join(TEST_DIR, 'to-delete.txt');
      await fileUtils.writeFile(filePath, 'Content');
      
      await fileUtils.deleteFile(filePath);
      const exists = await fileUtils.fileExists(filePath);
      
      expect(exists).toBe(false);
    });
    
    test('should throw an error when deleting a non-existent file', async () => {
      const filePath = path.join(TEST_DIR, 'non-existent.txt');
      
      await expect(fileUtils.deleteFile(filePath)).rejects.toThrow();
    });
  });
});
