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
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[rgba(255,255,255,0.02)]">
                      <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Nom</th>
                      <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Dernière modification</th>
                      <th className="p-3 text-center text-xs font-semibold uppercase text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subject.courses.map(course => (
                      <tr
                        key={course.id}
                        onClick={() => navigate(`/courses/${course.id}`)}
                        className="border-t border-border hover:bg-[rgba(255,255,255,0.03)] cursor-pointer transition-colors"
                      >
                        <td className="p-3 flex items-center gap-3 text-sm font-medium">
                          <FileText size={18} className="text-primary" />
                          {course.title}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(course.updated_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-center">
                           <button className="icon-btn" onClick={(e) => { e.stopPropagation(); /* logic to open dropdown */ }}>
                              <MoreVertical size={16} />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
