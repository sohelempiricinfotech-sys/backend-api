import { ZodType } from "zod";

import { Request, Response, NextFunction } from "express";

export const zValidate =
  (schema: ZodType) =>
    (req: Request, res: Response, next: NextFunction) => {
      try {
        req.body = schema.parse(req.body);
        next();
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          errors: JSON.parse(error.message),
        });
      }
    };
