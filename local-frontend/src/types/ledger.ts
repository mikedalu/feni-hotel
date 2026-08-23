export interface LedgerLine {
  id: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
}

export interface LedgerEntry {
  id: string;
  entryType: string;
  referenceId: string;
  processedByUsername: string | null;
  createdAt: string;
  lines: LedgerLine[];
}
