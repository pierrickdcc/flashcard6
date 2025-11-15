import React, { useState, useEffect } from 'react';
import { X, Plus, BookOpen, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDataSync } from '../context/DataSyncContext';
import SubjectCombobox from './SubjectCombobox';

const AddContentModal = ({ isOpen, onClose, cardToEdit, courseToEdit }) => {
  const { subjects, addCard, updateCard, handleBulkAdd, addCourse, updateCourse, addSubject } = useDataSync();

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
      } else if (courseToEdit) {
        setActiveTab('course');
        setCourseTitle(courseToEdit.title || '');
        setCourseContent(courseToEdit.content || '');
        setCourseSubjectId(courseToEdit.subject_id || '');
      } else {
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

  const handleSubjectChange = async (value) => {
    // Si la valeur est un nom de matière (string) et non un ID, créer la matière
    if (typeof value === 'string' && !subjects.find(s => s.id === value)) {
      await addSubject(value);
      // La nouvelle matière sera disponible via la synchro
      const newSubject = subjects.find(s => s.name.toLowerCase() === value.toLowerCase());
      if (newSubject) {
        if (activeTab === 'flashcard') {
          setSubjectId(newSubject.id);
        } else {
          setCourseSubjectId(newSubject.id);
        }
      }
    } else {
      if (activeTab === 'flashcard') {
        setSubjectId(value);
      } else {
        setCourseSubjectId(value);
      }
    }
  };

  const handleSingleCardSubmit = () => {
    if (!question.trim() || !answer.trim() || !subjectId) {
      toast.error('La question, la réponse et la matière sont obligatoires.');
      return;
    }
    const cardData = { question: question.trim(), answer: answer.trim(), subject_id: subjectId };
    if (cardToEdit) {
      updateCard(cardToEdit.id, cardData);
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
    } else {
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
            {cardToEdit ? "Modifier la Flashcard" : courseToEdit ? "Modifier le Cours" : "Ajouter du contenu"}
          </h2>
          <button onClick={onClose} className="icon-btn" aria-label="Fermer le modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {!cardToEdit && !courseToEdit && (
            <div className="tabs-container">
              <button
                onClick={() => setActiveTab('flashcard')}
                className={`tab-button ${activeTab === 'flashcard' ? 'active' : ''}`}
              >
                <Plus size={16} /> Flashcard
              </button>
              <button
                onClick={() => setActiveTab('course')}
                className={`tab-button ${activeTab === 'course' ? 'active' : ''}`}
              >
                <BookOpen size={16} /> Cours
              </button>
            </div>
          )}

          {activeTab === 'flashcard' && (
            <div className="flex flex-col gap-4">
              {!cardToEdit && (
                <div className="tabs-container">
                  <button
                    onClick={() => setFlashcardMode('single')}
                    className={`tab-button ${flashcardMode === 'single' ? 'active' : ''}`}
                  >
                    <Plus size={16} /> Unique
                  </button>
                  <button
                    onClick={() => setFlashcardMode('bulk')}
                    className={`tab-button ${flashcardMode === 'bulk' ? 'active' : ''}`}
                  >
                    <Upload size={16} /> En masse
                  </button>
                </div>
              )}

              {flashcardMode === 'single' ? (
                <div className="flex flex-col gap-4">
                  <div className="form-group">
                    <label htmlFor="front" className="label">Recto (Question)</label>
                    <textarea 
                      id="front" 
                      value={question} 
                      onChange={(e) => setQuestion(e.target.value)} 
                      placeholder="Quelle est la capitale de la France ?" 
                      className="textarea" 
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="back" className="label">Verso (Réponse)</label>
                    <textarea 
                      id="back" 
                      value={answer} 
                      onChange={(e) => setAnswer(e.target.value)} 
                      placeholder="Paris" 
                      className="textarea" 
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Matière</label>
                    <SubjectCombobox 
                      subjects={subjects || []} 
                      selectedSubject={subjectId} 
                      setSelectedSubject={handleSubjectChange}
                    />
                    <p className="text-xs text-muted mt-1">
                      Tapez le nom d'une nouvelle matière pour la créer
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-muted">
                    Collez votre texte. Séparez recto/verso par <code className="bg-muted px-1 rounded">/</code> et la matière par un autre <code className="bg-muted px-1 rounded">/</code>. Une ligne par carte.
                  </p>
                  <p className="text-xs text-muted">
                    Exemple : <code className="bg-muted px-1 rounded">Capitale de France / Paris / Géographie</code>
                  </p>
                  <textarea 
                    value={bulkText} 
                    onChange={(e) => setBulkText(e.target.value)} 
                    placeholder="Question / Réponse / Matière&#10;Question 2 / Réponse 2 / Matière 2" 
                    className="textarea" 
                    rows="10"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'course' && (
            <div className="flex flex-col gap-4">
              <div className="form-group">
                <label htmlFor="course-title" className="label">Titre du cours</label>
                <input 
                  id="course-title" 
                  type="text" 
                  value={courseTitle} 
                  onChange={(e) => setCourseTitle(e.target.value)} 
                  placeholder="Introduction à la biologie cellulaire" 
                  className="input" 
                />
              </div>
              <div className="form-group">
                <label className="label">Matière</label>
                <SubjectCombobox 
                  subjects={subjects || []} 
                  selectedSubject={courseSubjectId} 
                  setSelectedSubject={handleSubjectChange}
                />
                <p className="text-xs text-muted mt-1">
                  Tapez le nom d'une nouvelle matière pour la créer
                </p>
              </div>
              <div className="form-group">
                <label htmlFor="course-content" className="label">Contenu (Markdown ou HTML)</label>
                <textarea 
                  id="course-content" 
                  value={courseContent} 
                  onChange={(e) => setCourseContent(e.target.value)} 
                  placeholder="# Titre&#10;&#10;## Sous-titre&#10;&#10;Votre contenu ici..." 
                  className="textarea" 
                  rows="12"
                />
                <p className="text-xs text-muted mt-1">
                  Supporte Markdown et HTML. Utilisez les classes CSS personnalisées pour les blocs spéciaux.
                </p>
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