import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDataSync } from '../context/DataSyncContext';
import { ArrowLeft, Clock, Tag } from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import './CourseViewer.css';

const CourseViewer = () => {
  const { courseId } = useParams();
  const { courses, subjects } = useDataSync();
  const navigate = useNavigate();

  const course = courses?.find(c => c.id.toString() === courseId);
  
  const subjectName = useMemo(() => {
    if (!course || !subjects) return 'N/A';
    const subject = subjects.find(s => s.id === course.subject_id);
    return subject ? subject.name : 'N/A';
  }, [course, subjects]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [courseId]);

  if (!course) {
    return (
      <div className="main-content">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Cours non trouvé</h2>
          <p className="text-muted-foreground mb-8">Ce cours n'existe pas ou a été supprimé.</p>
          <button onClick={() => navigate('/courses')} className="btn btn-primary">
            <ArrowLeft size={18} />
            Retour aux cours
          </button>
        </div>
      </div>
    );
  }

  const sanitizedHtml = DOMPurify.sanitize(marked.parse(course.content || ''));

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="main-content course-viewer">
      <div className="mb-6">
        <button onClick={() => navigate('/courses')} className="btn btn-secondary">
          <ArrowLeft size={18} />
          <span>Retour aux cours</span>
        </button>
      </div>

      <div className="course-viewer-header">
        <h1>{course.title}</h1>
        <div className="course-viewer-meta">
          <span className="flex items-center gap-1.5">
            <Tag size={16} />
            {subjectName}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={16} />
            Dernière modification : {formatDate(course.updated_at)}
          </span>
        </div>
      </div>

      <div className="course-viewer-content">
        <div
          className="course-content"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      </div>
    </div>
  );
};

export default CourseViewer;