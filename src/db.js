// src/db.js
import Dexie from 'dexie';
import { TABLE_NAMES } from './constants/app';

export const db = new Dexie('flashcardsDB');

// Version 10 : Ajout de la table review_history
db.version(10).stores({
  [TABLE_NAMES.CARDS]: 'id, workspace_id, subject_id, updatedAt, isSynced, question_image, answer_image',
  [TABLE_NAMES.SUBJECTS]: 'id, workspace_id, name, isSynced',
  [TABLE_NAMES.COURSES]: 'id, workspace_id, subject_id, title, content, updatedAt, isSynced',
  [TABLE_NAMES.MEMOS]: 'id, workspace_id, course_id, is_pinned, updatedAt, isSynced',
  [TABLE_NAMES.USER_CARD_PROGRESS]:
    'id, [cardId+userId], cardId, userId, interval, easeFactor, dueDate, status, isSynced',
  [TABLE_NAMES.REVIEW_HISTORY]: 'id, [userId+reviewedAt], cardId, rating, isSynced',
  [TABLE_NAMES.DELETIONS_PENDING]: 'id, tableName',
});

