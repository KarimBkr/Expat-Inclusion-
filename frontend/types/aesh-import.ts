export interface AeshImportedRow {
  row: number;
  email: string;
  user_id: number;
}

export interface AeshImportErrorRow {
  row: number;
  errors: string[];
}

export interface AeshImportReport {
  message: string;
  imported: AeshImportedRow[];
  errors: AeshImportErrorRow[];
}
