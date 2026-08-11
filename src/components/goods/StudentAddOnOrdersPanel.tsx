import React, { useMemo, useState } from 'react';
import {
  getRefundEligibility,
  refundStudentAddOnOrder,
  type RefundAuditEvent,
  type RefundLedger,
  type StudentAddOnOrder,
} from '../../domain/studentAddOnOrder';

interface StudentAddOnOrdersPanelProps {
  onAudit: (event: RefundAuditEvent) => void;
  onNotify: (message: string, tone?: 'success' | 'warning' | 'error') => void;
}

const initialOrders: StudentAddOnOrder[] = [
  { id: 'PAY-20260808-0192', student: '张伟强', institution: '浙江大学附属中学', packageName: '标准加油包', channel: '微信支付', paidAmount: 39.9, grantedUsage: 1_000_000, remainingUsage: 1_000_000, status: 'paid', orderedAt: '2026-08-08 19:32' },
  { id: 'PAY-20260808-0186', student: '李思思', institution: '上海青葱教育培训中心', packageName: '轻量加油包', channel: '支付宝', paidAmount: 9.9, grantedUsage: 200_000, remainingUsage: 185_200, status: 'paid', orderedAt: '2026-08-08 18:46' },
  { id: 'PAY-20260807-0163', student: '王浩然', institution: '博雅语言学院', packageName: '畅用加油包', channel: '微信支付', paidAmount: 99, grantedUsage: 3_000_000, remainingUsage: 0, status: 'refunded', orderedAt: '2026-08-07 16:03', refundedAt: '2026-08-07 16:08', refundNo: 'RF-20260807-0163', refundReason: '家长误购' },
];

const formatUsage = (value: number) => value.toLocaleString('zh-CN');

export const StudentAddOnOrdersPanel: React.FC<StudentAddOnOrdersPanelProps> = ({ onAudit, onNotify }) => {
  const [orders, setOrders] = useState<StudentAddOnOrder[]>(initialOrders);
  const [refundLedgers, setRefundLedgers] = useState<RefundLedger[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<StudentAddOnOrder | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [search, setSearch] = useState('');

  const visibleOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter((order) => [order.id, order.student, order.institution].some((value) => value.toLowerCase().includes(keyword)));
  }, [orders, search]);

  const handleRefund = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedOrder || !refundReason.trim()) return;
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-');
    try {
      const result = refundStudentAddOnOrder(selectedOrder, refundReason.trim(), now);
      setOrders((current) => current.map((order) => (order.id === result.order.id ? result.order : order)));
      setRefundLedgers((current) => [result.ledger, ...current]);
      onAudit(result.audit);
      onNotify(`退款成功：¥${result.ledger.amount} 已原路退回，退款流水 ${result.ledger.id}`);
      setSelectedOrder(null);
      setRefundReason('');
    } catch (error) {
      onNotify(error instanceof Error ? error.message : '退款失败', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-[#0F172A]">学生加油包订单</h3>
            <p className="mt-1 text-[12px] text-[#64748B]">查看支付、AI 用量到账和退款结果；未使用订单可直接原路退款。</p>
          </div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-[12px] outline-none" placeholder="搜索订单或学生" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-[13px]">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"><tr><th className="px-4 py-3">订单号</th><th className="px-4 py-3">学生 / 机构</th><th className="px-4 py-3">加油包</th><th className="px-4 py-3">支付方式</th><th className="px-4 py-3">实付</th><th className="px-4 py-3">到账 AI 用量</th><th className="px-4 py-3">剩余 AI 用量</th><th className="px-4 py-3">状态 / 时间</th><th className="px-4 py-3 text-right">操作</th></tr></thead>
            <tbody className="divide-y divide-[#EEF2F6]">
              {visibleOrders.map((order) => {
                const eligibility = getRefundEligibility(order);
                return (
                  <tr key={order.id}>
                    <td className="px-4 py-3.5 font-mono text-[12px]">{order.id}</td>
                    <td className="px-4 py-3.5"><div className="font-medium">{order.student}</div><div className="text-[11px] text-[#94A3B8]">{order.institution}</div></td>
                    <td className="px-4 py-3.5">{order.packageName}</td><td className="px-4 py-3.5">{order.channel}</td><td className="px-4 py-3.5 tabular-nums">¥{order.paidAmount}</td>
                    <td className="px-4 py-3.5 tabular-nums">{formatUsage(order.grantedUsage)}</td><td className="px-4 py-3.5 tabular-nums">{formatUsage(order.remainingUsage)}</td>
                    <td className="px-4 py-3.5"><div className={order.status === 'refunded' ? 'font-medium text-[#64748B]' : 'font-medium text-[#0E7D3E]'}>{order.status === 'refunded' ? '已退款' : order.status === 'paid' ? '已到账' : '支付失败'}</div><div className="mt-1 text-[11px] text-[#94A3B8]">{order.refundedAt ?? order.orderedAt}</div>{order.refundNo && <div className="mt-1 font-mono text-[10px] text-[#64748B]">{order.refundNo}</div>}</td>
                    <td className="px-4 py-3.5 text-right">
                      {eligibility.allowed ? <button onClick={() => setSelectedOrder(order)} className="rounded-lg border border-[#0E7D3E]/30 bg-[#E8F7EE] px-3 py-1.5 text-[12px] font-semibold text-[#0E7D3E] hover:bg-[#DDF3E6]">申请退款</button> : <span className="inline-block max-w-[170px] text-[11px] leading-4 text-[#94A3B8]">{eligibility.reason}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {refundLedgers.length > 0 && <div className="rounded-xl border border-[#D9E9DF] bg-[#F3FAF6] px-4 py-3 text-[12px] text-[#0E7D3E]">本次已生成退款流水：{refundLedgers.map((item) => item.id).join('、')}</div>}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <form onSubmit={handleRefund} className="w-full max-w-md space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl">
            <div><h3 className="text-[17px] font-bold text-[#0F172A]">确认原路全额退款</h3><p className="mt-1 text-[12px] text-[#64748B]">确认后将同步收回未使用的 AI 用量并生成退款流水。</p></div>
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#F8FAFC] p-4 text-[12px]"><div><span className="text-[#64748B]">订单号</span><strong className="mt-1 block font-mono">{selectedOrder.id}</strong></div><div><span className="text-[#64748B]">退款金额</span><strong className="mt-1 block">¥{selectedOrder.paidAmount}</strong></div><div><span className="text-[#64748B]">原支付渠道</span><strong className="mt-1 block">{selectedOrder.channel}</strong></div><div><span className="text-[#64748B]">收回 AI 用量</span><strong className="mt-1 block">{formatUsage(selectedOrder.remainingUsage)}</strong></div></div>
            <label className="block text-[12px] font-semibold text-[#475569]">退款原因<textarea required value={refundReason} onChange={(event) => setRefundReason(event.target.value)} className="mt-1.5 min-h-20 w-full resize-none rounded-xl border border-[#E2E8F0] p-3 text-[13px] outline-none focus:border-[#16B45B]" placeholder="填写退款原因" /></label>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => { setSelectedOrder(null); setRefundReason(''); }} className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-[13px] font-semibold text-[#64748B]">取消</button><button type="submit" className="rounded-xl bg-[#0E7D3E] px-4 py-2 text-[13px] font-semibold text-white">确认退款</button></div>
          </form>
        </div>
      )}
    </div>
  );
};
