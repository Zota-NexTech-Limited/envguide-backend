import client from '../util/database';
import { ulid } from 'ulid';

export interface MFASecretData {
    user_id: string;
    user_email: string;
    mfa_secret: string;
}

export async function saveMFASecret(data: MFASecretData) {
    try {
        const id = ulid();
        const insertQuery = `
            INSERT INTO user_mfa_secret (id, user_id, user_email, mfa_secret)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const result = await client.query(insertQuery, [
            id,
            data.user_id,
            data.user_email,
            data.mfa_secret
        ]);
        return result.rows[0];
    } catch (error) {
        console.error("Error saving MFA secret:", error);
        throw error;
    }
}

export async function getSecretByUserId(user_id: string) {
    try {
        const query = `
            SELECT * FROM user_mfa_secret
            WHERE user_id = $1
            LIMIT 1;
        `;
        const result = await client.query(query, [user_id]);
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error("Error fetching MFA secret:", error);
        throw error;
    }
}

export async function getSecretByEmail(user_email: string) {
    try {
        const query = `
            SELECT * FROM user_mfa_secret
            WHERE user_email = $1
            LIMIT 1;
        `;
        const result = await client.query(query, [user_email]);
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error("Error fetching MFA secret:", error);
        throw error;
    }
}

export async function updateMFASecret(user_id: string, mfa_secret: string) {
    try {
        const query = `
            UPDATE user_mfa_secret
            SET mfa_secret = $1, update_date = CURRENT_TIMESTAMP
            WHERE user_id = $2
            RETURNING *;
        `;
        const result = await client.query(query, [mfa_secret, user_id]);
        return result.rows[0];
    } catch (error) {
        console.error("Error updating MFA secret:", error);
        throw error;
    }
}

export async function deleteMFASecret(user_id: string) {
    try {
        const query = `
            DELETE FROM user_mfa_secret
            WHERE user_id = $1;
        `;
        await client.query(query, [user_id]);
        return true;
    } catch (error) {
        console.error("Error deleting MFA secret:", error);
        throw error;
    }
}