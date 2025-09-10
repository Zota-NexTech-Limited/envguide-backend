
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes';
import * as userService from '../services/userService';
import * as mfaService from "../services/mfaService";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import transporter from '../util/nodemailer'
import { getLocalIP } from '../server';
import { getModuleSetting } from './heplerController';
import speakeasy from "speakeasy";
import QRCode from "qrcode";

dotenv.config();
export async function signup(req: any, res: any) {
    try {
        const adminObj = {
            user_id: ulid(),
            user_name: req.body.user_name,
            user_role: req.body.user_role,
            user_email: req.body.user_email,
            user_password: req.body.user_password,
            user_phone_number: req.body.user_phone_number,
            user_department: req.body.user_department,
            user_role_id: req.body.user_role_id,
            change_password_next_login: req.body.change_password_next_login,
            password_never_expires: req.body.password_never_expires
        }
        const findUser = await userService.finduser(adminObj.user_email)
        if (findUser.rows.length === 0) {
            console.log(findUser.rows.length)
            const saltRounds = 10;
            console.log(saltRounds,)
            bcrypt.genSalt(saltRounds, function (err, salt) {
                bcrypt.hash(adminObj.user_password, salt, async function (err, hash) {
                    // Store hash in your password DB.
                    if (err) {
                        console.log('Unable to create new user')
                        console.log(err)
                        res.json({ message: 'Unable to create new user' })
                    }
                    if (hash) {
                        adminObj.user_password = hash
                        console.log(adminObj)

                        const adduser = await userService.addUser(adminObj)
                        if (adduser.rows.length > 0) {
                            return res.status(200).send(
                                generateResponse(true, "user created successfully", 200, null)
                            );
                        } else {
                            return res.status(400).send(
                                generateResponse(false, "user create unsuccessful", 400, null)
                            );
                        }
                    }
                });
            });

        } else {
            return res.status(400).send(
                generateResponse(false, `user already exists with ${adminObj.user_email} `, 400, null)
            );
        }
    } catch (error: any) {
        console.log(error, "error");
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}

function generateAccessToken(data: any) {
    console.log(data, "data")
    const TOKEN_SECRET: string = process.env.TOKEN_SECRET ?? 'defaultSecret';

    console.log(TOKEN_SECRET)
    if (TOKEN_SECRET) {
        console.log()
        return jwt.sign(data, TOKEN_SECRET);
    }
}

export async function login(req: any, res: any) {
    const { user_email, password } = req.body;
    console.log(password);
    const findUser = await userService.findUserByMultiple(user_email)

    const localIP = getLocalIP();

    const is_auto_batch = await getModuleSetting()
    if (findUser.rows.length > 0) {
        const user_password = findUser.rows[0].user_password
        console.log(user_password)
        const passwordMatch = await bcrypt.compare(password, user_password);

        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: "Wrong password" });
        }

        // Check if MFA secret already exists
        const existingSecret = await mfaService.getSecretByUserId(findUser.rows[0].user_id);
        let secretBase32 = "";
        let qrCodeUrl: string | null = null;

        if (!existingSecret) {
            // Generate new MFA secret
            const secret = speakeasy.generateSecret({
                name: `MyApp (${user_email})`,
            });

            if (!secret.otpauth_url) {
                return res.status(500).json({ success: false, message: "Failed to generate OTP URL" });
            }

            // Save secret in DB
            await mfaService.saveMFASecret({
                user_id: findUser.rows[0].user_id,
                user_email,
                mfa_secret: secret.base32
            });

            secretBase32 = secret.base32;
            qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        } else {
            // If already exists, just send manual code (optional)
            secretBase32 = existingSecret.mfa_secret;
        }

        const localIP = getLocalIP();
        const is_auto_batch = await getModuleSetting();

        return res.status(200).json({
            success: true,
            message: "MFA setup initiated. Scan QR or use manual code.",
            qrCode: qrCodeUrl || null,
            manualCode: secretBase32,
            localIP,
            is_auto_batch
        });

    } else {
        return res.status(404).json({ success: false, message: 'user not found' })
    }

}

