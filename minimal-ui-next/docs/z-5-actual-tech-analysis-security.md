# Actual Budget - Security & Privacy Analysis

## Core Security Philosophy

Actual Budget is designed with privacy and security as foundational principles. The local-first architecture inherently provides strong privacy guarantees since financial data remains under the user's control rather than being stored on remote servers by default.

## Current Data Security Measures

### Local Storage

- **File System Security**: On desktop platforms, the SQLite database is stored in the user's profile or a user-chosen location, inheriting operating system file permissions
- **No Default Encryption**: The local database does not have built-in encryption, though users can store budget files on encrypted drives for protection
- **Application Access**: No password is required to open the app by default, though this could be added as a feature

### Synchronization Security

When using the optional sync server, Actual implements several protective measures:

- **End-to-End Encryption**: Data synchronized to the server is encrypted with a user-provided key
- **Server-Side Protection**: The sync server cannot read budget contents when encryption is enabled
- **Change-Based Sync**: Only budget changes (deltas) are transmitted, not the entire database
- **Authentication**: The Actual Server requires a password to prevent unauthorized access
- **Backup Security**: Backups stored on the server inherit the same encryption as sync data

### Authentication Model

- **Server Password**: Required for connecting to the sync server
- **Encryption Password**: Optional but recommended for securing synced data
- **No Account System**: No traditional username/password accounts since the app is primarily local

## Operational Security

### Code Security

- **Open Source Advantage**: Being open-source allows community auditing of code for vulnerabilities
- **Local Execution**: Most security risks associated with server-side operations are eliminated
- **Limited Attack Surface**: No multi-tenant server reduces risks like SQL injection or cross-site attacks

### External Data Handling

- **Import Validation**: The app validates imported data, though there's always some risk with untrusted sources
- **No Automatic Imports**: Manual user interaction required for most data imports, reducing automated attack vectors
- **Limited Internet Access**: Core functionality works without internet connection, limiting exposure

## Plugin Security Considerations

The introduction of a plugin system would require careful security design:

### Plugin Isolation

- **Sandboxing**: Plugins should run in isolated environments like Web Workers or separate processes
- **Context Isolation**: Plugins should not have direct access to Node.js APIs or DOM manipulation
- **Message Passing**: Communication between plugins and core should occur through controlled channels

### Permission System

- **Granular Permissions**: Plugins should declare required capabilities (read data, write data, internet access)
- **User Approval**: Explicit user consent required for each permission type
- **Visual Indicators**: The UI should indicate when plugins are performing sensitive operations

### Data Access Control

- **Limited API Access**: Plugins should receive restricted API objects based on approved permissions
- **Read-Only Mode**: Many plugins could function with read-only access to budget data
- **Audit Logging**: Plugin actions could be logged for transparency and troubleshooting

### Sensitive Information Protection

- **Credential Storage**: Secure storage for plugin credentials (like bank API tokens)
- **System Keychain Integration**: Use of OS-level secure storage for sensitive information
- **Plugin Data Encryption**: Encryption of plugin-specific data using the same mechanisms as core data

## Security Implementation Recommendations

### For Core Application

- **Optional Database Encryption**: Implement SQLCipher to encrypt the local database (similar to YNAB)
- **Application Lock**: Add optional passcode/biometric lock for application access
- **Enhanced Backup Security**: Automatic encrypted backups to prevent data loss

### For Plugin System

- **Sandboxed Plugin Execution**: Use proven isolation techniques like Electron's context isolation
- **Permission Prompts**: Implement mobile OS-style permission requests for sensitive operations
- **Plugin Signing**: Code signing for marketplace plugins to prevent tampering
- **Resource Limitations**: Constraints on CPU, memory, and network usage for plugins

### For Sync Server

- **Required Encryption**: Make end-to-end encryption mandatory rather than optional
- **Transport Security**: Ensure TLS for all communications with sync server
- **Rate Limiting**: Prevent brute force attacks on server authentication
- **Server Hardening**: Standard security practices for server deployment

## Privacy Considerations

### Data Collection Policy

- **Minimal Telemetry**: No collection of financial data for analysis
- **Local Analytics**: Usage statistics processed locally rather than sent to servers
- **Opt-In Reporting**: Any crash reports or usage data should be strictly opt-in

### Third-Party Integration Privacy

- **Explicit Consent**: Clear disclosure when data might leave the local environment
- **Data Minimization**: Only necessary information sent to external services
- **Transparency**: Plugin marketplace should indicate privacy implications of each plugin

### User Control

- **Data Export**: Easy export of all user data in standard formats
- **Complete Deletion**: Ability to fully delete data from sync servers
- **Privacy Settings**: Granular controls for any optional data sharing

## Security Monitoring and Response

### For Official Application

- **Security Audits**: Regular code reviews focused on security
- **Vulnerability Disclosure**: Clear process for reporting security issues
- **Rapid Patching**: Quick release cycle for security fixes

### For Plugin Ecosystem

- **Community Reporting**: Mechanism for users to flag suspicious plugins
- **Automated Scanning**: Static analysis of plugin code for potential risks
- **Emergency Disablement**: Ability to remotely disable malicious plugins

## Threat Model

### Primary Security Threats

- **Local Device Compromise**: Physical access to user's device
- **Malicious Plugins**: Third-party code with harmful intent
- **Sync Server Breach**: Unauthorized access to the synchronization server
- **Man-in-the-Middle**: Interception of data during synchronization

### Risk Mitigation

- **Local Security**: Rely on device encryption and authentication
- **Plugin Vetting**: Carefully review plugins, especially those with sensitive permissions
- **Sync Encryption**: End-to-end encryption protects against server compromise
- **Transport Security**: TLS protects against network interception

## Privacy vs. Functionality Balance

- **Default to Privacy**: Features that might compromise privacy should be opt-in
- **Local Processing**: Prefer on-device processing over remote services
- **Transparent Tradeoffs**: Clear communication when features require privacy compromises

## Conclusion

Actual Budget's local-first architecture provides inherent privacy advantages compared to cloud-based financial applications. The primary security focus should be on:

1. **Protecting local data** through optional encryption and access controls
2. **Securing the sync mechanism** with robust end-to-end encryption
3. **Safely enabling plugins** through sandboxing and permissions
4. **Maintaining transparency** about data handling practices

By implementing these security measures, Actual can provide a flexible, extensible financial platform while respecting user privacy and maintaining strong data protection. The challenge lies in balancing robust security with ease of use and the flexibility desired for a plugin ecosystem.

As the application evolves, continuous security review will be essential, particularly as new capabilities like plugins are introduced. The open-source nature of the project allows for community involvement in security improvements, but also requires diligent oversight of contributed code. 