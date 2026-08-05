module.exports = {
    apps: [{
      name: "TWILIO WHATSAPP TEST",
      script: "tsx",
      args: "start",
      cwd: "/home/userhseq/apps/grupohseq/twilio-test",
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
  