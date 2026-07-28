import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {

  private transporter =
    nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },

    });

  async sendUserCredentials(
    email:string,
    password:string,
    name:string,
  ){
    try{
      const info = await this.transporter.sendMail({

      from:
      `"TeamHub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject:
      "Your TeamHub account has been created",


      html:`
      <h2>Welcome ${name}</h2>
      <p>
      Your TeamHub account has been created.
      </p>
      <p>
      You can login using:
      </p>
      <strong>Email:</strong>
      ${email}
      <br/>
      <strong>Password:</strong>
      ${password}
      <br/><br/>
      Please change your password after your first login.
      `
    });
    console.log("Email sent:", info);
    } catch(error){
    console.error("Email failed:", error);
  throw error;
  }
  }
}