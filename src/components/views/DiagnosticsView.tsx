import React, { useState } from 'react';
import { StudentItem } from '../../types';

interface DiagnosticsViewProps {
  students: StudentItem[];
  onGenerateReport: (studentId: string, subject: string, startDate: string, endDate: string) => void;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({
  students,
  onGenerateReport,
}) => {
  const [activeTab, setActiveTab] = useState<'platform' | 'individual'>('platform');

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || 'STU-001');
  const [subject, setSubject] = useState('数学');
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-29');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);
  const [isSyncedToMiniProgram, setIsSyncedToMiniProgram] = useState(false);

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const handleRunDiagnostic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert('请完整选择诊断开始日期与结束日期！');
      return;
    }
    if (startDate > endDate) {
      alert('起始日期不能晚于结束日期！');
      return;
    }

    setIsGenerating(true);
    setIsSyncedToMiniProgram(false);
    setTimeout(() => {
      setIsGenerating(false);
      onGenerateReport(selectedStudentId, subject, startDate, endDate);

      setGeneratedReport({
        studentName: currentStudent?.name || '王小明',
        subject,
        startDate,
        endDate,
        totalQuestions: 142,
        accuracyRate: 82,
        coverageRate: 68,
        dimensions: [
          { name: '基础概念', score: 88, status: '良好' },
          { name: '高阶运算', score: 68, status: '薄弱' },
          { name: '逻辑推理', score: 82, status: '良好' },
          { name: '审题习惯', score: 62, status: '薄弱' },
          { name: '综合应用', score: 76, status: '中等' },
        ],
        weaknesses: [
          { name: '一元一次方程去分母与去括号', accuracy: 42, action: '建议优先复习移项与括号分配律定理，完成 3 道基础变式练' },
          { name: '牛顿第二定律超重失重判别', accuracy: 55, action: '建议复习加速度方向与支持力关系，完成 2 道典型压轴题' },
          { name: '氧化还原反应电子转移配平', accuracy: 48, action: '建议重点练习升降价守恒计算法' },
        ],
        errorDist: [
          { type: '核心概念未理解', count: 12, pct: 40 },
          { type: '计算步骤错误', count: 10, pct: 33 },
          { type: '审题遗漏条件', count: 5, pct: 17 },
          { type: '逻辑推理跳步', count: 3, pct: 10 },
        ],
        aiSummary: `学生【${currentStudent?.name}】在本次诊断周期（${startDate} 至 ${endDate}）内，通过微信小程序同步答题 142 道，整体正确率为 82%。基础概念与推理能力处于较高水平，但在“高阶运算”与“审题习惯”方面表现较弱，主要丢分点集中在去括号步骤符号漏算与题目限制条件忽略。`,
        generatedAt: new Date().toLocaleString(),
      });
    }, 1000);
  };

  return (
    <div className="space-y-4">
      {/* Navigation Subtabs & Sync Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E2E8F0] pb-1 gap-3">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('platform')}
            className={`pb-2 text-[13.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'platform'
                ? 'text-[#16B45B] border-b-2 border-[#16B45B]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
            全平台/机构学情大屏
          </button>

          <button
            onClick={() => setActiveTab('individual')}
            className={`pb-2 text-[13.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'individual'
                ? 'text-[#16B45B] border-b-2 border-[#16B45B]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person_search</span>
            学生个体 AI 智能诊断档案
          </button>
        </div>

        <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-lg text-[12px] mb-1">
          <span className="w-2 h-2 rounded-full bg-[#16B45B] animate-pulse"></span>
          <span className="text-[#0F172A] font-bold">小程序数据实时同步中</span>
        </div>
      </div>

      {/* Tab 1: Platform Analytics */}
      {activeTab === 'platform' && (
        <div className="space-y-4">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs space-y-1">
              <div className="flex justify-between items-center text-[12px] text-[#64748B]">
                <span>小程序累积刷题量</span>
                <span className="text-[#16B45B] font-bold font-mono">+12.4%</span>
              </div>
              <p className="text-[22px] font-extrabold text-[#0F172A] font-mono">1,428,900 <span className="text-[12px] font-normal text-[#64748B]">题</span></p>
              <p className="text-[11px] text-[#94A3B8]">覆盖全平台 2,150 名在读学生</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs space-y-1">
              <div className="flex justify-between items-center text-[12px] text-[#64748B]">
                <span>平台整体正确率</span>
                <span className="text-[#16B45B] font-bold font-mono">达标</span>
              </div>
              <p className="text-[22px] font-extrabold text-[#16B45B] font-mono">81.6%</p>
              <p className="text-[11px] text-[#94A3B8]">其中基础题正确率 89.2%</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs space-y-1">
              <div className="flex justify-between items-center text-[12px] text-[#64748B]">
                <span>小程序错题消灭率</span>
                <span className="text-[#2563EB] font-bold font-mono">持续提升</span>
              </div>
              <p className="text-[22px] font-extrabold text-[#2563EB] font-mono">76.8%</p>
              <p className="text-[11px] text-[#94A3B8]">已累计消灭 342,100 条错题</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs space-y-1">
              <div className="flex justify-between items-center text-[12px] text-[#64748B]">
                <span>AI 智能答疑互动</span>
                <span className="text-[#F5B700] font-bold font-mono">活跃</span>
              </div>
              <p className="text-[22px] font-extrabold text-[#0F172A] font-mono">89,450 <span className="text-[12px] font-normal text-[#64748B]">次</span></p>
              <p className="text-[11px] text-[#94A3B8]">平均解决答疑耗时 12 秒</p>
            </div>
          </div>

          {/* Section 2: Subject Mastery & Top Error Knowledge Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject Mastery Rates */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#16B45B] text-[18px]">bar_chart</span>
                  四大学科全平台平均掌握度
                </h3>
                <span className="text-[11px] text-[#64748B]">最近30天</span>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: '数学', rate: 78, color: 'bg-[#16B45B]', count: '520,100题' },
                  { name: '物理', rate: 68, color: 'bg-[#2563EB]', count: '380,400题' },
                  { name: '化学', rate: 84, color: 'bg-[#0E7D3E]', count: '290,200题' },
                  { name: '生物', rate: 89, color: 'bg-[#F5B700]', count: '238,200题' },
                ].map((s) => (
                  <div key={s.name} className="space-y-1">
                    <div className="flex justify-between text-[12px]">
                      <span className="font-bold text-[#0F172A]">{s.name}</span>
                      <span className="font-mono text-[#64748B]">{s.count} | 平均正确率 <strong className="text-[#0F172A]">{s.rate}%</strong></span>
                    </div>
                    <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                      <div className={`${s.color} h-full rounded-full transition-all duration-500`} style={{ width: `${s.rate}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 High-Frequency Error Points */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#DC2626] text-[18px]">report_problem</span>
                  小程序学生全网高频易错考点 Top 5
                </h3>
                <span className="text-[11px] text-[#64748B]">待专项提升</span>
              </div>

              <div className="space-y-2 text-[12.5px]">
                {[
                  { rank: 1, name: '一元二次方程根与系数关系 (韦达定理)', subject: '数学', errPct: '42%', count: '12,400人次错题' },
                  { rank: 2, name: '动量守恒定理与碰撞过程能量损失', subject: '物理', errPct: '45%', count: '9,800人次错题' },
                  { rank: 3, name: '氧化还原反应电子转移数目配平', subject: '化学', errPct: '39%', count: '8,200人次错题' },
                  { rank: 4, name: '基因分离定律与自由组合棋盘概率算', subject: '生物', errPct: '36%', count: '7,100人次错题' },
                  { rank: 5, name: '三角函数诱导公式与图像平移变换', subject: '数学', errPct: '33%', count: '6,500人次错题' },
                ].map((item) => (
                  <div key={item.rank} className="flex items-center justify-between bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center font-mono ${
                        item.rank <= 3 ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#F1F5F9] text-[#64748B]'
                      }`}>
                        {item.rank}
                      </span>
                      <span className="font-bold text-[#0F172A] truncate max-w-[220px]">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11.5px]">
                      <span className="bg-[#E8F7EE] text-[#0E7D3E] px-1.5 py-0.5 rounded font-bold">{item.subject}</span>
                      <span className="text-[#DC2626] font-bold font-mono">错误率 {item.errPct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Assistance Scenarios & Mini-Program Sync Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs space-y-3">
              <h4 className="text-[13.5px] font-bold text-[#0F172A] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#16B45B] text-[18px]">smart_toy</span>
                AI 学伴提问类型分布
              </h4>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between items-center">
                  <span>解题步骤逐步拆解引导</span>
                  <span className="font-bold font-mono text-[#0F172A]">42%</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full"><div className="bg-[#16B45B] h-1.5 rounded-full" style={{ width: '42%' }}></div></div>

                <div className="flex justify-between items-center">
                  <span>变式练习拓展推荐</span>
                  <span className="font-bold font-mono text-[#0F172A]">28%</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full"><div className="bg-[#2563EB] h-1.5 rounded-full" style={{ width: '28%' }}></div></div>

                <div className="flex justify-between items-center">
                  <span>基础概念与公式定义解释</span>
                  <span className="font-bold font-mono text-[#0F172A]">18%</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full"><div className="bg-[#F5B700] h-1.5 rounded-full" style={{ width: '18%' }}></div></div>

                <div className="flex justify-between items-center">
                  <span>错题消灭强化关卡</span>
                  <span className="font-bold font-mono text-[#0F172A]">12%</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full"><div className="bg-[#0E7D3E] h-1.5 rounded-full" style={{ width: '12%' }}></div></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs space-y-3 md:col-span-2">
              <h4 className="text-[13.5px] font-bold text-[#0F172A] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#2563EB] text-[18px]">sync_alt</span>
                家校与小程序端学情报告推送状态
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                  <p className="text-[18px] font-bold text-[#0F172A] font-mono">94.2%</p>
                  <p className="text-[11px] text-[#64748B]">周度诊断小程序推送覆盖率</p>
                </div>
                <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                  <p className="text-[18px] font-bold text-[#16B45B] font-mono">88.5%</p>
                  <p className="text-[11px] text-[#64748B]">微信家长端订阅查阅率</p>
                </div>
                <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                  <p className="text-[18px] font-bold text-[#2563EB] font-mono">12,410 次</p>
                  <p className="text-[11px] text-[#64748B]">教师基于诊断派发训练任务</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Individual Diagnostic Report */}
      {activeTab === 'individual' && (
        <div className="space-y-4">
          {/* Target Selection & Generator Form */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs space-y-3">
            <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#16B45B] text-[18px]">manage_search</span>
              生成学生阶段性智能学习诊断报告
            </h3>

            <form onSubmit={handleRunDiagnostic} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11.5px] font-bold text-[#475569] mb-1">选择目标学生</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[12.5px] font-bold outline-none cursor-pointer focus:border-[#16B45B]"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.institutionName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#475569] mb-1">诊断学科</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[12.5px] outline-none cursor-pointer focus:border-[#16B45B]"
                >
                  <option value="数学">数学</option>
                  <option value="物理">物理</option>
                  <option value="化学">化学</option>
                  <option value="生物">生物</option>
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#475569] mb-1">起始日期</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[12.5px] font-mono outline-none focus:border-[#16B45B]"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#475569] mb-1">结束日期</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[12.5px] font-mono outline-none focus:border-[#16B45B]"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-1.5 bg-[#16B45B] text-white font-bold rounded-lg text-[13px] hover:bg-[#139B4E] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[17px]">
                    {isGenerating ? 'sync' : 'analytics'}
                  </span>
                  {isGenerating ? 'AI 诊断计算中...' : '生成诊断报告'}
                </button>
              </div>
            </form>
          </div>

          {/* Selected Student Profile */}
          {currentStudent && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs space-y-3">
              <div className="flex justify-between items-center pb-2.5 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="text-[14.5px] font-bold text-[#0F172A]">
                    【{currentStudent.name}】小程序同步学习指标与全景概览
                  </h3>
                  <p className="text-[11.5px] text-[#64748B] mt-0.5">
                    归属机构：{currentStudent.institutionName} | 责任教师：{currentStudent.teacherName} | 年级：{currentStudent.grade} ({currentStudent.textbook})
                  </p>
                </div>
                <span className="text-[11.5px] font-mono bg-[#E8F7EE] text-[#0E7D3E] font-bold px-2.5 py-0.5 rounded border border-[#16B45B]/20">
                  有效至: {currentStudent.serviceExpireAt || '未激活'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center font-mono">
                <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                  <p className="text-[18px] font-bold text-[#0F172A]">{currentStudent.totalStudyHours}h</p>
                  <p className="text-[10.5px] text-[#64748B] font-sans mt-0.5">总学习时长</p>
                </div>

                <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                  <p className="text-[18px] font-bold text-[#0F172A]">{currentStudent.totalQuestions}题</p>
                  <p className="text-[10.5px] text-[#64748B] font-sans mt-0.5">小程序答题总量</p>
                </div>

                <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                  <p className="text-[18px] font-bold text-[#16B45B]">{currentStudent.accuracyRate}%</p>
                  <p className="text-[10.5px] text-[#64748B] font-sans mt-0.5">历史综合正确率</p>
                </div>

                <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                  <p className="text-[18px] font-bold text-[#EF4444]">{currentStudent.errorCount}条</p>
                  <p className="text-[10.5px] text-[#64748B] font-sans mt-0.5">错题本积累</p>
                </div>

                <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                  <p className="text-[18px] font-bold text-[#F5B700]">{currentStudent.unreviewedErrorCount}条</p>
                  <p className="text-[10.5px] text-[#64748B] font-sans mt-0.5">待消灭错题</p>
                </div>
              </div>
            </div>
          )}

          {/* Generated Report Output */}
          {generatedReport && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-[#E2E8F0] gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-bold font-mono bg-[#E8F7EE] text-[#16B45B] px-2 py-0.5 rounded">
                      AI 诊断生成完成
                    </span>
                    {isSyncedToMiniProgram && (
                      <span className="text-[10.5px] font-bold bg-[#EFF6FF] text-[#2563EB] px-2 py-0.5 rounded">
                        已同步至微信小程序
                      </span>
                    )}
                  </div>
                  <h3 className="text-[16px] font-bold text-[#0F172A] mt-1">
                    {generatedReport.studentName} · {generatedReport.subject} 阶段性智能学习诊断报告
                  </h3>
                  <p className="text-[11.5px] text-[#64748B] font-mono mt-0.5">
                    评估时间：{generatedReport.startDate} ~ {generatedReport.endDate} | 生成时间：{generatedReport.generatedAt}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsSyncedToMiniProgram(true);
                      alert(`已将【${generatedReport.studentName}】的 ${generatedReport.subject} 诊断报告同步至微信小程序与家长端订阅！`);
                    }}
                    className="px-3 py-1.5 bg-[#16B45B] text-white rounded-lg text-[12px] font-bold hover:bg-[#139B4E] cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>同步至小程序/家长端</span>
                  </button>
                </div>
              </div>

              {/* AI Summary */}
              <div className="bg-[#E8F7EE]/60 border border-[#16B45B]/20 rounded-xl p-3.5 space-y-1">
                <h4 className="font-bold text-[#0E7D3E] text-[13.5px] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#16B45B]">auto_awesome</span>
                  AI 智能学情分析与总结
                </h4>
                <p className="text-[12.5px] text-[#334155] leading-relaxed">
                  {generatedReport.aiSummary}
                </p>
              </div>

              {/* Multi-Dimensional Competency Analysis */}
              <div className="border border-[#E2E8F0] rounded-xl p-3.5 space-y-2">
                <h4 className="font-bold text-[#0F172A] text-[13px] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#2563EB] text-[17px]">radar</span>
                  学科能力维度测量得分 (百分制)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-[12px]">
                  {generatedReport.dimensions?.map((dim: any, i: number) => (
                    <div key={i} className="bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0] text-center">
                      <p className="text-[#64748B] text-[11px] font-sans">{dim.name}</p>
                      <p className="text-[16px] font-bold text-[#0F172A] mt-0.5">{dim.score}分</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-sans ${
                        dim.status === '良好' ? 'bg-[#E8F7EE] text-[#16B45B]' : dim.status === '薄弱' ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {dim.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weakness Location & Error Cause */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-[#E2E8F0] rounded-xl p-3.5 space-y-2.5">
                  <h4 className="font-bold text-[#0F172A] text-[13.5px] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#EF4444] text-[17px]">error</span>
                    薄弱考点定位与提分派案
                  </h4>
                  <div className="space-y-2 text-[12px]">
                    {generatedReport.weaknesses.map((w: any, i: number) => (
                      <div key={i} className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0] space-y-1">
                        <div className="flex justify-between font-bold">
                          <span className="text-[#0F172A]">{w.name}</span>
                          <span className="text-[#EF4444] font-mono">正确率: {w.accuracy}%</span>
                        </div>
                        <p className="text-[11.5px] text-[#16B45B] font-medium">{w.action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-[#E2E8F0] rounded-xl p-3.5 space-y-2.5">
                  <h4 className="font-bold text-[#0F172A] text-[13.5px] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#2563EB] text-[17px]">pie_chart</span>
                    丢分错因归因占比
                  </h4>
                  <div className="space-y-1.5 text-[12px]">
                    {generatedReport.errorDist.map((ed: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]">
                        <span className="font-bold text-[#0F172A]">{ed.type}</span>
                        <div className="flex items-center gap-3 font-mono text-[11.5px]">
                          <span>{ed.count} 题</span>
                          <span className="font-bold text-[#16B45B]">{ed.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

