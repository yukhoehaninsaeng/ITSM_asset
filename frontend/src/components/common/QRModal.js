import React, { useState, useEffect } from 'react';
import { qrAPI } from '../../utils/api';
import toast from 'react-hot-toast';

export default function QRModal({ asset, onClose }) {
  const [qrUrl, setQrUrl]     = useState(null);
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const [loading, setLoading] = useState(false);

  const generate = async (url) => {
    setLoading(true);
    try {
      const res = await qrAPI.generate(asset.asset_number, url);
      if (qrUrl) URL.revokeObjectURL(qrUrl);
      setQrUrl(URL.createObjectURL(res.data));
    } catch { toast.error('QR 코드 생성 실패'); }
    finally { setLoading(false); }
  };

  useEffect(() => { generate(baseUrl); }, []); // eslint-disable-line

  const download = () => { const a = document.createElement('a'); a.href=qrUrl; a.download=`QR_${asset.asset_number}.png`; a.click(); };

  const print = () => {
    const w = window.open('');
    w.document.write(`<html><head><title>QR - ${asset.asset_number}</title><style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;padding:40px}img{width:260px;height:260px}h2{margin:16px 0 4px;font-size:17px}p{color:#666;font-size:12px;margin:2px 0}</style></head><body><img src="${qrUrl}"/><h2>${asset.name}</h2><p>${asset.asset_number}</p><p>${asset.location||''}</p><script>window.onload=()=>{window.print();window.close();}<\/script></body></html>`);
    w.document.close();
  };

  return (
    <div className="overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:400 }}>
        <div className="modal-hd"><h2>QR 코드</h2><button className="close-btn" onClick={onClose}>✕</button></div>
        <div className="modal-bd" style={{ textAlign:'center' }}>
          <div style={{ fontWeight:600, fontSize:15, marginBottom:2 }}>{asset.name}</div>
          <span className="mono" style={{ color:'var(--text-3)' }}>{asset.asset_number}</span>
          <div style={{ margin:'18px auto', display:'inline-block', padding:14, border:'1px solid var(--border)', borderRadius:12, background:'#fff', boxShadow:'var(--shadow-sm)' }}>
            {loading ? (
              <div style={{ width:220, height:220, background:'#f0f2f4', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-3)' }}>생성 중...</div>
            ) : qrUrl ? (
              <img src={qrUrl} alt="QR" style={{ width:220, height:220, display:'block' }} />
            ) : null}
          </div>
          <div className="form-group" style={{ textAlign:'left', marginBottom:4 }}>
            <label className="form-label">스캔 시 이동 도메인</label>
            <div style={{ display:'flex', gap:6 }}>
              <input className="form-control" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://your-app.vercel.app" />
              <button className="btn btn-ghost btn-sm" style={{ flexShrink:0 }} onClick={() => generate(baseUrl)}>재생성</button>
            </div>
          </div>
          <p style={{ fontSize:11, color:'var(--text-3)', textAlign:'left', marginTop:4 }}>스캔 URL: {baseUrl}/scan/{asset.asset_number}</p>
        </div>
        <div className="modal-ft">
          <button className="btn btn-ghost" onClick={onClose}>닫기</button>
          <button className="btn btn-ghost" onClick={print} disabled={!qrUrl}>🖨 인쇄</button>
          <button className="btn btn-primary" onClick={download} disabled={!qrUrl}>⬇ 다운로드</button>
        </div>
      </div>
    </div>
  );
}
