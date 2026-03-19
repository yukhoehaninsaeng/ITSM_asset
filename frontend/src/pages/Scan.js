import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { qrAPI, assetsAPI } from '../utils/api';
import toast from 'react-hot-toast';

const SB = { 'In Use':'badge badge-in-use','In Stock':'badge badge-in-stock','Maintenance':'badge badge-maintenance','Retired':'badge badge-retired','Lost':'badge badge-lost' };
const SL = { 'In Use':'사용 중','In Stock':'재고','Maintenance':'유지보수','Retired':'폐기','Lost':'분실' };

export default function Scan() {
  const [scanning, setScanning] = useState(false);
  const [manual, setManual]     = useState('');
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const scannerRef = useRef(null);
  const navigate   = useNavigate();

  useEffect(() => () => stopScanner(), []);

  const stopScanner = () => {
    if (scannerRef.current) { scannerRef.current.clear().catch(() => {}); scannerRef.current = null; }
    setScanning(false);
  };

  const startScanner = () => {
    setScanning(true); setResult(null);
    setTimeout(() => {
      const s = new Html5QrcodeScanner('qr-reader', { fps:10, qrbox:{ width:240, height:240 }, supportedScanTypes:[Html5QrcodeScanType.SCAN_TYPE_CAMERA], rememberLastUsedCamera:true }, false);
      s.render(async (text) => { s.clear().catch(()=>{}); setScanning(false); await lookup(extractNum(text)); }, () => {});
      scannerRef.current = s;
    }, 100);
  };

  const extractNum = (url) => { const m = url.match(/\/scan\/([^/?#\s]+)/); return m ? m[1] : url.trim(); };

  const lookup = async (num) => {
    if (!num) return;
    setLoading(true);
    try {
      const { data } = await qrAPI.info(num);
      setResult(data);
    } catch (err) {
      if (err.response?.status === 404) setResult({ found:false, asset_number:num });
      else toast.error('조회 중 오류가 발생했습니다');
    } finally { setLoading(false); }
  };

  const recordScan = async () => {
    if (!result?.found) return;
    try {
      await assetsAPI.recordScan(result.asset_number, { action:'현황 확인', location:result.location||'', notes:'QR 스캔으로 현황 확인' });
      toast.success('스캔 기록이 저장되었습니다');
      navigate(`/assets/${result.asset_number}`);
    } catch { toast.error('기록 저장 실패'); }
  };

  return (
    <div style={{ padding:'24px 28px', maxWidth:600, margin:'0 auto' }}>
      <div style={{ marginBottom:22 }}><h1 style={{ fontSize:21, fontWeight:700 }}>QR 스캔</h1><p style={{ color:'var(--text-2)', fontSize:13, marginTop:2 }}>카메라로 스캔하거나 자산번호를 직접 입력하세요</p></div>
      <div className="card" style={{ marginBottom:14 }}>
        <div className="card-header"><span className="card-title">카메라 스캔</span></div>
        <div className="card-body">
          {!scanning ? (
            <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:13, fontSize:14 }} onClick={startScanner}>📷 카메라 스캔 시작</button>
          ) : (
            <><div id="qr-reader" /><button className="btn btn-ghost" style={{ width:'100%', marginTop:10, justifyContent:'center' }} onClick={stopScanner}>스캔 중지</button></>
          )}
        </div>
      </div>
      <div className="card" style={{ marginBottom:14 }}>
        <div className="card-header"><span className="card-title">수동 입력</span></div>
        <div className="card-body">
          <form onSubmit={e => { e.preventDefault(); lookup(manual); }} style={{ display:'flex', gap:8 }}>
            <input className="form-control" placeholder="AST-0001" value={manual} onChange={e => setManual(e.target.value)} style={{ flex:1 }} />
            <button type="submit" className="btn btn-primary" disabled={loading||!manual}>{loading ? '...' : '조회'}</button>
          </form>
        </div>
      </div>
      {result && (
        <div className="card" style={{ borderLeft:`4px solid ${result.found?'var(--success)':'var(--danger)'}` }}>
          <div className="card-header"><span className="card-title">{result.found ? '✅ 자산 확인됨' : '❌ 미등록 자산'}</span></div>
          <div className="card-body">
            {result.found ? (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 24px', marginBottom:18 }}>
                  {[['자산번호',<span className="mono">{result.asset_number}</span>],['자산명',result.name],['상태',<span className={SB[result.status]}>{SL[result.status]||result.status}</span>],['카테고리',result.category],['위치',result.location||'—'],['부서',result.department||'—']].map(([label,val]) => (
                    <div key={label}><div style={{ fontSize:11, color:'var(--text-3)', marginBottom:2, textTransform:'uppercase', letterSpacing:'.04em' }}>{label}</div><div style={{ fontSize:14, fontWeight:500 }}>{val}</div></div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-primary" style={{ flex:1, justifyContent:'center' }} onClick={recordScan}>현황 확인 기록</button>
                  <button className="btn btn-ghost" onClick={() => navigate(`/assets/${result.asset_number}`)}>상세 보기</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign:'center', padding:'8px 0' }}>
                <div style={{ fontSize:40, marginBottom:8 }}>⊘</div>
                <p style={{ color:'var(--text-2)' }}><strong>{result.asset_number}</strong>은 등록되지 않은 자산입니다</p>
                <button className="btn btn-primary" style={{ marginTop:14 }} onClick={() => navigate('/assets')}>자산 등록하기</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
