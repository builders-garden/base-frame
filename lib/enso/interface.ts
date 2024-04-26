export interface Transaction {
    data: string;
    to: string;
    from: string;
    value: string;
}
  
  export interface ApiResponse {
    gas: string;
    amountOut: string;
    feeAmount: string[];
    createdAt: number;
    tx: Transaction;
    route: Route[];
}
  export interface Route {
    action: string;
    protocol: string;
    tokenIn: string[];
    tokenOut: string[];
}