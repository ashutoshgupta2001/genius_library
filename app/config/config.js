
import dotenv from "dotenv";
import convict from "convict";

dotenv.config();

const config = convict({
  port: {
    doc: "Internal backend server port",
    format: "port",
    default: 3000,
    env: "PORT",
  },
  env: {
    doc: "Application environment",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV",
  },
  postgres: {
      readWriteUri: {
        doc: "PostgreSQL read-write connection URI",
        format: String,
        default: "postgresql://ashutosh:ashutosh123@localhost:5432/genius_library",
        env: "POSTGRES_GENIUS_LIBRARY_READ_WRITE",
      },
  },
  auth: {
    jwtSecret: {
      doc: "JWT secret for signing tokens",
      format: String,
      default: "",
      env: "GENIUS_LIBRARY_JWT_SECRET",
      sensitive: true,
    },
    jwtExpiresIn: {
      doc: "JWT expires in",
      format: String,
      default: "2h",
      env: "GENIUS_LIBRARY_JWT_EXPIRES_IN",
    },
  },
  redis: {
    host: {
      doc: "Redis host",
      format: String,
      default: "localhost",
      env: "GENIUS_LIBRARY_REDIS_HOST",
    },
    port: {
      doc: "Redis port",
      format: Number,
      default: 6379,
      env: "GENIUS_LIBRARY_REDIS_PORT",
    },
  },
});

config.validate({ allowed: "strict" });

Object.assign(config, config.getProperties());

export default config;

