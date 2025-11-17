// src/db.js
import Dexie from 'dexie';
import { TABLE_NAMES } from './constants/app';

export const db = new Dexie('flashcardsDB');

// Version 13 : Ajout du champ 'step' à la table de progression des cartes.
db.version(13).stores({
  [TABLE_NAMES.CARDS]: 'id, workspace_id, subject_id, updatedAt, isSynced, question_image, answer_image',
  [TABLE_NAMES.SUBJECTS]: 'id, workspace_id, name, isSynced',
  [TABLE_NAMES.COURSES]: 'id, workspace_id, subject_id, title, content, updatedAt, isSynced',
  [TABLE_NAMES.MEMOS]: 'id, workspace_id, course_id, is_pinned, updatedAt, isSynced',
  [TABLE_NAMES.USER_CARD_PROGRESS]:
    'id, [cardId+userId], cardId, userId, interval, easeFactor, dueDate, status, step, isSynced',
  [TABLE_NAMES.REVIEW_HISTORY]: 'id, cardId, userId, rating, reviewed_at, isSynced',
  [TABLE_NAMES.DELETIONS_PENDING]: 'id, tableName',
});
