
import type { Request, Response } from "express";
import { UserService } from "./user.service";

export const UserController = {
  get: async (req: Request, res: Response) => {
    const data = await UserService.getUser(req.user!.id);
    res.json({ success: true, data });
  },

  update: async (req: Request, res: Response) => {
    const data = await UserService.updateUser(req.user!.id, req.body);
    res.json({ success: true, message: "User updated", data });
  },
};
