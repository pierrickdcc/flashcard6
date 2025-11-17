import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import toast from 'react-hot-toast';
import { DEFAULT_SUBJECT, TABLE_NAMES, LOCAL_STORAGE_KEYS } from '../constants/app';
import { calculateSrsData } from '../utils/spacedRepetition';
import { useAuth } from './AuthContext';
import { useUIState } from './UIStateContext';

const DataSyncContext = createContext();

export const DataSyncProvider = ({ children }) => {
  const { session, workspaceId, isConfigured } = useAuth();
  const { setReviewMode, setIsCramMode, setReviewCards, isCramMode } = useUIState();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const cards = useLiveQuery(() => db.cards.toArray(), []);
  const subjects = useLiveQuery(() => db.subjects.toArray(), []);
  const courses = useLiveQuery(() => db.courses.toArray(), []);
  const memos = useLiveQuery(() => db.memos.toArray(), []);

  useEffect(() => {
    const savedLastSync = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SYNC);
    if (savedLastSync) {
      setLastSync(new Date(savedLastSync));
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Connexion rétablie');
      setIsOnline(true);
    };
    const handleOffline = () => {
      console.log('📡 Mode hors ligne activé');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleFocus = () => {
      console.log('🔄 Fenêtre active, vérification des mises à jour...');
      if (isOnline && isConfigured && session) {
        pullRemoteChanges();
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isOnline, isConfigured, session]);

  useEffect(() => {
    if (isOnline && isConfigured && session) {
      console.log('🔄 Lancement de la synchronisation initiale');
      syncToCloud();
    }
  }, [isOnline, isConfigured, session]);

  // Realtime subscriptions
  useEffect(() => {
    if (!session || !workspaceId) return;

    const handleChanges = async (payload) => {
      const { eventType, new: newRecord, old: oldRecord, table } = payload;
      let dbTable;

      switch (table) {
        case TABLE_NAMES.CARDS:
          dbTable = db.cards;
          break;
        case TABLE_NAMES.SUBJECTS:
          dbTable = db.subjects;
          break;
        case TABLE_NAMES.COURSES:
          dbTable = db.courses;
          break;
        case TABLE_NAMES.MEMOS:
          dbTable = db.memos;
          break;
        default:
          return;
      }

      switch (eventType) {
        case 'INSERT':
          // On s'assure que l'enregistrement entrant est marqué comme synchronisé
          await dbTable.put({...newRecord, isSynced: 1});
          break;
        case 'UPDATE':
          const localRecord = await dbTable.get(newRecord.id);
          if (localRecord) {
            const localDate = new Date(localRecord.updated_at || localRecord.created_at || 0);
            const remoteDate = new Date(newRecord.updated_at || newRecord.created_at);
            if (remoteDate > localDate) {
              await dbTable.put({...newRecord, isSynced: 1});
            }
          } else {
            await dbTable.put({...newRecord, isSynced: 1});
          }
          break;
        case 'DELETE':
          await dbTable.delete(oldRecord.id);
          break;
        default:
          break;
      }
    };

    const cardsChannel = supabase.channel(`public:cards:workspace_id=eq.${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, handleChanges)
      .subscribe();

    const subjectsChannel = supabase.channel(`public:subjects:workspace_id=eq.${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, handleChanges)
      .subscribe();

    const coursesChannel = supabase.channel(`public:courses:workspace_id=eq.${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, handleChanges)
      .subscribe();

    const memosChannel = supabase.channel(`public:memos:workspace_id=eq.${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memos' }, handleChanges)
      .subscribe();

    return () => {
      supabase.removeChannel(cardsChannel);
      supabase.removeChannel(subjectsChannel);
      supabase.removeChannel(coursesChannel);
      supabase.removeChannel(memosChannel);
    };
  }, [session, workspaceId]);

  // =============================================
  // FONCTIONS DE FORMATAGE
  // =============================================
  
  const formatCardFromSupabase = (card) => ({
    id: card.id,
    question: card.question || '',
    answer: card.answer || '',
    subject_id: card.subject_id,
    workspace_id: card.workspace_id,
    question_image: card.question_image || null,
    answer_image: card.answer_image || null,
    updatedAt: card.updated_at,
    isSynced: 1,
  });

  const formatCardForSupabase = (card) => {
    const formatted = {
      question: card.question || '',
      answer: card.answer || '',
      subject_id: card.subject_id,
      workspace_id: workspaceId,
      question_image: card.question_image || null,
      answer_image: card.answer_image || null,
      updated_at: card.updatedAt || new Date().toISOString(),
      user_id: session.user.id,
    };
    
    if (!String(card.id).startsWith('local_')) {
      formatted.id = card.id;
    }
    
    return formatted;
  };

  const formatSubjectFromSupabase = (subject) => ({
    ...subject,
    updatedAt: subject.updated_at,
    workspace_id: subject.workspace_id,
    isSynced: 1,
  });

  const formatSubjectForSupabase = (subject) => {
    const formatted = {
      name: subject.name,
      updated_at: subject.updatedAt || new Date().toISOString(),
      workspace_id: workspaceId,
      user_id: session.user.id,
    };
    
    if (!String(subject.id).startsWith('local_')) {
      formatted.id = subject.id;
    }
    
    return formatted;
  };

  const formatCourseFromSupabase = (course) => ({
    ...course,
    updatedAt: course.updated_at,
    workspace_id: course.workspace_id,
    isSynced: 1,
  });

  const formatCourseForSupabase = (course) => {
    const formatted = {
      title: course.title,
      content: course.content,
      subject_id: course.subject_id,
      updated_at: course.updatedAt || new Date().toISOString(),
      workspace_id: workspaceId,
      user_id: session.user.id,
    };
    
    if (!String(course.id).startsWith('local_')) {
      formatted.id = course.id;
    }
    
    return formatted;
  };

  const formatMemoFromSupabase = (memo) => ({
    ...memo,
    updatedAt: memo.updated_at,
    workspace_id: memo.workspace_id,
    isPinned: memo.is_pinned,
    courseId: memo.course_id,
    isSynced: 1,
  });

  const formatMemoForSupabase = (memo) => {
    const formatted = {
      content: memo.content,
      color: memo.color,
      updated_at: memo.updatedAt || new Date().toISOString(),
      workspace_id: workspaceId,
      user_id: session.user.id,
      is_pinned: memo.isPinned || false,
      course_id: memo.courseId || null,
    };
    
    if (!String(memo.id).startsWith('local_')) {
      formatted.id = memo.id;
    }
    
    return formatted;
  };

  const formatUserCardProgressFromSupabase = (progress) => ({
    id: progress.id,
    cardId: progress.card_id,
    userId: progress.user_id,
    interval: progress.interval,
    easeFactor: progress.easiness,
    dueDate: progress.next_review,
    reviewCount: progress.review_count,
    status: progress.status,
    step: progress.step,
    updatedAt: progress.updated_at,
    isSynced: 1,
  });

  const formatUserCardProgressForSupabase = (progress) => {
    const formatted = {
      card_id: progress.cardId,
      user_id: session.user.id,
      interval: progress.interval,
      easiness: progress.easeFactor,
      next_review: progress.dueDate,
      review_count: progress.reviewCount,
      status: progress.status,
      step: progress.step,
      updated_at: progress.updatedAt || new Date().toISOString(),
    };
    
    if (!String(progress.id).startsWith('local_')) {
      formatted.id = progress.id;
    }
    
    return formatted;
  };

  const formatReviewHistoryFromSupabase = (review) => ({
    id: review.id,
    userId: review.user_id,
    cardId: review.card_id,
    rating: review.rating,
    reviewed_at: review.reviewed_at,
    isSynced: 1,
  });

const formatReviewHistoryForSupabase = (review) => {
  const formatted = {
    user_id: session.user.id,
    card_id: review.cardId,
    rating: review.rating,
    reviewed_at: review.reviewed_at,
    duration_ms: review.duration_ms || 0,
  };

  if (!String(review.id).startsWith('local_')) {
    formatted.id = review.id;
  }

  return formatted;
};

  const pullRemoteChanges = async () => {
    if (!session || !isOnline || !workspaceId) return;

    console.log('⬇️ Téléchargement des données cloud...');
    const lastSyncTime = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SYNC) || new Date(0).toISOString();

    const [
      { data: cloudCards, error: cardsError },
      { data: cloudSubjects, error: subjectsError },
      { data: cloudCourses, error: coursesError },
      { data: cloudMemos, error: memosError },
      { data: cloudProgress, error: progressError },
      { data: cloudReviewHistory, error: reviewHistoryError }
    ] = await Promise.all([
      supabase.from(TABLE_NAMES.CARDS).select('*').eq('workspace_id', workspaceId).gte('updated_at', lastSyncTime),
      supabase.from(TABLE_NAMES.SUBJECTS).select('*').eq('workspace_id', workspaceId).gte('updated_at', lastSyncTime),
      supabase.from(TABLE_NAMES.COURSES).select('*').eq('workspace_id', workspaceId).gte('updated_at', lastSyncTime),
      supabase.from(TABLE_NAMES.MEMOS).select('*').eq('workspace_id', workspaceId).gte('updated_at', lastSyncTime),
      supabase.from(TABLE_NAMES.USER_CARD_PROGRESS).select('*').eq('user_id', session.user.id).gte('updated_at', lastSyncTime),
      supabase.from(TABLE_NAMES.REVIEW_HISTORY).select('*').eq('user_id', session.user.id).gte('reviewed_at', lastSyncTime)
    ]);

    if (cardsError || subjectsError || coursesError || memosError || progressError || reviewHistoryError) {
      throw cardsError || subjectsError || coursesError || memosError || progressError || reviewHistoryError;
    }

    await db.transaction('rw', db.cards, db.subjects, db.courses, db.memos, db.user_card_progress, db.review_history, async () => {
      if (cloudSubjects && cloudSubjects.length > 0) await db.subjects.bulkPut(cloudSubjects.map(formatSubjectFromSupabase));
      if (cloudCards && cloudCards.length > 0) await db.cards.bulkPut(cloudCards.map(formatCardFromSupabase));
      if (cloudCourses && cloudCourses.length > 0) await db.courses.bulkPut(cloudCourses.map(formatCourseFromSupabase));
      if (cloudMemos && cloudMemos.length > 0) await db.memos.bulkPut(cloudMemos.map(formatMemoFromSupabase));
      if (cloudProgress && cloudProgress.length > 0) await db.user_card_progress.bulkPut(cloudProgress.map(formatUserCardProgressFromSupabase));
      if (cloudReviewHistory && cloudReviewHistory.length > 0) await db.review_history.bulkPut(cloudReviewHistory.map(formatReviewHistoryFromSupabase));
    });
    console.log('✅ Base locale mise à jour avec les données du cloud.');
  };

const pushLocalChanges = async () => {
  if (!session || !isOnline || !workspaceId) return;

  console.log('⬆️ Upload des modifications locales...');

    const pendingDeletions = await db.deletionsPending.toArray();
    if (pendingDeletions.length > 0) {
      await Promise.all(pendingDeletions.map(async (deletion) => {
        if (!String(deletion.id).startsWith('local_')) {
          await supabase.from(deletion.tableName).delete().eq('id', deletion.id);
        }
        await db.deletionsPending.delete(deletion.id);
      }));
    }

  // --- SUBJECTS ---
  let localUnsyncedSubjects = await db.subjects.where('isSynced').equals(0).toArray();
  if (localUnsyncedSubjects.length > 0) {
    const processedSubjectIds = new Set();

    for (const tempSubject of localUnsyncedSubjects.filter(s => String(s.id).startsWith('local_'))) {
      if (processedSubjectIds.has(tempSubject.id)) {
        console.log(`⏭️ Sujet ${tempSubject.id} déjà traité, ignoré.`);
        continue;
      }
      processedSubjectIds.add(tempSubject.id);

      const subjectPayload = formatSubjectForSupabase(tempSubject);

      const { data, error } = await supabase.from(TABLE_NAMES.SUBJECTS)
        .upsert(subjectPayload, {
          onConflict: 'workspace_id, name',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (data) {
        const serverSubject = data;
        await db.transaction('rw', db.subjects, db.cards, db.courses, async () => {
          await db.cards.where('subject_id').equals(tempSubject.id).modify({ subject_id: serverSubject.id, isSynced: 0 });
          await db.courses.where('subject_id').equals(tempSubject.id).modify({ subject_id: serverSubject.id, isSynced: 0 });
          await db.subjects.delete(tempSubject.id);
          await db.subjects.put(formatSubjectFromSupabase(serverSubject));
        });
      } else if (error) {
        console.error("Erreur lors de l'upsert du sujet:", error);
      }
    }

    const subjectsToUpdate = localUnsyncedSubjects.filter(s => !String(s.id).startsWith('local_'));
    if (subjectsToUpdate.length > 0) {
      await supabase.from(TABLE_NAMES.SUBJECTS).upsert(subjectsToUpdate.map(formatSubjectForSupabase), { onConflict: 'id' });
      await db.subjects.where('id').anyOf(subjectsToUpdate.map(s => s.id)).modify({ isSynced: 1 });
    }
  }

    let localUnsyncedCourses = await db.courses.where('isSynced').equals(0).toArray();
    if (localUnsyncedCourses.length > 0) {
        // Handle creations
        for (const tempCourse of localUnsyncedCourses.filter(c => String(c.id).startsWith('local_'))) {
            const { data } = await supabase.from(TABLE_NAMES.COURSES).insert(formatCourseForSupabase(tempCourse)).select();
            if (data) {
                const serverCourse = data[0];
                await db.transaction('rw', db.courses, db.memos, async () => {
                    await db.memos.where('course_id').equals(tempCourse.id).modify({ course_id: serverCourse.id, isSynced: 0 });
                    await db.courses.delete(tempCourse.id);
                    await db.courses.put(formatCourseFromSupabase(serverCourse));
                });
            }
        }
        // Handle updates
        const coursesToUpdate = localUnsyncedCourses.filter(c => !String(c.id).startsWith('local_'));
        if (coursesToUpdate.length > 0) {
            await supabase.from(TABLE_NAMES.COURSES).upsert(coursesToUpdate.map(formatCourseForSupabase), { onConflict: 'id' });
            await db.courses.where('id').anyOf(coursesToUpdate.map(c => c.id)).modify({ isSynced: 1 });
        }
    }

  // --- CARDS ---
  let localUnsyncedCards = await db.cards.where('isSynced').equals(0).toArray();
  if (localUnsyncedCards.length > 0) {
    const processedCardIds = new Set();

    for (const tempCard of localUnsyncedCards.filter(c => String(c.id).startsWith('local_'))) {
      if (processedCardIds.has(tempCard.id)) {
        console.log(`⏭️ Carte ${tempCard.id} déjà traitée, ignorée.`);
        continue;
      }
      processedCardIds.add(tempCard.id);

      const { data, error } = await supabase.from(TABLE_NAMES.CARDS).insert(formatCardForSupabase(tempCard)).select();

      if (data) {
        const serverCard = data[0];
        await db.transaction('rw', db.cards, db.user_card_progress, db.review_history, async () => {
          await db.user_card_progress.where('cardId').equals(tempCard.id).modify({ cardId: serverCard.id, isSynced: 0 });
          await db.review_history.where('cardId').equals(tempCard.id).modify({ cardId: serverCard.id, isSynced: 0 });
          await db.cards.delete(tempCard.id);
          await db.cards.put(formatCardFromSupabase(serverCard));
        });
        console.log(`✅ Carte ${tempCard.id} → ${serverCard.id} synchronisée.`);
      } else if (error) {
        console.error(`❌ Erreur lors de l'insertion de la carte ${tempCard.id}:`, error);
      }
    }

    const cardsToUpdate = localUnsyncedCards.filter(c => !String(c.id).startsWith('local_'));
    if (cardsToUpdate.length > 0) {
      await supabase.from(TABLE_NAMES.CARDS).upsert(cardsToUpdate.map(formatCardForSupabase), { onConflict: 'id' });
      await db.cards.where('id').anyOf(cardsToUpdate.map(c => c.id)).modify({ isSynced: 1 });
    }
  }

    let localUnsyncedMemos = await db.memos.where('isSynced').equals(0).toArray();
    if (localUnsyncedMemos.length > 0) {
        // Handle creations
        for (const tempMemo of localUnsyncedMemos.filter(m => String(m.id).startsWith('local_'))) {
            const { data } = await supabase.from(TABLE_NAMES.MEMOS).insert(formatMemoForSupabase(tempMemo)).select();
            if (data) {
                const serverMemo = data[0];
                await db.memos.delete(tempMemo.id);
                await db.memos.put(formatMemoFromSupabase(serverMemo));
            }
        }
        // Handle updates
        const memosToUpdate = localUnsyncedMemos.filter(m => !String(m.id).startsWith('local_'));
        if(memosToUpdate.length > 0) {
            await supabase.from(TABLE_NAMES.MEMOS).upsert(memosToUpdate.map(formatMemoForSupabase), { onConflict: 'id' });
            await db.memos.where('id').anyOf(memosToUpdate.map(m => m.id)).modify({ isSynced: 1 });
        }
    }

    let localUnsyncedProgress = await db.user_card_progress.where('isSynced').equals(0).toArray();
    if (localUnsyncedProgress.length > 0) {
        // Handle creations
        for (const tempProgress of localUnsyncedProgress.filter(p => String(p.id).startsWith('local_'))) {
            if (String(tempProgress.cardId).startsWith('local_')) continue;
            const { data } = await supabase.from(TABLE_NAMES.USER_CARD_PROGRESS).insert(formatUserCardProgressForSupabase(tempProgress)).select();
            if (data) {
                const serverProgress = data[0];
                await db.user_card_progress.delete(tempProgress.id);
                await db.user_card_progress.put(formatUserCardProgressFromSupabase(serverProgress));
            }
        }
        // Handle updates
        const progressToUpdate = localUnsyncedProgress.filter(p => !String(p.id).startsWith('local_'));
        if(progressToUpdate.length > 0) {
            await supabase.from(TABLE_NAMES.USER_CARD_PROGRESS).upsert(progressToUpdate.map(formatUserCardProgressForSupabase), { onConflict: 'id' });
            await db.user_card_progress.where('id').anyOf(progressToUpdate.map(p => p.id)).modify({ isSynced: 1 });
        }
    }

  // --- REVIEW HISTORY ---
  let localUnsyncedHistory = await db.review_history.where('isSynced').equals(0).toArray();
  if (localUnsyncedHistory.length > 0) {
    console.log(`📤 Upload de ${localUnsyncedHistory.length} historique(s)...`);

    const validHistory = [];
    for (const h of localUnsyncedHistory) {
      if (String(h.cardId).startsWith('local_')) {
        console.warn(`⚠️ Historique ${h.id} ignoré, carte ${h.cardId} non encore synchro.`);
        continue;
      }
      validHistory.push(h);
    }

    if (validHistory.length > 0) {
      const formattedHistory = validHistory.map(formatReviewHistoryForSupabase);

      const { error } = await supabase.from('review_history').upsert(formattedHistory, { onConflict: 'id' });
      if (error) {
        console.error('❌ Erreur sync review_history:', error);
      } else {
        await db.review_history.where('id').anyOf(validHistory.map(h => h.id)).modify({ isSynced: 1 });
        console.log(`✅ ${validHistory.length} historique(s) synchronisé(s).`);
      }
    }
  }
};

  const handleImport = async (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      let importedCourses = 0;
      let importedCards = 0;

      if (data.courses && Array.isArray(data.courses)) {
        await db.courses.bulkPut(data.courses);
        importedCourses = data.courses.length;
      }

      if (data.cards && Array.isArray(data.cards)) {
        await db.cards.bulkPut(data.cards);
        importedCards = data.cards.length;
      }

      toast.success(`Importation réussie ! ${importedCourses} cours et ${importedCards} cartes ajoutés/mis à jour.`);

      if (isOnline) {
        pushLocalChanges();
      }
    } catch (error) {
      toast.error("Erreur lors de l'importation. Le fichier est peut-être invalide.");
      console.error("Import failed:", error);
    }
  };

  const syncToCloud = async () => {
    if (isSyncing) return false;
    setIsSyncing(true);
    const toastId = toast.loading('Synchronisation en cours...');

    try {
      await pullRemoteChanges();
      await pushLocalChanges();

      const now = new Date();
      setLastSync(now);
      localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SYNC, now.toISOString());
      
      toast.success('✅ Synchronisation réussie !', { id: toastId });
      return true;
    } catch (err) {
      toast.error(`Erreur: ${err.message}`, { id: toastId });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // =============================================
  // FONCTIONS CRUD
  // =============================================

  const addCard = async (card) => {
    const newCard = {
      ...card,
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workspace_id: workspaceId,
      isSynced: 0, 
      nextReview: new Date().toISOString(),
      reviewCount: 0,
      question_image: card.question_image || null,
      answer_image: card.answer_image || null,
    };
    
    await db.cards.add(newCard);
    toast.success('✅ Carte ajoutée !');
    
    if (isOnline) {
      pushLocalChanges();
    }

    
  };

  const updateCard = async (id, updates) => {
    const updatedCard = { 
      ...updates, 
      updatedAt: new Date().toISOString(), 
      isSynced: 0, 
      question_image: updates.question_image || null,
      answer_image: updates.answer_image || null,
    };
    
    await db.cards.update(id, updatedCard);
    toast.success('✅ Carte mise à jour !');
    
    if (isOnline) {
      pushLocalChanges();
    }
  };

  const deleteCard = async (id) => {
    await db.cards.delete(id);
    await db.deletionsPending.add({ id, tableName: TABLE_NAMES.CARDS });
    toast.success('✅ Carte supprimée !');
    
    if (isOnline) {
      pushLocalChanges();
    }
  };

  const handleBulkAdd = async (bulkText) => {
    const lines = bulkText.trim().split('\n');
    const uniqueSubjectNames = [...new Set(
      lines.map(line => {
        const parts = line.split('#');
        return parts.length >= 3 ? normalizeSubjectName(parts[2].trim()) : null;
      }).filter(Boolean)
    )];

    const existingSubjects = await db.subjects.where('name').anyOf(uniqueSubjectNames).toArray();
    const existingSubjectMap = new Map(existingSubjects.map(s => [s.name, s.id]));

    const newSubjectsToCreate = uniqueSubjectNames
      .filter(name => !existingSubjectMap.has(name))
      .map(name => ({
        name,
        workspace_id: workspaceId,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isSynced: 0, 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

    if (newSubjectsToCreate.length > 0) {
      await db.subjects.bulkAdd(newSubjectsToCreate);
      newSubjectsToCreate.forEach(s => existingSubjectMap.set(s.name, s.id));
    }

    const newCards = lines.map((line, idx) => {
      const parts = line.split('#');
      if (parts.length >= 3) {
        const subjectName = normalizeSubjectName(parts[2].trim());
        const subject_id = existingSubjectMap.get(subjectName);
        if (!subject_id) return null;

        return {
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${idx}`,
          question: parts[0].trim(),
          answer: parts[1].trim(),
          subject_id: subject_id,
          workspace_id: workspaceId,
          isSynced: 0, 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      return null;
    }).filter(Boolean);

    if (newCards.length === 0) return;

    await db.cards.bulkAdd(newCards);
    toast.success(`✅ ${newCards.length} cartes ajoutées !`);

    if (isOnline) {
      pushLocalChanges();
    }
  };

  const normalizeSubjectName = (name) => {
    if (!name) return '';
    const trimmed = name.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  const addSubject = async (newSubject) => {
    const normalizedName = normalizeSubjectName(newSubject);
    if (!normalizedName) return;

    const existing = await db.subjects.where('name').equalsIgnoreCase(normalizedName).first();
    if (existing) {
      toast.error('Cette matière existe déjà.');
      return;
    }

    const newSubjectOffline = {
      name: normalizedName,
      workspace_id: workspaceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isSynced: 0 
    };

    await db.subjects.add(newSubjectOffline);
    toast.success('✅ Matière ajoutée !');

    if (isOnline) {
      pushLocalChanges();
    }
  };

  const handleDeleteCardsOfSubject = async (subjectId) => {
    const subjectToDelete = await db.subjects.get(subjectId);
    if (!subjectToDelete) return;

    const cardsToDelete = await db.cards.where('subject_id').equals(subjectId).toArray();

    await db.deletionsPending.add({ id: subjectId, tableName: TABLE_NAMES.SUBJECTS });
    await db.subjects.delete(subjectId);

    if (cardsToDelete.length > 0) {
      const cardIdsToDelete = cardsToDelete.map(c => c.id);
      const deletions = cardIdsToDelete.map(id => ({ id, tableName: TABLE_NAMES.CARDS }));
      await db.deletionsPending.bulkAdd(deletions);
      await db.cards.bulkDelete(cardIdsToDelete);
    }

    toast.success(`Matière "${subjectToDelete.name}" et ses cartes supprimées.`);
    if (isOnline) pushLocalChanges();
  };

  const handleReassignCardsOfSubject = async (subjectId) => {
    const subjectToDelete = await db.subjects.get(subjectId);
    if (!subjectToDelete) return;

    const defaultSubject = await db.subjects.where('name').equalsIgnoreCase(DEFAULT_SUBJECT).first();
    if (!defaultSubject) {
      toast.error(`La matière par défaut "${DEFAULT_SUBJECT}" n'existe pas.`);
      return;
    }

    await db.cards.where('subject_id').equals(subjectId).modify({ subject_id: defaultSubject.id, isSynced: 0 }); 
    await db.deletionsPending.add({ id: subjectId, tableName: TABLE_NAMES.SUBJECTS });
    await db.subjects.delete(subjectId);

    toast.success(`Cartes réassignées à "${DEFAULT_SUBJECT}".`);
    if (isOnline) pushLocalChanges();
  };

  const reviewCard = async (cardId, rating) => {
    if (isCramMode) {
      return;
    }

    const userId = session?.user?.id;
    if (!userId) return;

    const progress = await db.user_card_progress
      .where({ cardId: cardId, userId: userId })
      .first();

    const { interval, easeFactor, status, dueDate, step } = calculateSrsData(progress, rating);

    const updatedProgress = {
      cardId: cardId,
      userId: userId,
      interval,
      easeFactor,
      status,
      dueDate,
      step: step,
      reviewCount: (progress?.reviewCount || 0) + 1,
      updatedAt: new Date().toISOString(),
      isSynced: 0,
    };

    if (progress) {
      await db.user_card_progress.update(progress.id, updatedProgress);
    } else {
      await db.user_card_progress.add({
        ...updatedProgress,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    }

    const cardToUpdate = await db.cards.get(cardId);
    if (cardToUpdate) {
      await db.cards.update(cardId, {
        nextReview: dueDate,
        reviewCount: (cardToUpdate.reviewCount || 0) + 1,
      });
    }

    if (!String(cardId).startsWith('local_')) {
      try {
        await db.review_history.add({
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          cardId: cardId,
          userId: userId,
          rating: rating,
          reviewed_at: new Date().toISOString(),
          duration_ms: 0,
          isSynced: 0
        });
      } catch (error) {
        console.error("❌ Impossible d'enregistrer l'historique de révision :", error);
      }
    } else {
      console.log(`⏸️ Historique différé pour la carte locale ${cardId}`);
    }

    if (isOnline) {
      pushLocalChanges();
    }
  };

  const addCourse = async (course) => {
    const newCourse = {
      ...course,
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      workspace_id: workspaceId,
      isSynced: 0
    };

    await db.courses.add(newCourse);
    toast.success('✅ Cours ajouté !');

    if (isOnline) {
      pushLocalChanges();
    }
  };

  const updateCourse = async (id, updates) => {
    const updatedCourse = { 
      ...updates, 
      updated_at: new Date().toISOString(), 
      isSynced: 0
    };
    await db.courses.update(id, updatedCourse);
    toast.success('✅ Cours mis à jour !');
    if (isOnline) {
      pushLocalChanges();
    }
  };

  const deleteCourse = async (id) => {
    // Dissocier les cartes liées
    await db.cards.where('course_id').equals(id).modify({ course_id: null, isSynced: 0 });

    // Supprimer le cours
    await db.courses.delete(id);
    await db.deletionsPending.add({ id, tableName: TABLE_NAMES.COURSES });

    toast.success('✅ Cours supprimé !');

    if (isOnline) {
      pushLocalChanges();
    }
  };

  const addMemo = async (memo) => {
    const newMemo = {
      ...memo,
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workspace_id: workspaceId,
      isSynced: 0, 
    };
    await db.memos.add(newMemo);
    toast.success('✅ Mémo ajouté !');
    if (isOnline) {
      pushLocalChanges();
    }
  };

  const updateMemoWithSync = async (id, updates) => {
    const updatedMemo = { 
      ...updates, 
      updatedAt: new Date().toISOString(), 
      isSynced: 0
    };
    await db.memos.update(id, updatedMemo);
    toast.success('✅ Mémo mis à jour !');
    if (isOnline) {
      pushLocalChanges();
    }
  };

  const deleteMemoWithSync = async (id) => {
    await db.memos.delete(id);
    await db.deletionsPending.add({ id, tableName: TABLE_NAMES.MEMOS });
    toast.success('✅ Mémo supprimé !');
    if (isOnline) {
      pushLocalChanges();
    }
  };

  const signOut = async () => {
    const syncSuccessful = await pushLocalChanges();
    if (!syncSuccessful) {
      // Decide if you want to block sign out if push fails
    }
    await db.delete();
    await supabase.auth.signOut();
    localStorage.removeItem(LOCAL_STORAGE_KEYS.WORKSPACE_ID);
    window.location.reload();
  };

  const getCardsToReview = async (subjectIds = ['all'], options = {}) => {
    const { includeFuture = false } = options;
    const userId = session?.user?.id;
    if (!userId) return [];

    const now = new Date();
    const allUserProgress = await db.user_card_progress.where('userId').equals(userId).toArray();
    const progressMap = new Map(allUserProgress.map(p => [p.cardId, p]));

    let cardsToReviewQuery = db.cards.toCollection();
    if (subjectIds.length > 0 && !subjectIds.includes('all')) {
      cardsToReviewQuery = cardsToReviewQuery.filter(card => subjectIds.includes(card.subject_id));
    }

    const allCardsInFilter = await cardsToReviewQuery.toArray();

    const dueCards = allCardsInFilter.filter(card => {
      const progress = progressMap.get(card.id);
      if (!progress) return true;
      if (includeFuture) return true;
      return new Date(progress.dueDate) <= now;
    });

    if (dueCards.length === 0) return [];

    const mergedCards = dueCards.map(card => ({
      ...card,
      ...progressMap.get(card.id),
    }));

    if (includeFuture) {
      return mergedCards.sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate) : 0;
        const dateB = b.dueDate ? new Date(b.dueDate) : 0;
        return dateA - dateB;
      });
    }

    return mergedCards.sort(() => Math.random() - 0.5);
  };

  const startReview = async (subjects = ['all'], isCramMode = false, includeFuture = false) => {
    const toReview = await getCardsToReview(subjects, { includeFuture });
    if (toReview.length > 0) {
      setReviewCards(toReview);
      setIsCramMode(isCramMode);
      setReviewMode(true);
      return true;
    } else {
      toast.error("Aucune carte à réviser !");
      return false;
    }
  };

  const value = {
    cards, 
    subjects, 
    courses, 
    memos, 
    isOnline, 
    isSyncing, 
    lastSync, 
    syncToCloud,
    addCard, 
    updateCard, 
    deleteCard, 
    handleBulkAdd, 
    addSubject,
    handleDeleteCardsOfSubject, 
    handleReassignCardsOfSubject, 
    reviewCard, 
    addCourse, 
    updateCourse,
    deleteCourse,
    addMemo, 
    updateMemoWithSync, 
    deleteMemoWithSync,
    signOut, 
    getCardsToReview, 
    startReview,
    handleImport,
  };

  return (
    <DataSyncContext.Provider value={value}>
      {children}
    </DataSyncContext.Provider>
  );
};

export const useDataSync = () => {
  const context = useContext(DataSyncContext);
  if (context === undefined) {
    throw new Error('useDataSync must be used within a DataSyncProvider');
  }
  return context;
};
