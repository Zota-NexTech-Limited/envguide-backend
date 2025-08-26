import nodemailer from 'nodemailer';

 const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
  auth: {
    user: 'info@zotanextech.com',
    pass: 'GDinr649',
  },
   tls: {
    minVersion: 'TLSv1.2', // Required by Outlook.com
    rejectUnauthorized: true,
  },
  

});


export default transporter;


 