export async function verifyMFA(req: any, res: any) {
    const { user_email, token } = req.body;

    const findUser = await userService.findUserByMultiple(user_email);
    if (findUser.rows.length === 0) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const mfaData = await mfaService.getSecretByUserId(findUser.rows[0].user_id);
    if (!mfaData) {
        return res.status(400).json({ success: false, message: "MFA not setup" });
    }

    const isValid = speakeasy.totp.verify({
        secret: mfaData.mfa_secret,
        encoding: "base32",
        token,
        window: 1
    });

    if (!isValid) {
        return res.status(401).json({ success: false, message: "Invalid or expired MFA code" });
    }

    // Issue final JWT after MFA success
    const jwttoken = generateAccessToken({
        email: findUser.rows[0].user_email,
        role: findUser.rows[0].user_role
    });

    return res.status(200).send(
        generateResponse(true, "MFA verified successfully", 200, {
            token: jwttoken,
            user_id: findUser.rows[0].user_id,
            user_name: findUser.rows[0].user_name,
            user_role: findUser.rows[0].user_role,
            user_email: findUser.rows[0].user_email,
            user_phone_number: findUser.rows[0].user_phone_number,
            user_department: findUser.rows[0].user_department
        }),

    )

    // return res.status(200).json({
    //     success: true,
    //     message: "MFA verified successfully",
    //     token: jwttoken
    // });
}

