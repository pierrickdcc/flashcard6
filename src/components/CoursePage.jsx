import React, { useState, useMemo } from 'react';
import { useDataSync } from '../context/DataSyncContext';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, BookOpen, Search, MoreVertical, Edit, Trash2 } from 'lucide-react';
import EmptyState from './EmptyState';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import EditCourseModal from './EditCourseModal';

const CoursePage = () => {
  const { courses, subjects, updateCourse, deleteCourse } = useDataSync();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);

  const handleEdit = (course) => {
    setEditingCourse(course);
  };

  const handleSaveCourse = async (updatedCourse) => {
    await updateCourse(updatedCourse.id, updatedCourse);
    setEditingCourse(null);
  };

  const handleDelete = (course) => {
    setDeletingCourse(course);
  };

  const confirmDelete = async () => {
    if (deletingCourse) {
      await deleteCourse(deletingCourse.id);
      setDeletingCourse(null);
    }
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

  if (coursesBySubject.length === 0) {
    return (
      <div className="main-content">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Mes Cours</h1>
            <p className="text-muted-foreground">Parcourez et gérez vos pages de cours</p>
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mes Cours</h1>
          <p className="text-muted-foreground">Parcourez et gérez vos pages de cours</p>
        </div>
        <div className="search-bar" style={{ maxWidth: '300px' }}>
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

      <div className="course-list">
        {coursesBySubject.map(subject => (
          <div key={subject.id} className="course-subject-section">
            <h2>{subject.name}</h2>
            <div className="course-items">
              {subject.courses.map(course => (
                <div key={course.id} className="course-item">
                  <div className="course-item-main" onClick={() => handleCourseClick(course.id)} style={{ cursor: 'pointer', flexGrow: 1 }}>
                    <div className="course-item-icon">
                      <FileText size={20} />
                    </div>
                    <div className="course-item-text">
                      <h3>{course.title}</h3>
                    </div>
                  </div>
                  <div className="course-item-meta">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} />
                      Modifié {formatDate(course.updated_at)}
                    </span>
                  </div>
                  <div className="course-item-actions">
                    <button className="btn-icon" aria-label={`Modifier le cours ${course.title}`} onClick={(e) => { e.stopPropagation(); handleEdit(course); }}>
                      <Edit size={16} />
                    </button>
                    <button className="btn-icon" aria-label={`Supprimer le cours ${course.title}`} onClick={(e) => { e.stopPropagation(); handleDelete(course); }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <DeleteConfirmationModal
        itemName={deletingCourse?.title}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingCourse(null)}
      />

      <EditCourseModal
        course={editingCourse}
        subjects={subjects}
        onSave={handleSaveCourse}
        onCancel={() => setEditingCourse(null)}
      />
    </div>
  );
};

export default CoursePage;