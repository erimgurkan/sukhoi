// Security Configuration Constants

module.exports = {
  // Regex patterns to match sensitive details in logs (mnemonics, private keys, etc.)
  SENSITIVE_PATTERNS: [
    /0x[a-fA-F0-9]{64}/g, // Private keys
    /\b(?:[a-z]{3,8}\s+){11,23}[a-z]{3,8}\b/gi, // 12-24 word seed phrases / mnemonics
  ],
  REDACT_REPLACEMENT: '[REDACTED]',
  MAX_REQUEST_SIZE: '10kb',
  HELMET_OPTIONS: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }
};
