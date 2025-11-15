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

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && isConfigured && session) {
      console.log('🔄 Lancement de la synchronisation automatique');
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
    isSynced: 1, // 👈 MODIFIÉ
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
    isSynced: 1, // 👈 MODIFIÉ
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
    isSynced: 1, // 👈 MODIFIÉ
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
    isSynced: 1, // 👈 MODIFIÉ
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
    isSynced: 1, // 👈 MODIFIÉ
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

  // =============================================
  // FONCTION DE SYNCHRONISATION
  // =============================================
  
  const syncToCloud = async () => {
    if (!session || !isOnline || !workspaceId || isSyncing) {
      console.log('⏸️ Synchronisation ignorée:', { session: !!session, isOnline, workspaceId, isSyncing });
      return false;
    }

    setIsSyncing(true);
    console.log('🔄 Début de la synchronisation...');
    const toastId = toast.loading('Synchronisation en cours...');

    try {
      const lastSyncTime = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SYNC) || new Date(0).toISOString();
      console.log('📅 Dernière synchronisation:', lastSyncTime);

      // TÉLÉCHARGER
      console.log('⬇️ Téléchargement des données cloud...');

      const [
        { data: cloudCards, error: cardsError },
        { data: cloudSubjects, error: subjectsError },
        { data: cloudCourses, error: coursesError },
        { data: cloudMemos, error: memosError },
        { data: cloudProgress, error: progressError }
      ] = await Promise.all([
        supabase.from(TABLE_NAMES.CARDS).select('*').eq('workspace_id', workspaceId).gte('updated_at', lastSyncTime),
        supabase.from(TABLE_NAMES.SUBJECTS).select('*').eq('workspace_id', workspaceId).gte('updated_at', lastSyncTime),
        supabase.from(TABLE_NAMES.COURSES).select('*').eq('workspace_id', workspaceId).gte('updated_at', lastSyncTime),
        supabase.from(TABLE_NAMES.MEMOS).select('*').eq('workspace_id', workspaceId).gte('updated_at', lastSyncTime),
        supabase.from(TABLE_NAMES.USER_CARD_PROGRESS).select('*').eq('user_id', session.user.id).gte('updated_at', lastSyncTime)
      ]);

      if (cardsError || subjectsError || coursesError || memosError || progressError) {
        throw cardsError || subjectsError || coursesError || memosError || progressError;
      }

      console.log('📊 Données téléchargées:', {
        cards: cloudCards?.length || 0,
        subjects: cloudSubjects?.length || 0,
        courses: cloudCourses?.length || 0,
        memos: cloudMemos?.length || 0,
        progress: cloudProgress?.length || 0
      });

      // METTRE À JOUR LOCAL
      console.log('💾 Mise à jour de la base locale...');

      await db.transaction('rw', db.cards, db.subjects, db.courses, db.memos, db.user_card_progress, async () => {
        if (cloudSubjects && cloudSubjects.length > 0) {
          const formattedSubjects = cloudSubjects.map(formatSubjectFromSupabase);
          await db.subjects.bulkPut(formattedSubjects);
          console.log(`✅ ${formattedSubjects.length} sujets mis à jour localement`);
        }

        if (cloudCards && cloudCards.length > 0) {
          const formattedCards = cloudCards.map(formatCardFromSupabase);
          await db.cards.bulkPut(formattedCards);
          console.log(`✅ ${formattedCards.length} cartes mises à jour localement`);
        }

        if (cloudCourses && cloudCourses.length > 0) {
          const formattedCourses = cloudCourses.map(formatCourseFromSupabase);
          await db.courses.bulkPut(formattedCourses);
          console.log(`✅ ${formattedCourses.length} cours mis à jour localement`);
        }

        if (cloudMemos && cloudMemos.length > 0) {
          const formattedMemos = cloudMemos.map(formatMemoFromSupabase);
          await db.memos.bulkPut(formattedMemos);
          console.log(`✅ ${formattedMemos.length} mémos mis à jour localement`);
        }

        if (cloudProgress && cloudProgress.length > 0) {
          const formattedProgress = cloudProgress.map(formatUserCardProgressFromSupabase);
          await db.user_card_progress.bulkPut(formattedProgress);
          console.log(`✅ ${formattedProgress.length} progressions mises à jour localement`);
        }
      });

      // ENVOYER MODIFICATIONS LOCALES
      console.log('⬆️ Upload des modifications locales...');

      let [
        localUnsyncedSubjects,
        localUnsyncedCards,
        localUnsyncedCourses,
        localUnsyncedMemos,
        localUnsyncedProgress
      ] = await Promise.all([
        db.subjects.where('isSynced').equals(0).toArray(),         // 👈 MODIFIÉ
        db.cards.where('isSynced').equals(0).toArray(),            // 👈 MODIFIÉ
        db.courses.where('isSynced').equals(0).toArray(),          // 👈 MODIFIÉ
        db.memos.where('isSynced').equals(0).toArray(),            // 👈 MODIFIÉ
        db.user_card_progress.where('isSynced').equals(0).toArray() // 👈 MODIFIÉ
      ]);

      console.log('📤 Données à uploader:', {
        subjects: localUnsyncedSubjects.length,
        cards: localUnsyncedCards.length,
        courses: localUnsyncedCourses.length,
        memos: localUnsyncedMemos.length,
        progress: localUnsyncedProgress.length
      });

      // Upload Sujets
      if (localUnsyncedSubjects.length > 0) {
        console.log('📤 Upload de', localUnsyncedSubjects.length, 'sujets...');
        
        const validSubjects = [];
        const invalidSubjects = [];
        
        for (const subject of localUnsyncedSubjects) {
          try {
            if (!subject.name || !workspaceId || !session.user.id) {
              throw new Error('Champs requis manquants');
            }
            
            const formatted = formatSubjectForSupabase(subject);
            validSubjects.push({ original: subject, formatted });
          } catch (err) {
            console.warn('⚠️ Sujet invalide ignoré:', subject.id, err.message);
            invalidSubjects.push(subject);
          }
        }
        
        console.log(`   ✅ ${validSubjects.length} sujets valides`);
        if (invalidSubjects.length > 0) {
          console.warn(`   ⚠️ ${invalidSubjects.length} sujets invalides ignorés`);
        }
        
        if (validSubjects.length > 0) {
          const subjectsToSync = validSubjects.map(v => v.formatted);
          
          const { data: syncedSubjects, error } = await supabase
            .from(TABLE_NAMES.SUBJECTS)
            .upsert(subjectsToSync, { onConflict: 'id' })
            .select();
          
          if (error) {
            console.error('❌ Erreur upload sujets:', error);
            throw error;
          }

          if (syncedSubjects && syncedSubjects.length > 0) {
            const tempSubjects = validSubjects.filter(v => String(v.original.id).startsWith('local_'));
            
            for (const { original: tempSubject } of tempSubjects) {
              const serverSubject = syncedSubjects.find(s => s.name === tempSubject.name);
              if (serverSubject) {
                await db.cards
                  .where('subject_id').equals(tempSubject.id)
                  .modify({ subject_id: serverSubject.id, isSynced: 0 }); // 👈 MODIFIÉ (marquer les cartes comme non synchro)
                
                await db.subjects.delete(tempSubject.id);
                await db.subjects.put(formatSubjectFromSupabase(serverSubject));
                
                console.log(`🔄 Sujet remappé: ${tempSubject.id} → ${serverSubject.id}`);
              }
            }
          }

          await db.subjects
            .where('isSynced').equals(0) // 👈 MODIFIÉ
            .and(s => !String(s.id).startsWith('local_'))
            .modify({ isSynced: 1 }); // 👈 MODIFIÉ
          
          if (invalidSubjects.length > 0) {
            const invalidIds = invalidSubjects.map(s => s.id);
            await db.subjects.bulkDelete(invalidIds);
            console.log(`🗑️ ${invalidIds.length} sujets invalides supprimés localement`);
          }
          
          console.log(`✅ ${validSubjects.length} sujets uploadés`);
        }
      }
      
      // RE-LIRE les cartes non synchronisées au cas où les subject_id ont changé
      localUnsyncedCards = await db.cards.where('isSynced').equals(0).toArray(); // 👈 MODIFIÉ
      
      // Upload Cartes
      if (localUnsyncedCards.length > 0) {
        console.log('📤 Upload de', localUnsyncedCards.length, 'cartes...');
        
        const validCards = [];
        const invalidCards = [];
        
        for (const card of localUnsyncedCards) {
          try {
            if (!card.question || !card.answer || !workspaceId || !session.user.id) {
              throw new Error('Champs requis manquants');
            }
            
            if (card.subject_id) {
              // Vérifier si le subject_id est encore local
              if (String(card.subject_id).startsWith('local_')) {
                 throw new Error(`Subject ${card.subject_id} n'a pas encore été synchronisé.`);
              }
              const subjectExists = await db.subjects.get(card.subject_id);
              if (!subjectExists) {
                throw new Error(`Subject ${card.subject_id} n'existe pas`);
              }
            }
            
            const formatted = formatCardForSupabase(card);
            validCards.push({ original: card, formatted });
          } catch (err) {
            console.warn('⚠️ Carte invalide ignorée:', card.id, err.message);
            invalidCards.push(card);
          }
        }
        
        console.log(`   ✅ ${validCards.length} cartes valides`);
        if (invalidCards.length > 0) {
          console.warn(`   ⚠️ ${invalidCards.length} cartes invalides ignorées`);
        }
        
        if (validCards.length > 0) {
          const cardsToSync = validCards.map(v => v.formatted);
          console.log('🔍 Exemple de carte à uploader:', JSON.stringify(cardsToSync[0], null, 2));
          
          const { data: syncedCards, error } = await supabase
            .from(TABLE_NAMES.CARDS)
            .upsert(cardsToSync, { onConflict: 'id' })
            .select();
          
          if (error) {
            console.error('❌ Erreur upload cartes:', error);
            throw error;
          }

          console.log('📥 Cartes retournées par Supabase:', syncedCards?.length || 0);

          if (syncedCards && syncedCards.length > 0) {
            const tempCards = validCards.filter(v => String(v.original.id).startsWith('local_'));
            
            for (const { original: tempCard } of tempCards) {
              const serverCard = syncedCards.find(c => 
                c.question === tempCard.question && 
                c.answer === tempCard.answer &&
                c.subject_id === tempCard.subject_id
              );
              
              if (serverCard) {
                // Mettre à jour la progression des cartes avec le nouvel ID
                await db.user_card_progress
                  .where('card_id').equals(tempCard.id)
                  .modify({ card_id: serverCard.id, isSynced: 0 }); // 👈 MODIFIÉ
                  
                await db.cards.delete(tempCard.id);
                await db.cards.put(formatCardFromSupabase(serverCard));
                console.log(`🔄 Carte remappée: ${tempCard.id} → ${serverCard.id}`);
              }
            }
          }

          await db.cards
            .where('isSynced').equals(0) // 👈 MODIFIÉ
            .and(c => !String(c.id).startsWith('local_'))
            .modify({ isSynced: 1 }); // 👈 MODIFIÉ
          
          if (invalidCards.length > 0) {
            const invalidIds = invalidCards.map(c => c.id);
            await db.cards.bulkDelete(invalidIds);
            console.log(`🗑️ ${invalidIds.length} cartes invalides supprimées localement`);
          }
          
          console.log(`✅ ${validCards.length} cartes uploadées`);
        }
      }

      // RE-LIRE la progression au cas où les card_id ont changé
      localUnsyncedProgress = await db.user_card_progress.where('isSynced').equals(0).toArray(); // 👈 MODIFIÉ

      // Upload Cours (simplifié)
      if (localUnsyncedCourses.length > 0) {
        const coursesToSync = localUnsyncedCourses.map(formatCourseForSupabase);
        const { error } = await supabase
          .from(TABLE_NAMES.COURSES)
          .upsert(coursesToSync, { onConflict: 'id' });
        
        if (!error) {
          await db.courses.where('isSynced').equals(0).modify({ isSynced: 1 }); // 👈 MODIFIÉ
          console.log(`✅ ${coursesToSync.length} cours uploadés`);
        }
      }

      // Upload Mémos (simplifié)
      if (localUnsyncedMemos.length > 0) {
        const memosToSync = localUnsyncedMemos.map(formatMemoForSupabase);
        const { error } = await supabase
          .from(TABLE_NAMES.MEMOS)
          .upsert(memosToSync, { onConflict: 'id' });
        
        if (!error) {
          await db.memos.where('isSynced').equals(0).modify({ isSynced: 1 }); // 👈 MODIFIÉ
          console.log(`✅ ${memosToSync.length} mémos uploadés`);
        }
      }

      // Upload Progression (simplifié)
      if (localUnsyncedProgress.length > 0) {
        const progressToSync = localUnsyncedProgress.map(formatUserCardProgressForSupabase);
        const { error } = await supabase
          .from(TABLE_NAMES.USER_CARD_PROGRESS)
          .upsert(progressToSync, { onConflict: 'id' });
        
        if (!error) {
          await db.user_card_progress.where('isSynced').equals(0).modify({ isSynced: 1 }); // 👈 MODIFIÉ
          console.log(`✅ ${progressToSync.length} progressions uploadées`);
        }
      }

      // GÉRER SUPPRESSIONS
      const pendingDeletions = await db.deletionsPending.toArray();
      
      if (pendingDeletions.length > 0) {
        console.log('🗑️ Traitement de', pendingDeletions.length, 'suppressions...');
        
        await Promise.all(pendingDeletions.map(async (deletion) => {
          const { error } = await supabase
            .from(deletion.tableName)
            .delete()
            .eq('id', deletion.id);
          
          if (error && error.code !== 'PGRST204') {
            console.error(`❌ Erreur suppression ${deletion.id}:`, error);
          } else {
            await db.deletionsPending.delete(deletion.id);
            console.log(`✅ Suppression ${deletion.id} effectuée`);
          }
        }));
      }

      // FINALISATION
      const now = new Date();
      setLastSync(now);
      localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SYNC, now.toISOString());
      
      console.log('✅ Synchronisation terminée avec succès');
      toast.success('✅ Synchronisation réussie !', { id: toastId });
      return true;

    } catch (err) {
      console.error('❌ Erreur de synchronisation:', err);
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
      isSynced: 0, // 👈 MODIFIÉ
      nextReview: new Date().toISOString(),
      reviewCount: 0,
      question_image: card.question_image || null,
      answer_image: card.answer_image || null,
    };
    
    console.log('➕ Ajout carte locale:', newCard.id);
    await db.cards.add(newCard);
    toast.success('✅ Carte ajoutée !');
    
    if (isOnline) {
      console.log('🔄 Déclenchement sync après ajout carte');
      syncToCloud();
    }
  };

  const updateCard = async (id, updates) => {
    const updatedCard = { 
      ...updates, 
      updatedAt: new Date().toISOString(), 
      isSynced: 0, // 👈 MODIFIÉ
      question_image: updates.question_image || null,
      answer_image: updates.answer_image || null,
    };
    
    console.log('✏️ Mise à jour carte:', id);
    await db.cards.update(id, updatedCard);
    toast.success('✅ Carte mise à jour !');
    
    if (isOnline) {
      syncToCloud();
    }
  };

  const deleteCard = async (id) => {
    console.log('🗑️ Suppression carte:', id);
    await db.cards.delete(id);
    await db.deletionsPending.add({ id, tableName: TABLE_NAMES.CARDS });
    toast.success('✅ Carte supprimée !');
    
    if (isOnline) {
      syncToCloud();
    }
  };

  const handleBulkAdd = async (bulkText) => {
    const lines = bulkText.trim().split('\n');
    const uniqueSubjectNames = [...new Set(
      lines.map(line => {
        const parts = line.split('/');
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
        isSynced: 0, // 👈 MODIFIÉ
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

    if (newSubjectsToCreate.length > 0) {
      await db.subjects.bulkAdd(newSubjectsToCreate);
      newSubjectsToCreate.forEach(s => existingSubjectMap.set(s.name, s.id));
    }

    const newCards = lines.map((line, idx) => {
      const parts = line.split('/');
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
          isSynced: 0, // 👈 MODIFIÉ
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
      syncToCloud();
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
      isSynced: 0 // 👈 MODIFIÉ
    };

    await db.subjects.add(newSubjectOffline);
    toast.success('✅ Matière ajoutée !');

    if (isOnline) {
      syncToCloud();
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
    if (isOnline) syncToCloud();
  };

  const handleReassignCardsOfSubject = async (subjectId) => {
    const subjectToDelete = await db.subjects.get(subjectId);
    if (!subjectToDelete) return;

    const defaultSubject = await db.subjects.where('name').equalsIgnoreCase(DEFAULT_SUBJECT).first();
    if (!defaultSubject) {
      toast.error(`La matière par défaut "${DEFAULT_SUBJECT}" n'existe pas.`);
      return;
    }

    await db.cards.where('subject_id').equals(subjectId).modify({ subject_id: defaultSubject.id, isSynced: 0 }); // 👈 MODIFIÉ
    await db.deletionsPending.add({ id: subjectId, tableName: TABLE_NAMES.SUBJECTS });
    await db.subjects.delete(subjectId);

    toast.success(`Cartes réassignées à "${DEFAULT_SUBJECT}".`);
    if (isOnline) syncToCloud();
  };

  const reviewCard = async (cardId, rating) => {
    if (isCramMode) {
      return;
    }

    const userId = session?.user?.id;
    if (!userId) return;

    const progress = await db.user_card_progress
      // 👇 MODIFICATION 1 : S'assurer qu'on cherche avec 'cardId' si c'est la clé
      // (Même si Dexie est flexible, soyons cohérents)
      .where({ cardId: cardId, userId: userId }) 
      .first();

    const { interval, easeFactor, status, dueDate, step } = calculateSrsData(progress, rating);

    // ▼▼▼ MODIFICATION 2 : Utiliser camelCase ici ▼▼▼
    const updatedProgress = {
      cardId: cardId,   // 👈 MODIFIÉ (était card_id)
      userId: userId,   // 👈 MODIFIÉ (était user_id)
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
        // Pas besoin de marquer la carte comme non synchro, seule la progression compte
      });
    }

    if (isOnline) {
      syncToCloud();
    }
  };

  const addCourse = async (course) => {
    const newCourse = {
      ...course,
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      workspace_id: workspaceId,
      isSynced: 0 // 👈 MODIFIÉ
    };

    await db.courses.add(newCourse);
    toast.success('✅ Cours ajouté !');

    if (isOnline) {
      syncToCloud();
    }
  };

  const updateCourse = async (id, updates) => {
    const updatedCourse = { 
      ...updates, 
      updated_at: new Date().toISOString(), 
      isSynced: 0 // 👈 MODIFIÉ
    };
    await db.courses.update(id, updatedCourse);
    toast.success('✅ Cours mis à jour !');
    if (isOnline) {
      syncToCloud();
    }
  };

  const addMemo = async (memo) => {
    const newMemo = {
      ...memo,
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workspace_id: workspaceId,
      isSynced: 0, // 👈 MODIFIÉ
    };
    await db.memos.add(newMemo);
    toast.success('✅ Mémo ajouté !');
    if (isOnline) {
      syncToCloud();
    }
  };

  const updateMemoWithSync = async (id, updates) => {
    const updatedMemo = { 
      ...updates, 
      updatedAt: new Date().toISOString(), 
      isSynced: 0 // 👈 MODIFIÉ
    };
    await db.memos.update(id, updatedMemo);
    toast.success('✅ Mémo mis à jour !');
    if (isOnline) {
      syncToCloud();
    }
  };

  const deleteMemoWithSync = async (id) => {
    await db.memos.delete(id);
    await db.deletionsPending.add({ id, tableName: TABLE_NAMES.MEMOS });
    toast.success('✅ Mémo supprimé !');
    if (isOnline) {
      syncToCloud();
    }
  };

  const signOut = async () => {
    const syncSuccessful = await syncToCloud();
    if (!syncSuccessful) {
      return;
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
    addMemo, 
    updateMemoWithSync, 
    deleteMemoWithSync,
    signOut, 
    getCardsToReview, 
    startReview,
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