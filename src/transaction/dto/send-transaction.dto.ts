export class SendTransactionDto {
  sender: string;
  recipient: string;
  value: number;
  private_key: string;
}
