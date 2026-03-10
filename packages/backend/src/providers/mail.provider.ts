import nodemailer, { type Transporter } from 'nodemailer';

import type { IMailProvider, IMailTemplateData } from '../types/auth.types.js';

/**
 * Provedor de envio de emails usando Nodemailer.
 *
 * Em desenvolvimento, utiliza conta de teste Ethereal para visualização.
 * Em produção, utiliza SMTP real configurado via variáveis de ambiente.
 * Inicializa o transporte SMTP uma única vez (lazy singleton) e reutiliza
 * em todos os envios subsequentes.
 */
class MailProvider implements IMailProvider {
  /** Transporter SMTP inicializado sob demanda (lazy). */
  private transporter: Transporter | null = null;

  /**
   * Obtém ou cria o transporter Nodemailer.
   * Em produção, usa SMTP real via variáveis de ambiente.
   * Em desenvolvimento, cria uma conta de teste Ethereal.
   *
   * @returns Transporter SMTP pronto para envio
   */
  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) return this.transporter;

    if (process.env.NODE_ENV === 'production') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      const account = await nodemailer.createTestAccount();

      this.transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass,
        },
      });
    }

    return this.transporter;
  }

  /**
   * Envia um email utilizando o transporter SMTP singleton.
   *
   * @param params - Parâmetros do email.
   * @param params.to - Endereço de email do destinatário.
   * @param params.subject - Assunto do email.
   * @param params.templateData - Dados do template com variáveis para o corpo do email.
   */
  async sendMail({
    to,
    subject,
    templateData,
  }: {
    to: string;
    subject: string;
    templateData: IMailTemplateData;
  }): Promise<void> {
    const transporter = await this.getTransporter();

    /** Constrói o corpo do email a partir das variáveis do template. */
    const body = Object.entries(templateData.variables)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const message = await transporter.sendMail({
      from: 'LouvorFlow <noreply@louvorflow.com>',
      to,
      subject,
      text: body,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MailProvider] Preview URL: ${nodemailer.getTestMessageUrl(message)}`);
    }
  }
}

export default new MailProvider();
