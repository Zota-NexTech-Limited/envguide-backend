import jwt from 'jsonwebtoken';
import * as authService from '../services/userService.js'
import { generateResponse } from '../util/genRes.js';
import * as dotenv from 'dotenv';
dotenv.config();
export async function authenticate(req: any, res: any, next: any) {

    try {
        let token = req.header('authorization');

        // Strip "Bearer " prefix if present
        if (token && token.startsWith('Bearer ')) {
            token = token.substring(7); // Remove "Bearer " prefix
        }

        const TOKEN_SECRET: string = process.env.TOKEN_SECRET ?? 'defaultSecret';

        if (TOKEN_SECRET && token) {
            const user: any = jwt.verify(token, TOKEN_SECRET);

            const findUser = await authService.finduser(user.email)
            if (findUser.rows.length > 0) {
                req.user_id = findUser.rows[0].user_id
                req.role_id = findUser.rows[0].user_role_id
                // req.store_id = findUser.rows[0].user_store_id
                next();
            } else {
                return res.status(400).send(generateResponse(false, "authenication failed", 400, null));
            }

        } else {
            return res.status(400).send(generateResponse(false, "authenication failed", 400, null));
        }

    } catch (error: any) {
        console.log(error);
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
    // err


}