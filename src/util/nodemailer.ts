import nodemailer from 'nodemailer';

 const transporter = nodemailer.createTransport({
     host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: 'support@enviguide.info',
        pass: 'maaran@7890',
      },
      tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
  

});


export default transporter;


 