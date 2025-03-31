/**
 * Validation Utility Module for AI Tools
 * Provides schema validation with automatic schema generation and versioning
 */

const fs = require('fs-extra');
const path = require('path');
const Ajv = require('ajv');
const crypto = require('crypto');

// Initialize Ajv instance
const ajv = new Ajv({
  allErrors: true,      // Return all errors, not just the first one
  verbose: true,        // Include more information in errors
  strictSchema: false,  // Allow additional properties by default
  strictTypes: false    // More lenient type checking
});

// Schema registry to track the latest versions
let schemaRegistry = {};
const SCHEMA_DIR = path.resolve('schemas');
const REGISTRY_FILE = path.join(SCHEMA_DIR, 'registry.json');

/**
 * Initialize the validation module
 * @returns {Promise<void>}
 */
async function initialize() {
  try {
    // Ensure schema directory exists
    await fs.ensureDir(SCHEMA_DIR);
    
    // Load schema registry if it exists
    if (await fs.pathExists(REGISTRY_FILE)) {
      schemaRegistry = await fs.readJson(REGISTRY_FILE);
    } else {
      // Create empty registry
      schemaRegistry = { schemas: {} };
      await fs.writeJson(REGISTRY_FILE, schemaRegistry, { spaces: 2 });
    }
  } catch (error) {
    throw new Error(`Error initializing validation module: ${error.message}`);
  }
}

/**
 * Generate a schema from sample data
 * @param {any} sampleData - Sample data to generate schema from
 * @param {Object} options - Options for schema generation
 * @param {string} options.id - Schema identifier
 * @param {string} options.title - Schema title
 * @param {string} options.description - Schema description
 * @param {Object} options.required - Object with keys as property names and boolean values indicating if required
 * @param {Object} options.critical - Object with keys as property names and boolean values indicating if critical
 * @returns {Object} - Generated JSON Schema
 */
function generateSchema(sampleData, options = {}) {
  const { id, title, description, required = {}, critical = {} } = options;
  
  if (!id) {
    throw new Error('Schema ID is required');
  }
  
  // Helper function to determine type
  const getType = (value) => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };
  
  // Helper function to generate schema recursively
  const generateSchemaForValue = (value, path = '') => {
    const type = getType(value);
    const schema = { type };
    
    // Handle different types
    switch (type) {
      case 'object':
        schema.properties = {};
        schema.required = [];
        
        for (const [key, val] of Object.entries(value)) {
          const propPath = path ? `${path}.${key}` : key;
          schema.properties[key] = generateSchemaForValue(val, propPath);
          
          // Mark as required if specified
          if (required[propPath] || required[key]) {
            schema.required.push(key);
          }
          
          // Mark as critical if specified
          if (critical[propPath] || critical[key]) {
            schema.properties[key].critical = true;
          }
        }
        
        // If no required properties, remove the required array
        if (schema.required.length === 0) {
          delete schema.required;
        }
        break;
        
      case 'array':
        if (value.length > 0) {
          // Use the first item as a sample for items schema
          schema.items = generateSchemaForValue(value[0], `${path}[]`);
        } else {
          // Empty array, use generic items schema
          schema.items = {};
        }
        break;
        
      case 'string':
        // Add format hints for common string patterns
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          schema.format = 'date-time';
        } else if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
          schema.format = 'date';
        } else if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
          schema.format = 'email';
        } else if (/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(value)) {
          schema.format = 'uri';
        }
        break;
    }
    
    return schema;
  };
  
  // Generate the schema
  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `schema:${id}`,
    title: title || `Schema for ${id}`,
    description: description || `Automatically generated schema for ${id}`,
    ...generateSchemaForValue(sampleData)
  };
  
  return schema;
}

/**
 * Store a schema with versioning
 * @param {Object} schema - JSON Schema to store
 * @param {string} schemaId - Schema identifier
 * @returns {Promise<Object>} - Stored schema with version info
 */
async function storeSchema(schema, schemaId) {
  try {
    // Ensure schema directory exists
    await fs.ensureDir(SCHEMA_DIR);
    
    // Get current version or start at 1
    const currentVersion = (schemaRegistry.schemas[schemaId] && schemaRegistry.schemas[schemaId].version) || 0;
    const newVersion = currentVersion + 1;
    
    // Add version info to schema
    const versionedSchema = {
      ...schema,
      version: newVersion,
      created: new Date().toISOString()
    };
    
    // Generate a hash of the schema for comparison
    const schemaHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(versionedSchema))
      .digest('hex');
    
    // Save schema to file
    const schemaFileName = `${schemaId}.v${newVersion}.json`;
    const schemaPath = path.join(SCHEMA_DIR, schemaFileName);
    await fs.writeJson(schemaPath, versionedSchema, { spaces: 2 });
    
    // Update registry
    schemaRegistry.schemas[schemaId] = {
      version: newVersion,
      path: schemaPath,
      hash: schemaHash,
      updated: new Date().toISOString()
    };
    
    // Save registry
    await fs.writeJson(REGISTRY_FILE, schemaRegistry, { spaces: 2 });
    
    return versionedSchema;
  } catch (error) {
    throw new Error(`Error storing schema ${schemaId}: ${error.message}`);
  }
}

/**
 * Get the latest schema version
 * @param {string} schemaId - Schema identifier
 * @returns {Promise<Object>} - Latest schema version
 */
async function getSchemaVersion(schemaId) {
  try {
    // Check if schema exists in registry
    if (!schemaRegistry.schemas[schemaId]) {
      throw new Error(`Schema ${schemaId} not found in registry`);
    }
    
    // Get schema info from registry
    const schemaInfo = schemaRegistry.schemas[schemaId];
    
    // Load schema from file
    const schema = await fs.readJson(schemaInfo.path);
    
    return schema;
  } catch (error) {
    throw new Error(`Error getting schema version for ${schemaId}: ${error.message}`);
  }
}

/**
 * Validate data against a schema with support for warnings
 * @param {any} data - Data to validate
 * @param {Object|string} schema - JSON Schema or schema ID
 * @returns {Promise<Object>} - Validation result with errors and warnings
 */
async function validateWithWarnings(data, schema) {
  try {
    // If schema is a string, load it from registry
    let schemaObj = schema;
    if (typeof schema === 'string') {
      schemaObj = await getSchemaVersion(schema);
    }
    
    // Create a validator for this schema
    const validate = ajv.compile(schemaObj);
    
    // Validate the data
    const valid = validate(data);
    
    // Process validation errors
    const result = {
      valid,
      errors: [],
      warnings: [],
      criticalErrorCount: 0
    };
    
    if (!valid && validate.errors) {
      // Process each error
      for (const error of validate.errors) {
        // Get the property path
        const path = error.instancePath.replace(/^\//, '').replace(/\//g, '.');
        
        // Check if this property is marked as critical in the schema
        const propSchema = getPropertySchema(schemaObj, path);
        const isCritical = propSchema && propSchema.critical === true;
        
        // Create error/warning object
        const issue = {
          path,
          message: error.message,
          keyword: error.keyword,
          params: error.params
        };
        
        // Add to appropriate array
        if (isCritical) {
          result.errors.push(issue);
          result.criticalErrorCount++;
        } else {
          result.warnings.push(issue);
        }
      }
    }
    
    // Update valid status based on critical errors
    result.valid = result.criticalErrorCount === 0;
    
    return result;
  } catch (error) {
    throw new Error(`Error validating data: ${error.message}`);
  }
}

/**
 * Helper function to get schema for a specific property path
 * @param {Object} schema - JSON Schema
 * @param {string} path - Property path (dot notation)
 * @returns {Object|null} - Property schema or null if not found
 */
function getPropertySchema(schema, path) {
  if (!path) return schema;
  
  const parts = path.split('.');
  let current = schema;
  
  for (const part of parts) {
    if (part.endsWith('[]')) {
      // Array item
      const arrayProp = part.slice(0, -2);
      if (current.properties && current.properties[arrayProp] && current.properties[arrayProp].items) {
        current = current.properties[arrayProp].items;
      } else {
        current = null;
      }
    } else if (part.match(/\[\d+\]$/)) {
      // Array index
      const [arrayProp, indexStr] = part.split('[');
      const index = parseInt(indexStr.slice(0, -1));
      if (current.properties && current.properties[arrayProp] && current.properties[arrayProp].items) {
        current = current.properties[arrayProp].items;
      } else {
        current = null;
      }
    } else {
      // Regular property
      if (current.properties && current.properties[part]) {
        current = current.properties[part];
      } else {
        current = null;
      }
    }
    
    if (!current) return null;
  }
  
  return current;
}

/**
 * Validate input data before sending to AI
 * @param {string} interactionType - Type of interaction
 * @param {any} data - Data to validate
 * @returns {Promise<Object>} - Validation result
 */
async function validateInput(interactionType, data) {
  try {
    // Generate schema ID from interaction type
    const schemaId = `input.${interactionType}`;
    
    // Check if schema exists
    let schema;
    try {
      schema = await getSchemaVersion(schemaId);
    } catch (error) {
      // Schema doesn't exist, generate it
      schema = generateSchema(data, {
        id: schemaId,
        title: `Input schema for ${interactionType}`,
        description: `Automatically generated schema for ${interactionType} input`
      });
      
      // Store the schema
      await storeSchema(schema, schemaId);
    }
    
    // Validate the data
    return await validateWithWarnings(data, schema);
  } catch (error) {
    throw new Error(`Error validating input for ${interactionType}: ${error.message}`);
  }
}

/**
 * Validate output data from AI
 * @param {string} interactionType - Type of interaction
 * @param {any} data - Data to validate
 * @returns {Promise<Object>} - Validation result with raw data
 */
async function validateOutput(interactionType, data) {
  try {
    // Generate schema ID from interaction type
    const schemaId = `output.${interactionType}`;
    
    // Check if schema exists
    let schema;
    try {
      schema = await getSchemaVersion(schemaId);
    } catch (error) {
      // Schema doesn't exist, generate it
      schema = generateSchema(data, {
        id: schemaId,
        title: `Output schema for ${interactionType}`,
        description: `Automatically generated schema for ${interactionType} output`
      });
      
      // Store the schema
      await storeSchema(schema, schemaId);
    }
    
    // Validate the data
    const result = await validateWithWarnings(data, schema);
    
    // Include raw data in result
    result.rawData = data;
    
    return result;
  } catch (error) {
    throw new Error(`Error validating output for ${interactionType}: ${error.message}`);
  }
}

// Initialize on module load
initialize().catch(console.error);

module.exports = {
  generateSchema,
  storeSchema,
  getSchemaVersion,
  validateWithWarnings,
  validateInput,
  validateOutput
};
