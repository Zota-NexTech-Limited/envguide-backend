import axios from "axios";
import { getGraphAccessToken } from "../util/azureToken";

const SENDER_EMAIL = 'support@enviguide.info';

interface SendMailPayload {
    to: string[];
    subject: string;
    html: string;
}

export async function sendMail(payload: SendMailPayload) {
    try {
        
        const token = await getGraphAccessToken();

        const url = `https://graph.microsoft.com/v1.0/users/${SENDER_EMAIL}/sendMail`;

        const body = {
            message: {
                subject: payload.subject,
                body: {
                    contentType: "HTML",
                    content: payload.html
                },
                toRecipients: payload.to.map(email => ({
                    emailAddress: { address: email }
                }))
            },
            saveToSentItems: true
        };

                console.log("📧 Sending email with body:", JSON.stringify(body, null, 2)); // Debug log


      const response =  await axios.post(url, body, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        console.log("✅ Email sent successfully:", response.status);

        return { success: true };
    } catch (error: any) {
        console.error("❌ SendMail failed:", error.response?.data || error.message);
        throw new Error("Email sending failed");
    }
}
