const nodemailer = require('nodemailer')
const transporter = nodemailer.createTransport(
  {
    secure: true,
    host: 'smtp.gmail.com',
    port: 465,
    auth:{
      user: 'sophorspheng.num@gmail.com',
      pass: 'uhrv bmpv jmkj jfxn'
    }
  }
)
function sendMail(to,sub,msg){
  transporter.sendMail({
    to:to,
    subject: sub,
    html:msg
  });
  console.log("Email sent");
}
sendMail("sophorspheng.num@gmail.com","Verify code OTP","OTP Code: 292382")