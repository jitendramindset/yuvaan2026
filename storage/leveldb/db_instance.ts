let _db: unknown = null;

export function getDb(): unknown {
  if (!_db) {
    _db = { name: "leveldb-singleton-placeholder" };
  }
  return _db;
}
