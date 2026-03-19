import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirect = location.state?.redirect || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate(redirect);
    } catch (err) {
      toast.error(err.response?.data?.error || '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #111e1f 0%, #1a292b 40%, #233535 100%)',
    }}>
      {/* Brand panel */}
      <div className="hide-mobile" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 64px', color: '#fff',
      }}>
        <div style={{ maxWidth: 420 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--accent)', borderRadius: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 32,
          }}>A</div>
          <h1 style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.15, marginBottom: 14 }}>
            AssetFlow<br />
            <span style={{ color: 'var(--accent)', fontWeight: 300, fontSize: 32 }}>자산관리 시스템</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 15, lineHeight: 1.75, marginBottom: 40 }}>
            QR 코드 기반 스마트 자산관리.<br />
            등록, 추적, 관리를 한 곳에서.
          </p>
          {[
            ['◫', 'QR 스캔으로 즉시 자산 조회 및 등록'],
            ['▦', '실시간 대시보드로 현황 파악'],
            ['⊞', '부서별 이력 및 스캔 로그 관리'],
          ].map(([ic, txt]) => (
            <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, background: 'rgba(129,181,161,.15)', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: 'var(--accent)', flexShrink: 0,
              }}>{ic}</div>
              <span style={{ color: 'rgba(255,255,255,.65)', fontSize: 14 }}>{txt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div style={{
        width: 420, background: '#fff', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '56px 44px',
      }} className="login-form">
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>로그인</h2>
        <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 28 }}>계정 정보를 입력하세요</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">사용자명</label>
            <input className="form-control" autoFocus required
              value={form.username} placeholder="admin"
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input type="password" className="form-control" required
              value={form.password} placeholder="••••••••"
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ marginTop: 6, padding: '12px', fontSize: 14, justifyContent: 'center' }}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div style={{ marginTop: 28, padding: 14, background: '#f7f9fb', borderRadius: 8, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.8 }}>
          <strong style={{ color: 'var(--text-2)' }}>데모 계정</strong><br />
          관리자: <code>admin</code> / <code>admin1234</code><br />
          일반: <code>jdoe</code> / <code>user1234</code>
        </div>
      </div>

      <style>{`@media(max-width:768px){.login-form{width:100%!important;padding:40px 24px!important;}}`}</style>
    </div>
  );
}
