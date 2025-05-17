#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Path to the example config and the target config
const examplePath = path.resolve(__dirname, 'src/lib/services/gocardless/config.example.json');
const configPath = path.resolve(__dirname, 'src/lib/services/gocardless/config.json');

console.log('\n🏦 GoCardless Configuration Setup 🏦\n');

// Check if config.json already exists
if (fs.existsSync(configPath)) {
  console.log('⚠️  A configuration file already exists at:', configPath);
  rl.question('Do you want to overwrite it? (y/N): ', (answer) => {
    if (answer.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
    createConfig();
  });
} else {
  createConfig();
}

function createConfig() {
  // Read the example config file
  try {
    const exampleConfig = JSON.parse(fs.readFileSync(examplePath, 'utf8'));
    
    rl.question('Enter your GoCardless Secret ID: ', (secretId) => {
      rl.question('Enter your GoCardless Secret Key: ', (secretKey) => {
        // Create a new config with the provided credentials
        const newConfig = {
          ...exampleConfig,
          secretId: secretId || exampleConfig.secretId,
          secretKey: secretKey || exampleConfig.secretKey
        };
        
        // Remove the note
        delete newConfig['// NOTE'];
        
        // Save the new config file
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
        
        console.log('\n✅ GoCardless configuration has been created at:', configPath);
        console.log('⚠️  Keep this file secure as it contains sensitive credentials.');
        console.log('\nYou can now start the application with:');
        console.log('  cd packages/minimal-ui-next && yarn start:all\n');
        
        rl.close();
      });
    });
  } catch (error) {
    console.error('❌ Error reading example config:', error);
    rl.close();
  }
} 