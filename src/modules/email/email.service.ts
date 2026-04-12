import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private resend: Resend;
    private host: string;

    constructor() {
        const host = process.env.EMAIL_HOST;
        const key = process.env.EMAIL_KEY;

        if (!host) throw new Error('EMAIL_HOST not defined');
        if (!key) throw new Error('EMAIL_KEY not defined');

        this.resend = new Resend(key);
        this.host = host;
    }

    async sendEmail(to: string, subject: string, text: string) {
        await this.resend.emails.send({
            from: this.host,
            to: to,
            subject: subject,
            text: text,
        });
    }
}
