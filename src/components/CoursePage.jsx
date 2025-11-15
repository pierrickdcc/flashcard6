import React from 'react';
import { useDataSync } from '../context/DataSyncContext';
import { useNavigate } from 'react-router-dom';
import { FileText, MoreVertical } from 'lucide-react';

const CoursePage = () => {
  const { courses, subjects } = useDataSync();
  const navigate = useNavigate();

  const coursesBySubject = subjects.map(subject => ({
    ...subject,
    courses: courses.filter(course => course.subject_id === subject.id)
  })).filter(subject => subject.courses.length > 0);

  return (
    <div className="main-content">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mes Cours</h1>
          <p className="text-muted-foreground">Parcourez et gérez vos pages de cours.</p>
        </div>
      </div>

      <div className="space-y-10">
        {coursesBySubject.length > 0 ? (
          coursesBySubject.map(subject => (
            <div key={subject.id}>
              <h2 className="text-xl font-bold text-primary border-b-2 border-primary inline-block pb-2 mb-4">{subject.name}</h2>
              <div className="course-grid">
                {subject.courses.map(course => (
                  <div
                    key={course.id}
                    className="course-card"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    <div className="course-card-top">
                      <FileText size={24} className="text-primary" />
                      <button className="icon-btn-sm" onClick={(e) => { e.stopPropagation(); /* logic to open dropdown */ }}>
                        <MoreVertical size={16} />
                      </button>
                    </div>
                    <div className="course-card-content">
                      <h3 className="font-bold text-heading">{course.title}</h3>
                    </div>
                    <div className="course-card-footer">
                      <span>Dernière modification</span>
                      <span>{new Date(course.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-card border border-border rounded-lg">
            <FileText size={48} className="mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Aucun cours trouvé</h3>
            <p className="mt-2 text-sm text-muted-foreground">Ajoutez votre premier cours pour le voir apparaître ici.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePage;
