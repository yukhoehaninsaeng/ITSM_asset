import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/dashboard', icon: '▦', label: '대시보드' },
  { to: '/assets',    icon: '⊞', label: '자산 목록' },
  { to: '/scan',      icon: '◫', label: 'QR 스캔' },
];

const navStyle = (active) => ({
  display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
  borderRadius:6, marginBottom:2, textDecoration:'none', fontSize:13, fontWeight:500,
  color: active ? '#fff' : 'rgba(255,255,255,.55)',
  background: active ? 'rgba(255,255,255,.13)' : 'transparent', transition:'all .15s',
});

function SidebarContent({ onNav, user, onLogout }) {
  return (
    <>
      <div style={{ padding:'18px 16px 12px', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, background:'var(--accent)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, color:'#fff', flexShrink:0 }}>A</div>
          <div>
            <div style={{ color:'#fff', fontWeight:700, fontSize:14, lineHeight:1.2 }}>AssetFlow</div>
            <div style={{ color:'rgba(255,255,255,.38)', fontSize:11 }}>자산관리 시스템</div>
          </div>
        </div>
      </div>
      <nav style={{ flex:1, padding:'10px 8px' }}>
        <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'rgba(255,255,255,.3)', padding:'0 8px 6px' }}>메뉴</div>
        {NAV.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} onClick={onNav} style={({ isActive }) => navStyle(isActive)}>
            <span style={{ fontSize:16, width:20, textAlign:'center' }}>{icon}</span>{label}
          </NavLink>
        ))}
        {user?.is_admin && (
          <>
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'rgba(255,255,255,.3)', padding:'14px 8px 6px' }}>관리자</div>
            <NavLink to="/users" onClick={onNav} style={({ isActive }) => navStyle(isActive)}>
              <span style={{ fontSize:16, width:20, textAlign:'center' }}>◎</span>사용자 관리
            </NavLink>
          </>
        )}
      </nav>
      <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:10 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, color:'#fff', flexShrink:0 }}>
            {(user?.full_name || user?.username || '?')[0].toUpperCase()}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ color:'#fff', fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.full_name || user?.username}</div>
            <div style={{ color:'rgba(255,255,255,.38)', fontSize:11 }}>{user?.is_admin ? '관리자' : (user?.department || '사용자')}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ width:'100%', padding:'7px', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:6, color:'rgba(255,255,255,.55)', cursor:'pointer', fontSize:12, fontFamily:'inherit', transition:'all .15s' }}>로그아웃</button>
      </div>
    </>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const handleLogout = () => { logout(); navigate('/login'); };
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <aside style={{ width:'var(--sidebar-w)', background:'var(--sidebar-bg)', flexShrink:0, display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, zIndex:100 }} className="desktop-sidebar">
        <SidebarContent onNav={() => {}} user={user} onLogout={handleLogout} />
      </aside>
      <header style={{ display:'none', position:'fixed', top:0, left:0, right:0, height:56, background:'var(--sidebar-bg)', zIndex:200, alignItems:'center', padding:'0 16px', gap:12 }} className="mobile-topbar">
        <button onClick={() => setOpen(v => !v)} style={{ background:'none', border:'none', color:'#fff', fontSize:22, cursor:'pointer' }}>☰</button>
        <span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>AssetFlow</span>
      </header>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:300 }} />
          <aside style={{ position:'fixed', top:0, left:0, bottom:0, width:260, background:'var(--sidebar-bg)', zIndex:400, display:'flex', flexDirection:'column' }}>
            <SidebarContent onNav={() => setOpen(false)} user={user} onLogout={handleLogout} />
          </aside>
        </>
      )}
      <main style={{ flex:1, marginLeft:'var(--sidebar-w)', minHeight:'100vh', display:'flex', flexDirection:'column' }}>{children}</main>
      <style>{`@media(min-width:769px){.mobile-topbar{display:none!important}.desktop-sidebar{display:flex!important}}@media(max-width:768px){.desktop-sidebar{display:none!important}.mobile-topbar{display:flex!important}main{margin-left:0!important;padding-top:56px}}`}</style>
    </div>
  );
}
