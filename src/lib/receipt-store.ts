import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface ReceiptRecord {
  fingerprint: string;
  storeName: string;
  businessNumber: string;
  approvalNumber: string;
  transactionDate: string;
  totalAmount: number;
  registeredAt: string;
}

const STORAGE_FILE = path.join(process.cwd(), 'src', 'lib', 'verified-receipts-db.json');

// 인메모리 캐시
let cachedRecords: Map<string, ReceiptRecord> | null = null;

function loadRecords(): Map<string, ReceiptRecord> {
  if (cachedRecords) return cachedRecords;
  cachedRecords = new Map();

  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const data: ReceiptRecord[] = JSON.parse(raw);
      data.forEach((r) => cachedRecords?.set(r.fingerprint, r));
    }
  } catch (err) {
    console.warn('[ReceiptStore] Failed to read db file:', err);
  }

  return cachedRecords;
}

function persistRecords() {
  if (!cachedRecords) return;
  try {
    const list = Array.from(cachedRecords.values());
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[ReceiptStore] Failed to write db file:', err);
  }
}

/**
 * 2번: 영수증 고유 지문(Fingerprint) 생성
 * 사업자등록번호 + 결제일시 + 승인번호 + 결제금액을 결합하여 유일한 해시값 생성
 */
export function computeReceiptFingerprint(params: {
  businessNumber?: string;
  approvalNumber?: string;
  transactionDate?: string;
  totalAmount?: number;
  storeName?: string;
}): string {
  const biz = (params.businessNumber || '').replace(/[^0-9]/g, '');
  const auth = (params.approvalNumber || '').replace(/[^0-9a-zA-Z]/g, '');
  const date = (params.transactionDate || '').slice(0, 10);
  const amount = params.totalAmount || 0;
  const store = (params.storeName || '').trim();

  const seed = `BIZ:${biz}|AUTH:${auth}|DATE:${date}|AMT:${amount}|STORE:${store}`;
  return crypto.createHash('sha256').update(seed).digest('hex').slice(0, 24);
}

/**
 * 중복 제출 여부 확인 (재탕 방지 필터)
 */
export function checkReceiptDuplicate(fingerprint: string): {
  isDuplicate: boolean;
  existingRecord?: ReceiptRecord;
} {
  const records = loadRecords();
  const existing = records.get(fingerprint);
  if (existing) {
    return { isDuplicate: true, existingRecord: existing };
  }
  return { isDuplicate: false };
}

/**
 * 영수증 승인 시 고유 지문 등록
 */
export function registerReceiptFingerprint(params: {
  fingerprint: string;
  storeName: string;
  businessNumber: string;
  approvalNumber: string;
  transactionDate: string;
  totalAmount: number;
}): ReceiptRecord {
  const records = loadRecords();
  const newRecord: ReceiptRecord = {
    fingerprint: params.fingerprint,
    storeName: params.storeName,
    businessNumber: params.businessNumber,
    approvalNumber: params.approvalNumber,
    transactionDate: params.transactionDate,
    totalAmount: params.totalAmount,
    registeredAt: new Date().toISOString(),
  };

  records.set(params.fingerprint, newRecord);
  persistRecords();
  return newRecord;
}
