export interface TokenRefundState {
  status: 'paid' | 'refunded';
  grantedToken: number;
  remainingToken: number;
}

export const getTokenRefundEligibility = (order: TokenRefundState): { allowed: boolean; reason: string } => {
  if (order.status === 'refunded') return { allowed: false, reason: '订单已退款' };
  if (order.remainingToken !== order.grantedToken) return { allowed: false, reason: 'Token 已使用，不可退款' };
  return { allowed: true, reason: '可全额退款' };
};
