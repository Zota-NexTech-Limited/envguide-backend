import transporter from '../util/nodemailer';

export async function sendSupplierTaskEmail(payload: {
    email: string;
    bom_pcf_id: string;
    bom_id: string;
    supplier_id: string;
}) {

    const link =
        `https://enviguide.nextechltd.in/supplier-questionnaire` +
        `?bom_pcf_id=${payload.bom_pcf_id}` +
        `&sup_id=${payload.supplier_id}`;

    const mailOptions = {
        to: payload.email,
        from: 'info@zotanextech.com',
        subject: 'Supplier Questionnaire Request',
        body: `Hi,

Please complete the supplier questionnaire using the link below:

${link}

Regards,
Zota Nextech`
    };

    return transporter.sendMail(mailOptions);
}

