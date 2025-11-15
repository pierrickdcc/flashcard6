import React, { useState, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';

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

  const showCreateOption = query !== '' && !safeSubjects.some(s => s.name.toLowerCase() === query.toLowerCase());

  return (
    <div className="combobox">
      <Combobox value={selectedSubject} onChange={setSelectedSubject}>
        <div className="combobox-input-wrapper">
          <Combobox.Input
            className="input w-full"
            displayValue={(subjectId) => {
              if (typeof subjectId === 'object' && subjectId !== null) {
                return subjectId.name;
              }
              const subject = safeSubjects.find(s => s.id === subjectId);
              return subject ? subject.name : '';
            }}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Choisir ou créer une matière..."
          />
          <Combobox.Button className="icon">
            <ChevronsUpDown className="h-5 w-5" aria-hidden="true" />
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
              <div className="relative cursor-default select-none py-2 px-4" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Aucune matière.
              </div>
            ) : null}
            
            {filteredSubjects.map((subject) => (
              <Combobox.Option
                key={subject.id}
                className={({ active }) => `combobox-option ${active ? 'active' : ''}`}
                value={subject.id}
              >
                {({ selected }) => (
                  <>
                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                      {subject.name}
                    </span>
                    {selected ? (
                      <span className="icon">
                        <Check className="h-5 w-5" aria-hidden="true" style={{ color: 'var(--primary-color)' }} />
                      </span>
                    ) : null}
                  </>
                )}
              </Combobox.Option>
            ))}
            
            {showCreateOption && (
              <Combobox.Option
                value={query}
                className={({ active }) => `combobox-option ${active ? 'active' : ''}`}
                style={{ fontWeight: 500 }}
              >
                <Plus size={18} className="icon" style={{ color: 'var(--primary-color)' }} />
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