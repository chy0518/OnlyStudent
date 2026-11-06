export interface PaymentProvider {
  createPayment(
    key: string,
    amount: number,
  ): Promise<{ id: string; status: "SUCCESS" | "PENDING" }>;
  queryPayment(
    id: string,
  ): Promise<{ id: string; status: "SUCCESS" | "PENDING" }>;
}
export class MockPaymentProvider implements PaymentProvider {
  async createPayment(key: string, _amount: number) {
    return { id: key, status: "SUCCESS" as const };
  }
  async queryPayment(id: string) {
    return { id, status: "SUCCESS" as const };
  }
}
