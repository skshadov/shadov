// PM2 process config — запускает Nitro Node-сервер (.output/server/index.mjs)
module.exports = {
  apps: [
    {
      name: "shadov",
      script: ".output/server/index.mjs",
      cwd: "/var/www/shadov",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "800M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOST: "127.0.0.1",
      },
      env_file: "/var/www/shadov/.env.production",
      out_file: "/var/log/shadov/out.log",
      error_file: "/var/log/shadov/err.log",
      time: true,
    },
  ],
};