import React, { useState, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';

const SubjectCombobox = ({ subjects = [], selectedSubject, setSelectedSubject }) => {
  const [query, setQuery] = useState('');

  const safeSubjects = subjects || [];

  const filteredSubjects =
    query === ''
      ? safeSubjects
      : safeSubjects.filter((subject) =>
          subject.name
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(query.toLowerCase().replace(/\s+/g, ''))
        );

  const showCreateOption = query !== '' && !subjects.some(s => s.name.toLowerCase() === query.toLowerCase());

  // Trouver l'objet sujet complet basé sur l'ID (ou le nom si l'ID est null)
  const getSelectedSubjectDisplay = () => {
    if (typeof selectedSubject === 'object' && selectedSubject !== null) {
      return selectedSubject;
    }
    return safeSubjects.find(s => s.id === selectedSubject) || null;
  };

  return (
    <div className="combobox">
      <Combobox value={selectedSubject} onChange={setSelectedSubject}>
        <div className="combobox-input-wrapper">
          <Combobox.Input
            className="input w-full" // Utilise la classe .input
            displayValue={(subjectId) => {
              // Gère à la fois l'objet complet et juste l'ID
              if (typeof subjectId === 'object' && subjectId !== null) {
                return subjectId.name;
              }
              const subject = safeSubjects.find(s => s.id === subjectId);
              return subject ? subject.name : '';
            }}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Matière (ex: Anatomie)"
          />
          <Combobox.Button className="icon">
            <ChevronsUpDown
              className="h-5 w-5"
              aria-hidden="true"
            />
          </Combobox.Button>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <Combobox.Options className="combobox-options">
            {filteredSubjects.length === 0 && query === '' ? (
              <div className="relative cursor-default select-none py-2 px-4 text-muted-foreground">
                Aucune matière.
              </div>
            ) : null}
            
            {filteredSubjects.map((subject) => (
                <Combobox.Option
                  key={subject.id}
                  className={({ active }) => `combobox-option ${active ? 'active' : ''}`}
                  value={subject.id} // S'assurer qu'on stocke l'ID
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {subject.name}
                      </span>
                      {selected ? (
                        <span
                          className="icon text-primary"
                        >
                          <Check className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Combobox.Option>
              ))
            }
            
            {showCreateOption && (
                 <Combobox.Option
                    // Note : la logique de création doit être gérée dans le composant parent
                    // Pour l'instant, cela sélectionne juste le texte
                    value={query} 
                    className={({ active }) => `combobox-option ${active ? 'active' : ''}`}
                 >
                    Créer "{query}"
                </Combobox.Option>
            )}
          </Combobox.Options>
        </Transition>
      </Combobox>
    </div>
  );
};

export default SubjectCombobox;