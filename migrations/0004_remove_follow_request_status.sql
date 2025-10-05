-- Migration: Remove status column from followRequest table
-- Date: 2025-10-06
-- Description: followRequestテーブルからstatusカラムを削除します。
--              テーブルに存在するレコードはすべてpending状態として扱われます。

-- SQLiteでは ALTER TABLE DROP COLUMN が使えないため、テーブルを再作成する必要があります

-- 1. 新しいテーブルを作成
CREATE TABLE followRequest_new (
  id TEXT PRIMARY KEY,
  actor TEXT,
  object TEXT,
  activity_json TEXT
);

-- 2. データを移行
INSERT INTO followRequest_new (id, actor, object, activity_json)
SELECT id, actor, object, activity_json FROM followRequest;

-- 3. 古いテーブルを削除
DROP TABLE followRequest;

-- 4. 新しいテーブルをリネーム
ALTER TABLE followRequest_new RENAME TO followRequest;
