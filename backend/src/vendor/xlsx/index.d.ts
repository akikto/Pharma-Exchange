declare const XLSX: {
  read: (data: Buffer, opts?: Record<string, unknown>) => {
    SheetNames: string[];
    Sheets: Record<string, unknown>;
  };
  utils: {
    sheet_to_json: <T>(sheet: unknown, opts?: Record<string, unknown>) => T;
    json_to_sheet: (data: Record<string, unknown>[]) => unknown;
    book_new: () => unknown;
    book_append_sheet: (book: unknown, sheet: unknown, name: string) => void;
    sheet_to_csv: (sheet: unknown) => string;
  };
  write: (book: unknown, opts: { type: string; bookType: string }) => Buffer;
};

export default XLSX;
