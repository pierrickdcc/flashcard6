import React, { useState, useEffect } from 'react';
import { X, Plus, BookOpen, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDataSync } from '../context/DataSyncContext';
import SubjectCombobox from './SubjectCombobox';

const AddContentModal = ({ isOpen, onClose, cardToEdit, courseToEdit }) => {
  const { subjects, addCard, updateCardWithSync, handleBulkAdd, addCourse, updateCourse } = useDataSync();

  const [activeTab, setActiveTab] = useState('flashcard');
  const [flashcardMode, setFlashcardMode] = useState('single');

  // Fields for single flashcard
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [subjectId, setSubjectId] = useState('');

  // Field for bulk flashcards
  const [bulkText, setBulkText] = useState('');

  // Fields for course
  const [courseTitle, setCourseTitle] = useState('');
  const [courseContent, setCourseContent] = useState('');
  const [courseSubjectId, setCourseSubjectId] = useState('');


  useEffect(() => {
    if (isOpen) {
        if (cardToEdit) {
            setActiveTab('flashcard');
            setFlashcardMode('single');
            setQuestion(cardToEdit.question || '');
            setAnswer(cardToEdit.answer || '');
            setSubjectId(cardToEdit.subject_id || '');
        }
        else if (courseToEdit) {
            setActiveTab('course');
            setCourseTitle(courseToEdit.title || '');
            setCourseContent(courseToEdit.content || '');
            setCourseSubjectId(courseToEdit.subject_id || '');
        }
        else {
            resetAllFields();
        }
    }
  }, [isOpen, cardToEdit, courseToEdit]);

  const resetAllFields = () => {
    setQuestion('');
    setAnswer('');
    setBulkText('');
    setCourseTitle('');
    setCourseContent('');
    if (subjects && subjects.length > 0) {
        setSubjectId(subjects[0].id);
        setCourseSubjectId(subjects[0].id);
    } else {
        setSubjectId('');
        setCourseSubjectId('');
    }
  };


  const handleSingleCardSubmit = () => {
    if (!question.trim() || !answer.trim() || !subjectId) {
      toast.error('La question, la réponse et la matière sont obligatoires.');
      return;
    }
    const cardData = { question: question.trim(), answer: answer.trim(), subject_id: subjectId };
    if (cardToEdit) {
      updateCardWithSync(cardToEdit.id, cardData);
    } else {
      addCard(cardData);
    }
    onClose();
  };

  const handleBulkAddSubmit = () => {
    if (!bulkText.trim()) {
      toast.error('Le champ ne peut pas être vide.');
      return;
    }
    handleBulkAdd(bulkText);
    onClose();
  };

  const handleCourseSubmit = () => {
    if (!courseTitle.trim() || !courseContent.trim() || !courseSubjectId) {
      toast.error('Le titre, le contenu et la matière sont obligatoires.');
      return;
    }
    const courseData = { title: courseTitle.trim(), content: courseContent.trim(), subject_id: courseSubjectId };
    if (courseToEdit) {
        updateCourse(courseToEdit.id, courseData);
    } else {
        addCourse(courseData);
    }
    onClose();
  };

  const handleSubmit = () => {
    if (activeTab === 'flashcard') {
      if (flashcardMode === 'single') {
        handleSingleCardSubmit();
      } else {
        handleBulkAddSubmit();
      }
    } else { // activeTab is 'course'
      handleCourseSubmit();
    }
  };


  const handleClose = (e) => {
    if (e.target.id === 'modal-backdrop') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-backdrop"
      onClick={handleClose}
      className="modal-backdrop"
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2>
            {cardToEdit ? "Modifier la Flashcard" : courseToEdit ? "Modifier le Cours" : "Que souhaitez-vous créer ?"}
          </h2>
          <button onClick={onClose} className="icon-btn" aria-label="Fermer le modal"><X size={20} /></button>
        </div>

        <div className="modal-body">
            <div className="view-button-container">
                <button
                    onClick={() => setActiveTab('flashcard')}
                    className={`view-button ${activeTab === 'flashcard' ? 'active' : ''}`}
                >
                    <Plus size={16} /> Flashcard
                </button>
                <button
                    onClick={() => setActiveTab('course')}
                    className={`view-button ${activeTab === 'course' ? 'active' : ''}`}
                >
                    <BookOpen size={16} /> Cours
                </button>
            </div>

          {activeTab === 'flashcard' && (
            <div className="flex flex-col gap-4">
              <div className="tabs-container">
                  <button
                      onClick={() => setFlashcardMode('single')}
                      className={`tab-button ${flashcardMode === 'single' ? 'active' : ''}`}
                  >
                      <Plus size={16} /> Flashcard unique
                  </button>
                  <button
                      onClick={() => setFlashcardMode('bulk')}
                      className={`tab-button ${flashcardMode === 'bulk' ? 'active' : ''}`}
                  >
                      <Upload size={16} /> Importer en masse
                  </button>
              </div>

              {flashcardMode === 'single' ? (
                <div className="flex flex-col gap-4">
                  <div className="form-group">
                      <label htmlFor="front" className="label">Recto</label>
                      <textarea id="front" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question..." className="textarea" rows="3"></textarea>
                  </div>
                  <div className="form-group">
                      <label htmlFor="back" className="label">Verso</label>
                      <textarea id="back" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Réponse..." className="textarea" rows="3"></textarea>
                  </div>
                  <div className="form-group">
                    <label className="label">Matière</label>
                    <SubjectCombobox subjects={subjects || []} selectedSubject={subjectId} setSelectedSubject={setSubjectId} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                    <p className="text-xs text-gray-400">
                        Collez votre texte. Séparez recto/verso par <code className="bg-gray-700 px-1 rounded">/</code> et la matière par un autre <code className="bg-gray-700 px-1 rounded">/</code>.
                    </p>
                    <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Question / Réponse / Matière..." className="textarea" rows="8"></textarea>
                </div>
              )}
            </div>
          )}

          {activeTab === 'course' && (
            <div className="flex flex-col gap-4">
                <div className="form-group">
                    <label htmlFor="course-title" className="label">Titre du cours</label>
                    <input id="course-title" type="text" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} placeholder="Titre du cours" className="input" />
                </div>
                <div className="form-group">
                    <label className="label">Matière</label>
                    <SubjectCombobox subjects={subjects || []} selectedSubject={courseSubjectId} setSelectedSubject={setCourseSubjectId} />
                </div>
                <div className="form-group">
                    <label htmlFor="course-content" className="label">Contenu (Markdown ou HTML)</label>
                    <textarea id="course-content" value={courseContent} onChange={(e) => setCourseContent(e.target.value)} placeholder="Collez votre contenu ici..." className="textarea" rows="8"></textarea>
                </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Annuler
          </button>
          <button onClick={handleSubmit} className="btn btn-primary">
            {cardToEdit || courseToEdit ? 'Mettre à jour' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddContentModal;