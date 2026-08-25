import type { Request, Response, NextFunction } from "express";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();

  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown";

  const userAgent = req.headers["user-agent"] || "unknown";

  const hasToken = Boolean(req.headers.authorization);

  res.on("finish", () => {
    const responseTime = Date.now() - startTime;

    console.log({
      timestamp: new Date().toISOString(),
      method: req.method,
      endpoint: req.originalUrl,
      ip,
      userAgent,
      hasToken,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
    });
  });

  next();
}