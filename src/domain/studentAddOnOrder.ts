export type StudentAddOnOrderStatus = 'paid' | 'payment_failed' | 'refunded';

export interface StudentAddOnOrder {
  id: string;
  student: string;
  institution: string;
  packageName: string;
  channel: '微信支付' | '支付宝';
  paidAmount: number;
  grantedUsage: number;
  remainingUsage: number;
  status: StudentAddOnOrderStatus;
  orderedAt: string;
  refundedAt?: string;
  refundNo?: string;
  refundReason?: string;
}

export interface RefundLedger {
  id: string;
  orderId: string;
  amount: number;
  channel: string;
  reason: string;
  createdAt: string;
}

export interface RefundAuditEvent {
  action: '学生加油包退款';
  target: string;
  details: string;
}

export interface RefundResult {
  order: StudentAddOnOrder;
  ledger: RefundLedger;
  audit: RefundAuditEvent;
}

export const getRefundEligibility = (order: StudentAddOnOrder): { allowed: boolean; reason: string } => {
  if (order.status === 'refunded') return { allowed: false, reason: '订单已退款' };
  if (order.status !== 'paid') return { allowed: false, reason: '支付未成功，无需退款' };
  const used = order.grantedUsage - order.remainingUsage;
  if (used > 0) {
    return { allowed: false, reason: `已使用 ${used.toLocaleString('zh-CN')} AI 用量，不可退款` };
  }
  return { allowed: true, reason: '可原路全额退款' };
};

export function refundStudentAddOnOrder(
  order: StudentAddOnOrder,
  reason: string,
  now: string,
): RefundResult {
  const eligibility = getRefundEligibility(order);
  if (!eligibility.allowed) throw new Error(eligibility.reason);
  const refundNo = `RF-${order.id.replace('PAY-', '')}`;
  return {
    order: {
      ...order,
      status: 'refunded',
      remainingUsage: 0,
      refundedAt: now,
      refundNo,
      refundReason: reason,
    },
    ledger: {
      id: refundNo,
      orderId: order.id,
      amount: order.paidAmount,
      channel: order.channel,
      reason,
      createdAt: now,
    },
    audit: {
      action: '学生加油包退款',
      target: order.id,
      details: `原路退回 ¥${order.paidAmount}，收回 ${order.grantedUsage.toLocaleString('zh-CN')} AI 用量`,
    },
  };
}
