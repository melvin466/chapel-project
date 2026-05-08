module.exports = {
  apps: [
    {
      name: 'chapel-system-backend',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080,
      },
    },
  ],
};