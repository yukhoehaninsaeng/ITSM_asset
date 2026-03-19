import React, { useState, useEffect } from 'react';
import { assetsAPI, authAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const STATUSES   = [['In Use','사용 중'],['In Stock','재고'],['Maintenance','유지보수'],['Retired','폐기'],['Lost','분실']];
const CATEGORIES = [['Hardware','하드웨어'],['Software','소프트웨어'],['Network','네트워크'],['Peripheral','주변기기'],['Furniture','가구'],['Vehicle','차량'],['Other','기타']];
const EMPTY = { asset_number:'',name:'',description:'',category:'Hardware',status:'In Stock',manufacturer:'',model:'',serial_number:'',purchase_date:'',warranty_expiry:'',location:'',department:'',assigned_to:'',notes:'' };

export default function AssetModal({ asset, onClose, onSave }) {
  const isEdit = !!asset;
  const [form, setForm]   = useState(EMPTY);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authAPI.users().then(r => setUsers(r.data)).catch(() => {});
    if (asset) setForm({ ...EMPTY, ...asset,
      purchase_date:   asset.purchase_date   ? asset.purchase_date.split('T')[0]   : '',
      warranty_expiry: asset.warranty_expiry ? asset.warranty_expiry.split('T')[0] : '',
      assigned_to: asset.assigned_to || '',
    });
  }, [asset]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const body = { ...form };
      if (!body.purchase_date)   delete body.purchase_date;
      if (!body.warranty_expiry) delete body.warranty_expiry;
      if (!body.assigned_to)     body.assigned_to = null;
      if (isEdit) { await assetsAPI.update(asset.asset_number, body); toast.success('수정되었습니다'); }
      else        { await assetsAPI.create(body); toast.success('자산이 등록되었습니다'); }
      onSave();
    } catch (err) { toast.error(err.response?.data?.error || '저장 실패'); }
    finally { setSaving(false); }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hd"><h2>{isEdit ? '자산 수정' : '자산 등록'}</h2><button className="close-btn" onClick={onClose}>✕</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-bd" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">자산번호 *</label><input className="form-control" required value={form.asset_number} onChange={e => set('asset_number',e.target.value)} placeholder="AST-0001" disabled={isEdit} /></div>
              <div className="form-group"><label className="form-label">자산명 *</label><input className="form-control" required value={form.name} onChange={e => set('name',e.target.value)} placeholder="Dell XPS 15" /></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">카테고리</label><select className="form-control" value={form.category} onChange={e => set('category',e.target.value)}>{CATEGORIES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
              <div className="form-group"><label className="form-label">상태</label><select className="form-control" value={form.status} onChange={e => set('status',e.target.value)}>{STATUSES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">제조사</label><input className="form-control" value={form.manufacturer} onChange={e => set('manufacturer',e.target.value)} placeholder="Dell" /></div>
              <div className="form-group"><label className="form-label">모델</label><input className="form-control" value={form.model} onChange={e => set('model',e.target.value)} placeholder="XPS 15 9530" /></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">시리얼 번호</label><input className="form-control" value={form.serial_number} onChange={e => set('serial_number',e.target.value)} placeholder="SN-XXXX" /></div>
              <div className="form-group"><label className="form-label">담당자</label><select className="form-control" value={form.assigned_to} onChange={e => set('assigned_to',e.target.value)}><option value="">미배정</option>{users.map(u => <option key={u.id} value={u.id}>{u.full_name||u.username} ({u.department||'—'})</option>)}</select></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">위치</label><input className="form-control" value={form.location} onChange={e => set('location',e.target.value)} placeholder="서울 본사 3층" /></div>
              <div className="form-group"><label className="form-label">부서</label><input className="form-control" value={form.department} onChange={e => set('department',e.target.value)} placeholder="개발팀" /></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">구매일</label><input type="date" className="form-control" value={form.purchase_date} onChange={e => set('purchase_date',e.target.value)} /></div>
              <div className="form-group"><label className="form-label">보증 만료일</label><input type="date" className="form-control" value={form.warranty_expiry} onChange={e => set('warranty_expiry',e.target.value)} /></div>
            </div>
            <div className="form-group"><label className="form-label">설명</label><textarea className="form-control" value={form.description} onChange={e => set('description',e.target.value)} placeholder="자산에 대한 설명..." /></div>
            <div className="form-group"><label className="form-label">비고</label><textarea className="form-control" style={{ minHeight:60 }} value={form.notes} onChange={e => set('notes',e.target.value)} placeholder="추가 메모..." /></div>
          </div>
          <div className="modal-ft">
            <button type="button" className="btn btn-ghost" onClick={onClose}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '저장 중...' : isEdit ? '수정 저장' : '자산 등록'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
