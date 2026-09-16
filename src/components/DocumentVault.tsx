import React, { useRef, useState } from 'react';
import { useAppStore } from '@/store/AppContext';
import { useAuth } from '@/store/AuthContext';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/Modal';
import { FileText, Upload, Trash2, Eye, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DocumentRecord } from '@/types';

interface DocumentVaultProps {
  moduleType: string;
  accentClass?: string;
}

const DocumentVault: React.FC<DocumentVaultProps> = ({ moduleType, accentClass = 'bg-blue-50 text-blue-700 border-blue-100' }) => {
  const documents = useAppStore(s => s.documents);
  const addDocument = useAppStore(s => s.addDocument);
  const deleteDocument = useAppStore(s => s.deleteDocument);
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<DocumentRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const moduleDocs = documents.filter(d => d.module_type === moduleType);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) { setError('File too large (max 10 MB).'); return; }
    setUploading(true);
    setError(null);
    try {
      const ext = file.name.split('.').pop() || '';
      const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('documents').upload(filePath, file, { contentType: file.type });
      if (upErr) throw upErr;
      const doc: DocumentRecord = {
        id: crypto.randomUUID(),
        module_type: moduleType,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        created_at: new Date().toISOString(),
      };
      addDocument(doc);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const openPreview = async (doc: DocumentRecord) => {
    setPreview(doc);
    setPreviewUrl(null);
    try {
      const { data } = await supabase.storage.from('documents').createSignedUrl(doc.file_path, 3600);
      if (data) setPreviewUrl(data.signedUrl);
    } catch { /* offline */ }
  };

  const downloadFile = async (doc: DocumentRecord) => {
    try {
      const { data } = await supabase.storage.from('documents').createSignedUrl(doc.file_path, 3600);
      if (data) {
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = doc.file_name;
        a.click();
      }
    } catch { /* offline */ }
  };

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (type: string | null) => type?.startsWith('image/') ?? false;

  return (
    <>
      <div className={`rounded-2xl p-4 border ${accentClass}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <FileText size={16} /> Document Vault
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 text-xs font-semibold bg-white/60 px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform disabled:opacity-50"
          >
            <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*,application/pdf,.doc,.docx,.txt" onChange={handleUpload} className="hidden" />

        {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}

        {moduleDocs.length > 0 ? (
          <div className="mt-3 space-y-2">
            {moduleDocs.map(doc => (
              <div key={doc.id} className="flex items-center gap-2 bg-white/50 rounded-lg px-3 py-2">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                  {isImage(doc.file_type) ? <Eye size={14} /> : <FileText size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{doc.file_name}</p>
                  <p className="text-[10px] text-slate-500">{fmtSize(doc.file_size)}</p>
                </div>
                <button onClick={() => openPreview(doc)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700"><Eye size={14} /></button>
                <button onClick={() => downloadFile(doc)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700"><Download size={14} /></button>
                <button onClick={() => deleteDocument(doc.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs mt-1 opacity-70">Upload receipts, statements, and agreements securely.</p>
        )}
      </div>

      <Modal open={preview !== null} onClose={() => { setPreview(null); setPreviewUrl(null); }} title={preview?.file_name ?? 'Preview'}>
        {preview && (
          <div className="space-y-3">
            {previewUrl ? (
              isImage(preview.file_type) ? (
                <img src={previewUrl} alt={preview.file_name} className="w-full rounded-xl" />
              ) : preview.file_type === 'application/pdf' ? (
                <iframe src={previewUrl} title={preview.file_name} className="w-full h-[60vh] rounded-xl border border-slate-200" />
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  Preview not available for this file type.
                  <button onClick={() => downloadFile(preview)} className="block mx-auto mt-3 text-blue-600 font-semibold">Download instead</button>
                </div>
              )
            ) : (
              <div className="text-center py-8"><div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto" /></div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default DocumentVault;
