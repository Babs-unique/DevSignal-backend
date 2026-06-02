import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset?token=${resetToken}`;
    
    try {
        const response = await resend.emails.send({
            from: 'DevSignal <onboarding@resend.dev>', // Update with your Resend sender
            to: email,
            subject: 'Reset Your Password - DevSignal',
            html: `
                <!DOCTYPE html>
                <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background-color: #7c3aed; color: white; padding: 20px; border-radius: 8px; text-align: center; }
                            .content { padding: 20px; background-color: #f5f5f5; margin: 20px 0; border-radius: 8px; }
                            .button { 
                                display: inline-block; 
                                background-color: #7c3aed; 
                                color: white; 
                                padding: 12px 30px; 
                                text-decoration: none; 
                                border-radius: 5px;
                                margin: 20px 0;
                            }
                            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>DevSignal</h1>
                                <p>Password Reset Request</p>
                            </div>
                            
                            <div class="content">
                                <p>Hi,</p>
                                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                                
                                <center>
                                    <a href="${resetUrl}" class="button">Reset Password</a>
                                </center>
                                
                                <p>Or copy and paste this link in your browser:</p>
                                <p style="word-break: break-all; color: #7c3aed;">${resetUrl}</p>
                                
                                <p style="margin-top: 20px; color: #666; font-size: 14px;">
                                    This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
                                </p>
                            </div>
                            
                            <div class="footer">
                                <p>&copy; 2026 DevSignal. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                </html>
            `
        });
        
        return response;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
};
