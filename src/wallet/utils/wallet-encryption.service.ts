import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class WalletEncryptionService {
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const encryptionKey = this.configService.getOrThrow('ENCRYPTION_KEY');

    if (!encryptionKey || encryptionKey.length !== 64) {
      throw new Error('ENCRYPTION_KEY is missing or has invalid length');
    }

    this.key = Buffer.from(encryptionKey, 'utf-8');
  }

  private generateIV(): Buffer {
    return crypto.randomBytes(16);
  }

  encrypt(privateKey: string): { iv: string; encryptedPrivateKey: string } {
    const iv = this.generateIV();
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv);

    let encryptedPrivateKey = cipher.update(privateKey, 'utf8', 'hex');
    encryptedPrivateKey += cipher.final('hex');

    return {
      iv: iv.toString('hex'),
      encryptedPrivateKey,
    };
  }

  decrypt(encryptedData: string, iv: string): string {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      this.key,
      Buffer.from(iv, 'hex'),
    );

    let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
    decryptedData += decipher.final('utf8');

    return decryptedData;
  }
}