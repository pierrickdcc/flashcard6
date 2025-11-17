import React, { useState, useEffect } from 'react';

const EditCourseModal = ({ course, onSave, onCancel, subjects }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subjectId, setSubjectId] = useState('');

  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setContent(course.content);
      setSubjectId(course.subject_id);
    }
  }, [course]);

  if (!course) return null;

  const handleSave = () => {
    onSave({ ...course, title, content, subject_id: subjectId });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{width: '80%', maxWidth: '800px'}}>
        <h2 className="text-xl font-bold mb-4">Modifier le cours</h2>

        <div className="form-group">
          <label htmlFor="course-title">Titre</label>
          <input
            id="course-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="course-subject">Matière</label>
          <select
            id="course-subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="form-input"
          >
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="course-content">Contenu (HTML)</label>
          <textarea
            id="course-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="form-input"
            rows={15}
          />
        </div>

        <div className="modal-actions">
          <button onClick={onCancel} className="btn btn-secondary">
            Annuler
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCourseModal;
