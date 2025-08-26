import { Router } from 'express';
import * as userController from '../../controller/userController';
import * as  authService from '../../middleware/authService'
const userRoutes = Router();

userRoutes.post('/api/user/create', userController.signup)

userRoutes.post('/api/user/login', userController.login)

userRoutes.post('/api/user/verify', userController.verifyMFA)

userRoutes.post('/api/create/role', userController.createRole)

userRoutes.post('/api/create/department', userController.createDepartment)

userRoutes.get('/api/roles/get', userController.getRoles)

userRoutes.get('/api/department/get', userController.getDeparmment)

userRoutes.get('/api/user/getAll', userController.getAllUser)

userRoutes.get('/api/user/getById', userController.getUserById)

userRoutes.post('/api/user/update', userController.updateUser)

userRoutes.post('/api/user/permission/add', authService.authenticate, userController.addUserPermission)

userRoutes.post('/api/user/permission/update', authService.authenticate, userController.updatePermission)

userRoutes.get('/api/user/permission/get', authService.authenticate, userController.getPermission)

userRoutes.get('/api/user/permission/getById', userController.getUserPermissionById)

userRoutes.get('/api/user/getUsers', userController.getAllUserWithoutPagination)

userRoutes.post('/api/submodule/add', userController.addModule)

userRoutes.get('/api/submodule/get', userController.getModule)

userRoutes.post('/api/submodule/update', userController.addUpdateUpdateModule)

userRoutes.post('/api/main/module/add', userController.addMainModule)

userRoutes.post('/api/user/forgot/password', userController.forgotPassword)

userRoutes.post('/api/user/reset/password', userController.resetPassword)

userRoutes.post('/api/create/documentType', userController.createDocumentType)

userRoutes.get('/api/get/documentType', userController.getDocumentType)


userRoutes.post("/api/user/download-mfa-qr", async (req, res) => {
    try {
        const { qrCode } = req.body;

        if (!qrCode || !qrCode.startsWith("data:image/png;base64,")) {
            return res.status(400).json({ success: false, message: "Invalid QR code format" });
        }

        // Remove the prefix "data:image/png;base64,"
        const base64Data = qrCode.replace(/^data:image\/png;base64,/, "");

        // Convert base64 to Buffer
        const imgBuffer = Buffer.from(base64Data, "base64");

        // Set correct content type and send as a file
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Content-Disposition", "attachment; filename=qr-code.png");
        res.send(imgBuffer);

    } catch (error) {
        console.error("Error generating QR PNG:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
export default userRoutes;