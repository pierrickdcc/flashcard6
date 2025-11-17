import React, { useState, useEffect } from 'react';
import { X, Plus, BookOpen, Upload, Image as ImageIcon } from 'lucide-react';
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
  const [questionImage, setQuestionImage] = useState('');
  const [answerImage, setAnswerImage] = useState('');

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
        setQuestionImage(cardToEdit.question_image || '');
        setAnswerImage(cardToEdit.answer_image || '');
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
    setQuestionImage('');
    setAnswerImage('');
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
    if (typeof value === 'string' && !subjects.find(s => s.id === value)) {
      await addSubject(value);
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

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5 Mo');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        if (type === 'question') {
          setQuestionImage(base64String);
        } else {
          setAnswerImage(base64String);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSingleCardSubmit = () => {
    if (!question.trim() || !answer.trim() || !subjectId) {
      toast.error('La question, la réponse et la matière sont obligatoires.');
      return;
    }
    const cardData = { 
      question: question.trim(), 
      answer: answer.trim(), 
      subject_id: subjectId,
      question_image: questionImage || null,
      answer_image: answerImage || null,
    };
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
                    
                    {/* Image pour la question */}
                    <div style={{ marginTop: '0.75rem' }}>
                      <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                        <ImageIcon size={16} />
                        <span>Ajouter une image</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageUpload(e, 'question')}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {questionImage && (
                        <div style={{ marginTop: '0.75rem', position: 'relative' }}>
                          <img 
                            src={questionImage} 
                            alt="Question" 
                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                          />
                          <button
                            type="button"
                            onClick={() => setQuestionImage('')}
                            className="btn btn-danger"
                            style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                          >
                            Supprimer l'image
                          </button>
                        </div>
                      )}
                    </div>
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
                    
                    {/* Image pour la réponse */}
                    <div style={{ marginTop: '0.75rem' }}>
                      <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                        <ImageIcon size={16} />
                        <span>Ajouter une image</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageUpload(e, 'answer')}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {answerImage && (
                        <div style={{ marginTop: '0.75rem', position: 'relative' }}>
                          <img 
                            src={answerImage} 
                            alt="Réponse" 
                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                          />
                          <button
                            type="button"
                            onClick={() => setAnswerImage('')}
                            className="btn btn-danger"
                            style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                          >
                            Supprimer l'image
                          </button>
                        </div>
                      )}
                    </div>
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
                    Collez votre texte. Séparez recto/verso par <code className="bg-muted px-1 rounded">#</code> et la matière par un autre <code className="bg-muted px-1 rounded">#</code>. Une ligne par carte.
                  </p>
                  <p className="text-xs text-muted">
                    Exemple : <code className="bg-muted px-1 rounded">Capitale de France # Paris # Géographie</code>
                  </p>
                  <textarea 
                    value={bulkText} 
                    onChange={(e) => setBulkText(e.target.value)} 
                    placeholder="Question # Réponse # Matière&#10;Question 2 # Réponse 2 # Matière 2"
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