import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ECPairAPI, ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from './entity/wallet.entity';
import { In, Repository } from 'typeorm';
import { WalletEncryptionService } from './utils/wallet-encryption.service';

@Injectable()
export class WalletService {
  NETWORK: bitcoin.networks.Network;
  ECPairAPI: ECPairAPI;

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly walletEncryptionService: WalletEncryptionService,
    private configService: ConfigService,
  ) {
    this.ECPairAPI = ECPairFactory(ecc);
    this.NETWORK =
      this.configService.get('NODE_ENV') === 'production'
        ? bitcoin.networks.bitcoin
        : bitcoin.networks.testnet;
  }

  public async findOne(address: string) {
    const wallet = await this.walletRepository.findOne({ where: { address } });
    wallet['privateKey'] = this.walletEncryptionService.decrypt(
      wallet.privateKey,
      wallet.iv,
    );
    return wallet;
  }

  private async saveWallet(dto: {
    address: string;
    privateKey: string;
    iv: string;
  }) {
    await this.walletRepository.save(dto);
  }

  public async getAllWallets() {
    return await this.walletRepository.find();
  }

  public async checkWallets(wallets: string[]) {
    return await this.walletRepository.find({
      where: { address: In(wallets) },
    });
  }

  public async generate() {
    const keyPair = this.ECPairAPI.makeRandom({ network: this.NETWORK });
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(keyPair.publicKey),
      network: this.NETWORK,
    });
    const privateKey = keyPair.toWIF();

    const { iv, encryptedPrivateKey } =
      this.walletEncryptionService.encrypt(privateKey);

    await this.saveWallet({ address, iv, privateKey: encryptedPrivateKey });

    return {
      address,
      privateKey,
    };
  }
}