export async function createRole(req: any, res: any) {
    try {

        const roleData = req.body
        roleData.role_id = ulid();

        const createRoleData = await userService.createRole(roleData)
        console.log(createRoleData.rows)
        if (createRoleData.rows.length > 0) {
            return res.status(200).send(
                generateResponse(true, "role added successfully", 200, createRoleData.rows)
            );
        } else {
            return res.status(400).send(
                generateResponse(false, "role adding unsuccessful", 400, null)
            );
        }

    } catch (error: any) {
        console.log(error, "error");
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}

export async function getRoles(req: any, res: any) {
    try {

        const getRole = await userService.getRole()

        if (getRole.rows.length > 0) {
            return res.status(200).send(
                generateResponse(true, "role fetched successfully", 200, getRole.rows)
            );
        } else {
            return res.status(400).send(
                generateResponse(false, "role fetching unsuccessful", 400, null)
            );
        }

    } catch (error: any) {
        console.log(error, "error");
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}

export async function createDepartment(req: any, res: any) {
    try {

        const departmentData = req.body


        departmentData.department_id = ulid();


        const createDepartment = await userService.createDepartment(departmentData)

        if (createDepartment.rows.length > 0) {
            return res.status(200).send(
                generateResponse(true, "deparment added successfully", 200, createDepartment.rows[0])
            );
        } else {
            return res.status(400).send(
                generateResponse(false, "deparment adding unsuccessful", 400, null)
            );
        }

    } catch (error: any) {
        console.log(error, "error");
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}

export async function getDeparmment(req: any, res: any) {
    try {

        const getDeparmment = await userService.getDepartment()

        if (getDeparmment.rows.length > 0) {
            return res.status(200).send(
                generateResponse(true, "deparment fetched successfully", 200, getDeparmment.rows)
            );
        } else {
            return res.status(400).send(
                generateResponse(false, "deparment fetching unsuccessful", 400, null)
            );
        }

    } catch (error: any) {
        console.log(error, "error");
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}

export async function addUserPermission(req: any, res: any) {

    try {

        const permissionData = req.body
        permissionData.permission_id = ulid()
        const addPermissionData = await userService.addUserPermission(permissionData)
        if (addPermissionData.rows.length > 0) {
            return res.status(200).send(
                generateResponse(true, "permission updated succesfully", 200, addPermissionData.rows)
            )
        } else {
            return res.status(400).send(
                generateResponse(true, "permission update unsuccesfully", 400, null)
            )
        }
    }
    catch (error: any) {
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}

export async function updatePermission(req: any, res: any) {

    try {

        const permissionData = req.body
        var updatePermissionData = []
        for (let permission of permissionData) {

            let result = await userService.updatePermission(permission)
            if (result.rows.length > 0) {
                updatePermissionData.push(result.rows)
            }
        }
        if (updatePermissionData.length > 0) {
            return res.status(200).send(
                generateResponse(true, "permission updated succesfully", 200, updatePermissionData)
            )
        } else {
            return res.status(400).send(
                generateResponse(false, "permission update unsuccesfully", 400, null)
            )
        }
    }
    catch (error: any) {
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}

export async function getPermission(req: any, res: any) {

    try {


        const getPermission = await userService.getPermission(req.user_id)
        if (getPermission.rows.length > 0) {


            return res.status(200).send(
                generateResponse(true, "permission fetched succesfully", 200, getPermission.rows)
            )
        } else {
            return res.status(400).send(
                generateResponse(true, "permission fetching unsuccesfull", 400, null)
            )
        }
    }
    catch (error: any) {
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}


export async function getUserPermissionById(req: any, res: any) {
    try {
        const getPermission = await userService.getUserModulePermission(req.query);
        if (getPermission.rows.length > 0) {
            let permissions = getPermission.rows;

            // Group permissions by main module name
            const groupedPermissions: any = {};
            permissions.forEach(permission => {
                const mainModuleName = permission.main_module_name;
                if (!groupedPermissions[mainModuleName]) {
                    groupedPermissions[mainModuleName] = [];
                }
                groupedPermissions[mainModuleName].push(permission);
            });

            // Construct the response array
            const response = [];
            const settingItems = [];

            for (const mainModuleName in groupedPermissions) {
                const permissionsForModule = groupedPermissions[mainModuleName];

                if (mainModuleName.endsWith("setting")) {
                    // Add to settingItems if mainModuleName ends with 'setting'
                    const hasItems = permissionsForModule.map((permission: any) => ({
                        ...permission,
                        main_module_name: undefined,
                        main_module_id: undefined,
                        parent_main_module_id: undefined
                    }));

                    settingItems.push({
                        module_name: mainModuleName,
                        hasItems
                    });
                } else if (permissionsForModule.length === 1 && !permissionsForModule[0].module_name.includes('_')) {
                    // If there's only one item and it's not part of a nested structure, add it directly
                    response.push({
                        module: mainModuleName,
                        ...permissionsForModule[0]
                    });
                } else {
                    // Create a nested structure
                    const hasItems = permissionsForModule.map((permission: any) => ({
                        ...permission,
                        main_module_name: undefined,
                        main_module_id: undefined,
                        parent_main_module_id: undefined
                    }));

                    response.push({
                        module_name: mainModuleName,
                        hasItems
                    });
                }
            }

            // Add settingItems under a single settings module
            if (settingItems.length > 0) {
                response.push({
                    module_name: "settings",
                    hasItems: settingItems
                });
            }

            response.sort((a: any, b: any) => {
                const nameA = a.module_name || a.module || '';
                const nameB = b.module_name || b.module || '';
                return nameA.localeCompare(nameB);
            });

            return res.status(200).send(
                generateResponse(true, "permission fetched successfully", 200, response)
            );
        } else {
            return res.status(400).send(
                generateResponse(false, "permission fetching unsuccessful", 400, null)
            );
        }
    } catch (error: any) {
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}



export async function getAllUser(req: any, res: any) {

    try {

        const getAllUser = await userService.getAllUser(req.query)
        if (getAllUser) {
            return res.status(200).send(
                generateResponse(true, "users fetched succesfully", 200, {
                    totalCount: getAllUser.totalRowsCount,
                    userList: getAllUser.userList
                })
            )
        } else {
            return res.status(400).send(
                generateResponse(false, "user fetching unsuccesfull", 400, null)
            )
        }
    }
    catch (error: any) {
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}

export async function getUserById(req: any, res: any) {

    try {
        const { user_id } = req.query
        if (user_id) {
            const getUser = await userService.getUserById(user_id)
            if (getUser.rows.length > 0) {
                return res.status(200).send(
                    generateResponse(true, "user fetched succesfully ", 200, getUser.rows))
            } else {
                return res.status(400).send(
                    generateResponse(false, "user not found", 400, null))
            }
        }
    }
    catch (error: any) {
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}

export async function updateUser(req: any, res: any) {
    try {
        const userObj = req.body;

        const findUser = await userService.getUserById(userObj.user_id)

        const user_password = findUser.rows[0].user_password;
        console.log(user_password)

        if (userObj.old_user_password) {
            const isPasswordMatch = await bcrypt.compare(userObj.old_user_password, user_password);
            console.log(isPasswordMatch)
            if (isPasswordMatch) {
                if (userObj.new_user_password) {
                    const saltRounds = 10;
                    const hash = await bcrypt.hash(userObj.new_user_password, saltRounds);
                    userObj.user_password = hash;
                    delete userObj.old_user_password;
                    delete userObj.new_user_password;
                }
            } else {


                return res.status(401).send(
                    generateResponse(false, "wrong old password", 401, null)
                );
            }
        }

        const updateuser = await userService.updateUser(userObj.user_id, userObj);

        if (updateuser.rows.length > 0) {
            return res.status(200).send(
                generateResponse(true, "user updated successfully", 200, null)
            );
        } else {
            return res.status(400).send(
                generateResponse(false, "user update unsuccessful", 400, null)
            );
        }
    }
    catch (error: any) {
        console.log(error)
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}


export async function getAllUserWithoutPagination(req: any, res: any) {

    try {

        const getAllUser = await userService.getAllUserWithoutPagination(req.query)

        if (getAllUser) {
            return res.status(200).send(
                generateResponse(true, "users fetched succesfully", 200, {
                    userList: getAllUser
                })
            )
        } else {
            return res.status(400).send(
                generateResponse(false, "user fetching unsuccesfull", 400, null)
            )
        }
    }
    catch (error: any) {
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}


export async function addModule(req: any, res: any) {

    try {
        const moduleBody = req.body
        moduleBody.module_id = ulid();
        const addModule = await userService.addModule(moduleBody)
        if (addModule) {
            return res.status(200).send(
                generateResponse(true, "module added succesfully", 200, addModule.rows)
            )
        } else {
            return res.status(400).send(
                generateResponse(false, "module module unsuccesfull", 400, null)
            )
        }
    }
    catch (error: any) {
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}

export async function getModule(req: any, res: any) {

    try {

        const getModule = await userService.getModule()
        if (getModule.rows.length > 0) {
            return res.status(200).send(
                generateResponse(true, "module fetched succesfully", 200, getModule.rows)
            )
        } else {
            return res.status(400).send(
                generateResponse(false, "module fetching unsuccesfull", 400, null)
            )
        }
    }
    catch (error: any) {
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}

export async function addMainModule(req: any, res: any) {

    try {
        const moduleBody = req.body
        moduleBody.main_module_id = ulid();
        const addModule = await userService.addMainModule(moduleBody)
        if (addModule) {
            return res.status(200).send(
                generateResponse(true, "module added succesfully", 200, addModule.rows)
            )
        } else {
            return res.status(400).send(
                generateResponse(false, "module module unsuccesfull", 400, null)
            )
        }
    }
    catch (error: any) {
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}

export async function addUpdateUpdateModule(req: any, res: any) {

    try {

        const subModuleData = req.body


        let result = await userService.addUpdateUpdateModule(subModuleData)


        if (result.rows[0].length > 0) {
            return res.status(200).send(
                generateResponse(true, "module updated succesfully", 200, result.rows[0])
            )
        } else {
            return res.status(400).send(
                generateResponse(false, "permission update unsuccesfully", 400, null)
            )
        }
    }
    catch (error: any) {
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}

export async function forgotPassword(req: any, res: any) {
    try {

        const findUser = await userService.finduser(req.body.user_email)
        if (findUser.rows.length === 0) {
            return res.status(400).send(generateResponse(false, 'User with this email does not exist', 400, null));
        }
        const token = generateAccessToken({ user_email: findUser.rows[0].user_email });
        const resetLink = `https://dev.zotanextech.com/reset-password?token=${token}`;
        const mailOptions = {
            to: findUser.rows[0].user_email,
            from: 'info@zotanextech.com',
            subject: 'Password Reset',
            text: `Please use the following reset to reset your password: ${resetLink}`,
        };

        console.log(mailOptions)

        transporter.sendMail(mailOptions, (err, response) => {
            if (err) {
                console.error('Error sending email:', err);
                return res.status(500).send(generateResponse(false, 'Error sending email', 400, null));
            }
            res.status(200).send(generateResponse(true, 'Password reset email sent successfully', 200, null));
        });

    } catch (error: any) {

        console.error('Error:', error);
        return res.status(400).send(generateResponse(false, error.message, 400, null));


    }
}

export async function resetPassword(req: any, res: any) {
    try {
        const token = req.body.token

        const TOKEN_SECRET: string = process.env.TOKEN_SECRET ?? 'defaultSecret';

        console.log(TOKEN_SECRET)
        if (TOKEN_SECRET) {
            const user: any = jwt.verify(token, TOKEN_SECRET);
            console.log(user, "admindataaa")


            const findUser = await userService.finduser(user.user_email)
            if (findUser.rows.length === 0) {
                return res.status(400).send(generateResponse(false, 'User with this email does not exist', 400, null));
            }
            const updateObj = {
                user_password: req.body.user_password,
            }

            const saltRounds = 10;
            console.log(saltRounds,)
            bcrypt.genSalt(saltRounds, function (err, salt) {
                bcrypt.hash(updateObj.user_password, salt, async function (err, hash) {
                    // Store hash in your password DB.
                    if (err) {
                        console.log('Unable to create new user')
                        console.log(err)
                        res.json({ message: 'Unable to create new user' })
                    }
                    if (hash) {
                        updateObj.user_password = hash


                        const updateuser = await userService.updateUser(findUser.rows[0].user_id, updateObj)
                        if (updateuser.rows.length > 0) {
                            return res.status(200).send(
                                generateResponse(true, "user password reset successfully", 200, null)
                            );
                        } else {
                            return res.status(400).send(
                                generateResponse(false, "user password reset unsuccessful", 400, null)
                            );
                        }
                    }
                });
            })
        } else {
            return res.status(400).send(generateResponse(false, "something went wrong", 400, null));
        }
    } catch (error: any) {

        console.error('Error:', error);
        return res.status(400).send(generateResponse(false, error.message, 400, null));


    }
}

export async function asyncUserAuth(data: any) {
    try {
        const groupedPermissions = data.reduce((acc: any, curr: any) => {
            const { user_id, user_name, user_role_id, user_role, user_email, user_password, user_phone_number, user_department, change_password_next_login,
                password_never_expires, password_expiry_date, update_date, created_date, data_synced, permission_id, module_name, ...permissions } = curr;


            // Check if user_id already exists in accumulator
            if (!acc[user_id]) {
                // Initialize new entry for the user
                acc[user_id] = {
                    user_id,
                    user_name,
                    user_role_id,
                    user_role,
                    user_email,
                    user_password,
                    user_phone_number,
                    user_department,
                    change_password_next_login,
                    password_never_expires,
                    password_expiry_date,
                    permissions: [],
                };
            }

            // Add permission if not already included
            const existingPermission = acc[user_id].permissions.find((p: { permission_id: any; }) => p.permission_id === permission_id);
            if (!existingPermission) {
                acc[user_id].permissions.push({
                    user_id,
                    permission_id,
                    module_name,
                    ...permissions,
                });
            }

            return acc;
        }, {});

        // Convert to an array if needed
        const result = Object.values(groupedPermissions);

        console.log(result)

        const userSync = await userService.userSync(result)


    } catch (error: any) {

    }
}





export async function createDocumentType(req: any, res: any) {
    try {

        const documentData = req.body


        const createDocumentData = await userService.createDocumentType(documentData)

        if (createDocumentData.rows.length > 0) {
            return res.status(200).send(
                generateResponse(true, "document type added successfully", 200, createDocumentData.rows)
            );
        } else {
            return res.status(400).send(
                generateResponse(false, "role adding unsuccessful", 400, null)
            );
        }

    } catch (error: any) {
        console.log(error, "error");
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}

export async function getDocumentType(req: any, res: any) {
    try {

        const getDocumentDropDown = await userService.getDocumentDropDown()

        if (getDocumentDropDown.rows.length > 0) {
            return res.status(200).send(
                generateResponse(true, "document type fetched successfully", 200, getDocumentDropDown.rows)
            );
        } else {
            return res.status(400).send(
                generateResponse(false, "document type fetching unsuccessful", 400, null)
            );
        }

    } catch (error: any) {
        console.log(error, "error");
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
}








