import { sendMail } from "../util/mailTransporter";

export async function sendSupplierTaskEmail(payload: {
    email: string;
    bom_pcf_id: string;
    bom_id: string;
    supplier_id: string;
}) {

    const subject = 'Supplier Questionnaire Request'
    const link =
        `https://enviguide.nextechltd.in/supplier-questionnaire` +
        `?bom_pcf_id=${payload.bom_pcf_id}` +
        `&sup_id=${payload.supplier_id}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <p>Hello,</p>
        
        <p>You have been requested to complete a supplier questionnaire for Enviguide.</p>
        
        <p style="margin: 20px 0;">
            <a href="${link}" 
               style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                Complete Supplier Questionnaire
            </a>
        </p>
        
        <p>Or copy and paste this link into your browser:<br>
           <a href="${link}">${link}</a>
        </p>
        
        <p>If you have any questions, please contact our support team.</p>
        
        <p>Best regards,<br>
           <strong>Team Enviguide</strong><br>
      </p>
    </div>
    
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
        <p>This is an automated message from Enviguide. Please do not reply to this email.</p>
    </div>
</body>
</html>
        `;


    await sendMail({
        to: Array.isArray(payload.email) ? payload.email : [payload.email],
        subject: subject,
        html: html
    });
}

