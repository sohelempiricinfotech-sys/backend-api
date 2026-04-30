import "reflect-metadata";
import { DataSource } from "typeorm";

const dbHost = process.env.DB_HOST || "some-postgres";
const dbPort = Number(process.env.DB_PORT || 5432);
const dbUser = process.env.DB_USER || "postgres";
const dbPassword = process.env.DB_PASSWORD || "postgres";
const dbName = process.env.DB_NAME || "app";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: dbHost,
  port: dbPort,
  username: dbUser,
  password: dbPassword,
  database: dbName,
  synchronize: process.env.NODE_ENV === "development",
  logging: false,
  ssl: false,
  entities: [__dirname + "/module/**/*.model.{ts,js}"],
  migrations: [__dirname + "/migrations/**/*.{ts,js}"],
});
