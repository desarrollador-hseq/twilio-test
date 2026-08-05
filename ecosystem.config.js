module.exports = {
    apps: [{
      name: "TWILIO WHATSAPP TEST",
      script: "tsx",
      args: "start",
      cwd: "/home/userhseq/apps/grupohseq/test.grupohseq.com",
      env: {
        NODE_ENV: "production",
        PORT: 3030
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: true,
      max_memory_restart: "1G"
    }]
  };
  