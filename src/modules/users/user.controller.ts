import type { Request, Response } from "express";
import { UserService } from "./user.service";

export const UserController = {
  get: async (req: Request, res: Response) => {
    const data = await UserService.getUser(req.user!.id);
    res.json({ success: true, data });
  },
  getById: async (req: Request, res: Response) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const data = await UserService.getUserById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({ success: true, data });
  },
  update: async (req: Request, res: Response) => {
    const data = await UserService.updateUser(req.user!.id, req.body);
    res.json({ success: true, message: "User updated", data });
  },
};
