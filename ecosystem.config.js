module.exports = {
  apps: [
    {
      name: 'auditoria-conectamente',
      script: 'node_modules/.bin/next',
      args: 'start -p 3100',
      cwd: __dirname,
      env: { NODE_ENV: 'production' },
    },
  ],
}
