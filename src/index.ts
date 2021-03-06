import express from "express";
import * as Express from "express";
import csrf from "csurf";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import expressSession from "express-session";
import dotenv from "dotenv";
import morgan from "morgan";
import fs from "fs";
import path from "path";

import applyRouter from "./route";
import { errorHandler } from "./route/error-handler";

dotenv.config();

const secret = process.env.SECRET;
if (!secret) {
  throw new Error("SECRET enviroment variable must not be empty.");
}
export function createLogger() {
  if (process.env.NODE_ENV === "production") {
    const logDirectory = path.resolve(process.env.LOG_DIR || "./log");
    if (!fs.existsSync(logDirectory)) fs.mkdirSync(logDirectory);
    const stream = fs.createWriteStream(
      path.resolve(logDirectory, "access.log"),
      { flags: "a" }
    );
    return morgan("common", { stream: stream });
  } else {
    return morgan("common");
  }
}

export function enhanceToken(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  res.header("X-XSRF-TOKEN", req.csrfToken());
  next();
}

function cors(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  res.header(
    "Access-Control-Allow-Origin",
    process.env.CORS_URLS || "http://localhost:4444"
  );
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, x-xsrf-token, Authorization"
  );
  res.header(
    "Access-Control-Expose-Headers",
    "Content-Length, X-XSRF-TOKEN, x-xsrf-token, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  next();
}
const middlewares = [
  createLogger(),
  bodyParser.json(),
  cookieParser(),
  expressSession({
    secret: secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 30
    }
  }),
  cors,
  csrf({
    cookie: false
  }),
  enhanceToken,
  errorHandler
];

const app = applyRouter(
  middlewares.reduce(
    (app: Express.Application, middleware) => app.use(middleware),
    express()
  )
);

app.get("/", (_, res) => {
  return res.send("hello");
});

app.options("*", (req, res) => {
  res.sendStatus(200);
});

app.listen(9000);
