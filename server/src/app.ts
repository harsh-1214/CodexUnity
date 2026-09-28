import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import { ApiError } from "./utils/apiError";
import userRoute from "./routes/user.routes";
import codeRoute from "./routes/code.routes";
import roomRoute from "./routes/room.routes";
import { rateLimit } from "express-rate-limit";
require("./workers/jobWorker_piston");
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

// Define the rate limiter middleware
const limiter = rateLimit({
  windowMs: 10 * 1000,
  max: 1,
  message: "Too many requests from this IP, please try again later.",
});

app.use("/api/v1/code/execute", limiter);
app.get("/api/v1/", (req: Request, res: Response) => {
  res.send("Hello");
});
app.use("/api/v1/user", userRoute);
app.use("/api/v1/code", codeRoute);
app.use("/api/v1/room", roomRoute);

// Unhandled Routes:
app.all("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server`,
  });
});

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // Handle unexpected errors
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};

app.use(globalErrorHandler);

export { app };
