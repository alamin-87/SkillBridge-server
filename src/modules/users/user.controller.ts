import catchAsync from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { UserService } from "./user.service";

// GET BY ID
const getById = catchAsync(async (req: any, res) => {
  const result = await UserService.getById(req.params.id);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

// UPDATE
const updateUser = catchAsync(async (req: any, res) => {
  const result = await UserService.updateUser(
    req.user.userId,
    req.body,
    req.files?.profilePhoto?.[0] // 👈 file comes from multer .fields()
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

// DELETE
const deleteUser = catchAsync(async (req: any, res) => {
  const result = await UserService.deleteUser(
    req.user.userId
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

export const UserController = {
  getById,
  updateUser,
  deleteUser,
};