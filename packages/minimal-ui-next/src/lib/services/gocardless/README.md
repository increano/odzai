# GoCardless Integration Setup

This directory contains the files needed for GoCardless bank synchronization integration.

## Configuration

1. Copy the example configuration file to create your own config:
   ```bash
   cp config.example.json config.json
   ```

2. Edit `config.json` with your GoCardless credentials:
   - `secretId`: Your GoCardless Secret ID
   - `secretKey`: Your GoCardless Secret Key
   - Adjust other settings as needed

## Getting GoCardless Credentials

1. Create an account with GoCardless at https://bankaccountdata.gocardless.com/overview/
2. Log into your account dashboard
3. Select **Developers->User secrets** from the left side menu
4. Click on the '+ create new' button
5. Download the secrets file when prompted (contains your secret key)
6. Enter the secretId and secretKey from this file into your config.json

## Security Notes

- The `config.json` file is excluded from Git to prevent committing sensitive credentials
- For production environments, consider using environment variables instead of config files
- Your GoCardless credentials grant access to bank data, so keep them secure!

## Usage

The GoCardless integration provides the following functionality:
- Bank account discovery by country
- Account linking to Actual Budget accounts
- Transaction synchronization
- Automatic balance updates

See the documentation in `docs/Current focus/` for more details on the implementation. 