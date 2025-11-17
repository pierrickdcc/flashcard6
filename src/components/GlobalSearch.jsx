import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useDataSync } from '../context/DataSyncContext';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, StickyNote, Layers } from 'lucide-react';

const GlobalSearch = () => {
    const { cards, courses, memos } = useDataSync();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const searchRef = useRef(null);

    const searchResults = useMemo(() => {
        if (query.trim().length < 2) return null;

        const lowercasedQuery = query.toLowerCase();

        const foundCards = cards
            .filter(card =>
                card.question?.toLowerCase().includes(lowercasedQuery) ||
                card.answer?.toLowerCase().includes(lowercasedQuery)
            )
            .slice(0, 5);

        const foundCourses = courses
            .filter(course =>
                course.title?.toLowerCase().includes(lowercasedQuery) ||
                course.content?.toLowerCase().includes(lowercasedQuery)
            )
            .slice(0, 5);

        const foundMemos = memos
            .filter(memo => memo.content?.toLowerCase().includes(lowercasedQuery))
            .slice(0, 5);

        if (foundCards.length === 0 && foundCourses.length === 0 && foundMemos.length === 0) {
            return null;
        }

        return { cards: foundCards, courses: foundCourses, memos: foundMemos };
    }, [query, cards, courses, memos]);

    const handleResultClick = (path) => {
        navigate(path);
        setQuery('');
        setIsFocused(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={searchRef} className="global-search-container">
            <div className="search-bar">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Recherche globale..."
                    className="search-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                />
            </div>
            {isFocused && searchResults && (
                <div className="search-results-popover">
                    {searchResults.courses.length > 0 && (
                        <div className="results-group">
                            <h3 className="group-title"><FileText size={14} /> Cours</h3>
                            {searchResults.courses.map(course => (
                                <div key={course.id} className="result-item" onClick={() => handleResultClick(`/courses/${course.id}`)}>
                                    {course.title}
                                </div>
                            ))}
                        </div>
                    )}
                    {searchResults.cards.length > 0 && (
                        <div className="results-group">
                             <h3 className="group-title"><Layers size={14} /> Flashcards</h3>
                            {searchResults.cards.map(card => (
                                <div key={card.id} className="result-item" onClick={() => handleResultClick('/flashcards')}>
                                    {card.question}
                                </div>
                            ))}
                        </div>
                    )}
                    {searchResults.memos.length > 0 && (
                        <div className="results-group">
                            <h3 className="group-title"><StickyNote size={14} /> Mémos</h3>
                            {searchResults.memos.map(memo => (
                                <div key={memo.id} className="result-item" onClick={() => handleResultClick('/memos')}>
                                    {memo.content.substring(0, 50)}...
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
