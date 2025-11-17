import React, { useState, useMemo } from 'react';
import { useDataSync } from '../context/DataSyncContext';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, BookOpen, Search, Edit, Trash2, X } from 'lucide-react';
import EmptyState from './EmptyState';

const CoursePage = () => {
  const { courses, subjects, updateCourse, deleteCourse } = useDataSync();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);

  // États pour les modales
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // États pour le formulaire d'édition
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSubjectId, setEditSubjectId] = useState('');

  const handleEdit = (course) => {
    setEditingCourse(course);
    setEditTitle(course.title || '');
    setEditContent(course.content || '');
    setEditSubjectId(course.subject_id || '');
    setShowEditModal(true);
  };

  const handleSaveCourse = async () => {
    if (!editingCourse) return;
    
    const updatedCourse = {
      ...editingCourse,
      title: editTitle,
      content: editContent,
      subject_id: editSubjectId,
    };
    
    await updateCourse(editingCourse.id, updatedCourse);
    setShowEditModal(false);
    setEditingCourse(null);
  };

  const handleDelete = (course) => {
    setDeletingCourse(course);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingCourse) return;
    await deleteCourse(deletingCourse.id);
    setShowDeleteModal(false);
    setDeletingCourse(null);
  };

  const coursesBySubject = useMemo(() => {
    if (!courses || !subjects) return [];

    let filteredCourses = courses;
    if (searchQuery.trim() !== '') {
        const lowercasedQuery = searchQuery.toLowerCase();
        filteredCourses = courses.filter(course =>
            (course.title && course.title.toLowerCase().includes(lowercasedQuery)) ||
            (course.content && course.content.toLowerCase().includes(lowercasedQuery))
        );
    }
    
    return subjects
      .map(subject => ({
        ...subject,
        courses: filteredCourses.filter(course => course.subject_id === subject.id)
      }))
      .filter(subject => subject.courses.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [courses, subjects, searchQuery]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    }).format(date);
  };

  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  if (coursesBySubject.length === 0 && !searchQuery) {
    return (
      <div className="main-content">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-heading-color)', marginBottom: '0.5rem' }}>
              Mes Cours
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Parcourez et gérez vos pages de cours
            </p>
          </div>
        </div>
        <EmptyState
          icon={BookOpen}
          title="Aucun cours trouvé"
          message="Ajoutez votre premier cours pour le voir apparaître ici."
        />
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-heading-color)', marginBottom: '0.5rem' }}>
            Mes Cours
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Parcourez et gérez vos pages de cours
          </p>
        </div>
        <div className="search-bar" style={{ maxWidth: '300px', minWidth: '200px' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un cours..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Course List */}
      {coursesBySubject.length === 0 && searchQuery ? (
        <EmptyState
          icon={BookOpen}
          title="Aucun résultat"
          message="Aucun cours ne correspond à votre recherche."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {coursesBySubject.map(subject => (
            <div key={subject.id}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-heading-color)',
                marginBottom: '0.75rem',
                paddingBottom: '0.5rem',
                borderBottom: '2px solid var(--primary-color)',
                display: 'inline-block'
              }}>
                {subject.name}
              </h2>
              
              <div className="glass-card" style={{ padding: 0, marginTop: '0.75rem' }}>
                {/* Table Header */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--muted-bg)',
                  borderBottom: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <div>Titre</div>
                  <div style={{ textAlign: 'center', width: '140px' }}>Dernière modif.</div>
                  <div style={{ textAlign: 'center', width: '80px' }}>Actions</div>
                </div>

                {/* Course Rows */}
                {subject.courses.map((course, index) => (
                  <div 
                    key={course.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      gap: '0.5rem',
                      padding: '0.875rem 1rem',
                      alignItems: 'center',
                      borderBottom: index < subject.courses.length - 1 ? '1px solid var(--border-color)' : 'none',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Course Title */}
                    <div 
                      onClick={() => handleCourseClick(course.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        minWidth: 0,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--primary-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0
                      }}>
                        <FileText size={16} />
                      </div>
                      <h3 style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: 'var(--text-heading-color)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {course.title}
                      </h3>
                    </div>

                    {/* Date */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                      width: '140px',
                      justifyContent: 'center'
                    }}>
                      <Clock size={14} />
                      <span>{formatDate(course.updated_at)}</span>
                    </div>

                    {/* Actions */}
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        width: '80px',
                        justifyContent: 'center'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(course);
                        }}
                        className="icon-btn"
                        style={{ padding: '0.5rem' }}
                        aria-label={`Modifier ${course.title}`}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(course);
                        }}
                        className="icon-btn"
                        style={{ padding: '0.5rem', color: '#ef4444' }}
                        aria-label={`Supprimer ${course.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'édition */}
      {showEditModal && editingCourse && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Modifier le cours</h2>
              <button onClick={() => setShowEditModal(false)} className="icon-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="course-title" className="label">Titre du cours</label>
                <input
                  id="course-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="course-subject" className="label">Matière</label>
                <select
                  id="course-subject"
                  value={editSubjectId}
                  onChange={(e) => setEditSubjectId(e.target.value)}
                  className="select"
                >
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="course-content" className="label">Contenu (HTML/Markdown)</label>
                <textarea
                  id="course-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="textarea"
                  rows={12}
                  style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Supporte Markdown et HTML. Utilisez les classes CSS personnalisées pour les blocs spéciaux.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                Annuler
              </button>
              <button onClick={handleSaveCourse} className="btn btn-primary">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {showDeleteModal && deletingCourse && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmer la suppression</h2>
              <button onClick={() => setShowDeleteModal(false)} className="icon-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: 'var(--text-heading-color)' }}>
                Êtes-vous sûr de vouloir supprimer "<strong>{deletingCourse.title}</strong>" ?
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Cette action est irréversible.
              </p>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">
                Annuler
              </button>
              <button onClick={confirmDelete} className="btn btn-danger">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePage;
