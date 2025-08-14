import nodemailer from "nodemailer"
import "dotenv/config"

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user:process.env.SMTP_USER,
      pass:process.env.SMTP_PASSWORD,
    },
});

export default transporter