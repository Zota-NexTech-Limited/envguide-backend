import jwt from 'jsonwebtoken';
import * as authService from '../services/userService'
import { generateResponse } from '../util/genRes';
import * as dotenv from 'dotenv';
dotenv.config();
export async function authenticate(req: any, res: any, next: any) {

    try {
        let token = req.header('authorization');
        console.log('Raw token from header:', token);
        
        // Strip "Bearer " prefix if present
        if (token && token.startsWith('Bearer ')) {
            token = token.substring(7); // Remove "Bearer " prefix
        }
        
        console.log('Token after stripping Bearer:', token);
        const TOKEN_SECRET: string = process.env.TOKEN_SECRET ?? 'defaultSecret';

        console.log('TOKEN_SECRET:', TOKEN_SECRET)
        if (TOKEN_SECRET && token) {
            const user: any = jwt.verify(token, TOKEN_SECRET);
            console.log(user, "admindataaa")

            const findUser = await authService.finduser(user.email)
            if (findUser.rows.length > 0)
                console.log(findUser.rows, "user id")
            req.user_id = findUser.rows[0].user_id
            req.role_id = findUser.rows[0].user_role_id
            console.log(req.role_id, "dddddd")
            // req.store_id = findUser.rows[0].user_store_id
            console.log(req.user_id)
            next();

        } else {
            return res.status(400).send(generateResponse(false, "authenication failed", 400, null));
        }

    } catch (error: any) {
        console.log(error);
        return res.status(400).send(generateResponse(false, error.message, 400, null));
    }
    // err


}