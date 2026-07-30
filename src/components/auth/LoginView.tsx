import React, { useState } from 'react';
import { Institution, CurrentUser } from '../../types';

interface LoginViewProps {
  institutions: Institution[];
  onLogin: (user: CurrentUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ institutions, onLogin }) => {
  const [username, setUsername] = useState('admin@kaiqiao.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('请输入账号和密码');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      const trimmedUser = username.trim();

      // Check if matches an institution admin account
      const matchedInst = institutions.find(
        (i) =>
          i.adminAccount.toLowerCase() === trimmedUser.toLowerCase() ||
          (i.adminAccount && trimmedUser.toLowerCase().includes(i.code.toLowerCase()))
      );

      if (matchedInst) {
        onLogin({
          id: `INST-USER-${matchedInst.id}`,
          name: `${matchedInst.contactPerson} (${matchedInst.name})`,
          username: trimmedUser,
          role: 'institution_admin',
          institutionId: matchedInst.id,
          institutionName: matchedInst.name,
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCqF43kaxcc8_tFNcaYZUIKb_f3cZldDs5DlPffbW65W6Vv9hQwKyfYKwR-67wWTW77xfEJ3qgt41UNSheunoAWYSSfOqUT-dtyfZ7rhUVNrypClVDfaKjROfDFvDlzTtmsGG1yMRbdH_a5LtikWHMNDxFKu6KVjfGm9Y8ljuDI5iSajkGrb_2OoSarrwvIDtwj4j9lZR4pJwJyk-QjVOhrYr1HwsDCmhXnwrxYcBEQIkN5orT-rIfAw',
        });
      } else {
        // Super admin mode default
        onLogin({
          id: 'SUPER-ADMIN-01',
          name: '超级管理员',
          username: trimmedUser,
          role: 'super_admin',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwlJFf3rqYCHQdGUbnzIm6htn5M-2U5UiKb459aOQBJZvMuZadgZxKxWGD5YbBBg6370sr5V74N-b2qzfAeSrnCP22zzyr2NEz3RrTPirjEeoWwklqs6s4SkmZPOvC-cY_mtwVSC5EEC7qACcVVDAKRIBJDJIgARRv_ri26MDjLr-j3vbdqOd3kx0JaWD-qvv-sec8CoFp4G4E--g3DlodqLGt-PcEwzv9dbFgGrFVC-mMipoUSUs17A',
        });
      }
    }, 400);
  };

  const handleFillPreset = (user: string, pass: string = '123456') => {
    setUsername(user);
    setPassword(pass);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex items-center justify-center p-6 lg:p-12 relative overflow-hidden font-sans selection:bg-[#16B45B]/20">
      {/* Background Soft Glow Circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#16B45B]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#0E7D3E]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Language / Header Top Bar */}
      <div className="absolute top-6 right-8 text-[12px] font-medium text-[#64748B] flex items-center gap-1">
        <span>简体中文</span>
        <span className="material-symbols-outlined text-[16px]">language</span>
      </div>

      {/* Main Container Grid */}
      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side Graphic Banner */}
        <div className="hidden lg:block lg:col-span-7 pr-6 relative">
          {/* Main Hero Copy */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-[#16B45B] via-[#10B981] to-[#34D399] flex items-center justify-center text-white font-extrabold text-[18px] shadow-md">
                Q
              </div>
              <span className="text-[22px] font-extrabold text-[#0F172A] tracking-tight">
                开窍 AI
              </span>
            </div>
            <h1 className="text-[36px] font-extrabold text-[#0F172A] leading-tight tracking-tight mb-3">
              搭积木一样 <br />
              快速构建你的智能教育系统
            </h1>
            <div className="flex items-center gap-4 text-[13px] font-bold text-[#334155]">
              <span className="flex items-center gap-1.5 bg-white/70 backdrop-blur-xs px-3 py-1 rounded-full border border-white/80 shadow-2xs">
                <span className="w-4 h-4 rounded-full bg-[#16B45B] text-white flex items-center justify-center text-[10px]">✓</span>
                智能 AI 诊评
              </span>
              <span className="flex items-center gap-1.5 bg-white/70 backdrop-blur-xs px-3 py-1 rounded-full border border-white/80 shadow-2xs">
                <span className="w-4 h-4 rounded-full bg-[#16B45B] text-white flex items-center justify-center text-[10px]">✓</span>
                多维额度管控
              </span>
              <span className="flex items-center gap-1.5 bg-white/70 backdrop-blur-xs px-3 py-1 rounded-full border border-white/80 shadow-2xs">
                <span className="w-4 h-4 rounded-full bg-[#16B45B] text-white flex items-center justify-center text-[10px]">✓</span>
                即建即用
              </span>
            </div>
          </div>

          {/* Layered UI Mockup Cards */}
          <div className="relative w-full h-[320px]">
            {/* Back Card 1 */}
            <div className="absolute top-0 left-0 w-[240px] bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-white/80 shadow-lg transform -rotate-3 hover:rotate-0 transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56]"></span>
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E]"></span>
                <span className="w-3 h-3 rounded-full bg-[#27C93F]"></span>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-[#E2E8F0] rounded-full w-3/4"></div>
                <div className="h-3 bg-[#F1F5F9] rounded-full w-1/2"></div>
                <div className="h-8 bg-[#E8F7EE] rounded-lg border border-[#16B45B]/20 mt-3 flex items-center px-3 text-[11px] font-bold text-[#0E7D3E]">
                  机构考点分析模块
                </div>
              </div>
            </div>

            {/* Back Card 2 - Pie Chart Card */}
            <div className="absolute bottom-4 left-6 w-[220px] bg-white rounded-2xl p-4 border border-white shadow-xl z-10 transform hover:scale-105 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#64748B]">学科正确率占比</span>
                <span className="w-2 h-2 rounded-full bg-[#16B45B]"></span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full border-4 border-[#16B45B] border-t-[#F5B700] border-r-[#10B981] flex items-center justify-center text-[10px] font-bold text-[#0F172A]">
                  86%
                </div>
                <div className="space-y-1 text-[10px] text-[#64748B]">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#16B45B]"></span>
                    <span>数学 (88%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#F5B700]"></span>
                    <span>物理 (82%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Front Card 3 - Main Central Panel */}
            <div className="absolute top-8 right-4 w-[280px] bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-white shadow-2xl z-20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#16B45B] text-white flex items-center justify-center font-bold text-[12px]">
                    AI
                  </div>
                  <span className="text-[13px] font-bold text-[#0F172A]">学情大屏协同</span>
                </div>
                <span className="px-2 py-0.5 bg-[#E8F7EE] text-[#0E7D3E] text-[10px] font-bold rounded-full">
                  实时同步
                </span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#64748B]">浙江大学附属中学</span>
                  <span className="font-mono text-[#16B45B] font-bold">75.4% 额度</span>
                </div>
                <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#16B45B] h-full w-[75%] rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Floating Plus Button graphic */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full border border-[#E2E8F0] shadow-xl flex items-center justify-center z-30 animate-bounce">
              <span className="material-symbols-outlined text-[#16B45B] text-[24px]">add</span>
            </div>
          </div>
        </div>

        {/* Right Side Login Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-[400px] bg-white rounded-[24px] border border-white shadow-xl p-8 sm:p-9 relative">
            {/* Top Logo */}
            <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-[#16B45B] via-[#10B981] to-[#34D399] flex items-center justify-center text-white font-black text-[22px] shadow-md mb-6">
              Q
            </div>

            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-[26px] font-extrabold text-[#0F172A] tracking-tight">
                登录
              </h2>
              <p className="text-[12.5px] text-[#94A3B8] mt-1">
                欢迎使用开窍 AI 学伴管理平台
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-[#991B1B] text-[12px] font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#DC2626]">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入手机号 / 账号"
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-[13.5px] text-[#0F172A] placeholder-[#94A3B8] bg-[#F8FAFC] focus:bg-white outline-none focus:border-[#16B45B] focus:ring-2 focus:ring-[#16B45B]/15 transition-all"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 pr-10 text-[13.5px] text-[#0F172A] placeholder-[#94A3B8] bg-[#F8FAFC] focus:bg-white outline-none focus:border-[#16B45B] focus:ring-2 focus:ring-[#16B45B]/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[12px] pt-1">
                <label className="flex items-center gap-1.5 text-[#64748B] cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#16B45B] rounded" />
                  <span>记住状态</span>
                </label>
                <span className="text-[#16B45B] font-medium hover:underline cursor-pointer">
                  忘记密码
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#16B45B] hover:bg-[#139B4E] text-white font-bold rounded-xl text-[15px] shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>正在登录...</span>
                  </>
                ) : (
                  <span>登录</span>
                )}
              </button>
            </form>

            {/* Quick Demo Preset Credentials */}
            <div className="mt-6 pt-5 border-t border-[#E2E8F0]/80">
              <p className="text-[11.5px] font-bold text-[#64748B] mb-2 flex items-center justify-between">
                <span>快捷填充测试账号：</span>
                <span className="text-[10px] text-[#94A3B8] font-mono">密码统一: 123456</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleFillPreset('admin@kaiqiao.com', '123456')}
                  className="px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#16B45B] hover:text-white text-[#334155] rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                >
                  超级管理员 (admin)
                </button>
                <button
                  type="button"
                  onClick={() => handleFillPreset('admin_zjdfz', '123456')}
                  className="px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#16B45B] hover:text-white text-[#334155] rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                >
                  浙大附中 (admin_zjdfz)
                </button>
                <button
                  type="button"
                  onClick={() => handleFillPreset('admin_bjsy', '123456')}
                  className="px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#16B45B] hover:text-white text-[#334155] rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                >
                  北京十一学校 (admin_bjsy)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

