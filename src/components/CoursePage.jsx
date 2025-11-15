import React, { useMemo } from 'react';
import { useDataSync } from '../context/DataSyncContext';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, BookOpen } from 'lucide-react';
import EmptyState from './EmptyState';

const CoursePage = () => {
  const { courses, subjects } = useDataSync();
  const navigate = useNavigate();

  const coursesBySubject = useMemo(() => {
    if (!courses || !subjects) return [];
    
    return subjects
      .map(subject => ({
        ...subject,
        courses: courses.filter(course => course.subject_id === subject.id)
      }))
      .filter(subject => subject.courses.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [courses, subjects]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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
            <p className="text-muted-foreground">Parcourez et gérez vos pages de cours.</p>
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
          <p className="text-muted-foreground">Parcourez et gérez vos pages de cours.</p>
        </div>
      </div>

      <div className="course-list">
        {coursesBySubject.map(subject => (
          <div key={subject.id} className="course-subject-section">
            <h2>{subject.name}</h2>
            <div className="course-items">
              {subject.courses.map(course => (
                <div
                  key={course.id}
                  className="course-item"
                  onClick={() => handleCourseClick(course.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="course-item-main">
                    <div className="course-item-icon">
                      <FileText size={20} />
                    </div>
                    <div className="course-item-text">
                      <h3>{course.title}</h3>
                    </div>
                  </div>
                  <div className="course-item-meta">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {formatDate(course.updated_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoursePage;