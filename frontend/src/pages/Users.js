import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const EMPTY = { username:'', email:'', full_name:'', password:'', department:'', is_admin: false };

export default function Users() {
  const [users, setUsers]     = useState([]);
  const [show, setShow]       = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.is_admin) { navigate('/dashboard'); return; }
    load();
  }, []); // eslint-disable-line

  const load = () => authAPI.users().then(r => setUsers(r.data)).catch(() => {});

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authAPI.register(form);
      toast.success('사용자가 생성되었습니다');
      setShow(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || '생성 실패');
    } finally { setSaving(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ padding: '24px 28px' }}>
      <div className="flex-between" style={{ marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 700 }}>사용자 관리</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 2 }}>총 {users.length}명</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShow(true)}>+ 사용자 추가</button>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr><th>사용자명</th><th>이름</th><th>이메일</th><th className="hide-mobile">부서</th><th>권한</th><th>상태</th><th className="hide-mobile">가입일</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><span className="mono">{u.username}</span></td>
                  <td style={{ fontWeight: 500 }}>{u.full_name || '—'}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{u.email}</td>
                  <td className="hide-mobile" style={{ color: 'var(--text-2)', fontSize: 12 }}>{u.department || '—'}</td>
                  <td>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: u.is_admin ? '#fde8e6' : '#e8f0fb', color: u.is_admin ? '#b03228' : '#2a5eb5' }}>
                      {u.is_admin ? '관리자' : '일반'}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: u.is_active ? '#e8f5ee' : '#f0f0f0', color: u.is_active ? '#1f7a4c' : '#5a6472' }}>
                      {u.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="hide-mobile" style={{ color: 'var(--text-3)', fontSize: 12 }}>
                    {format(new Date(u.created_at), 'yyyy.MM.dd')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {show && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShow(false)}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-hd">
              <h2>사용자 추가</h2>
              <button className="close-btn" onClick={() => setShow(false)}>✕</button>
            </div>
            <form onSubmit={create}>
              <div className="modal-bd" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">사용자명 *</label>
                    <input className="form-control" required value={form.username} onChange={e => set('username', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">이름</label>
                    <input className="form-control" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">이메일 *</label>
                  <input type="email" className="form-control" required value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">비밀번호 *</label>
                  <input type="password" className="form-control" required value={form.password} onChange={e => set('password', e.target.value)} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">부서</label>
                    <input className="form-control" value={form.department} onChange={e => set('department', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">권한</label>
                    <select className="form-control" value={form.is_admin} onChange={e => set('is_admin', e.target.value === 'true')}>
                      <option value="false">일반 사용자</option>
                      <option value="true">관리자</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-ft">
                <button type="button" className="btn btn-ghost" onClick={() => setShow(false)}>취소</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '생성 중...' : '사용자 생성'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
