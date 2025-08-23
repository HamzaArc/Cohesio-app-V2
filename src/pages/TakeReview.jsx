import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy, setDoc } from 'firebase/firestore';
import { Star, MessageSquare, GitBranch } from 'lucide-react';

// A reusable component for a single question in the review
const ReviewQuestion = ({ question, answer, onAnswerChange }) => {
    const getQuestionIcon = (type) => {
        switch(type) {
            case 'Rating': return <Star size={20} className="text-yellow-500" />;
            case 'Yes/No': return <GitBranch size={20} className="text-purple-500" />;
            default: return <MessageSquare size={20} className="text-blue-500" />;
        }
    };

    const renderAnswerInput = () => {
        switch(question.type) {
            case 'Rating':
                return (
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(rating => (
                            <button key={rating} onClick={() => onAnswerChange(question.id, rating)}>
                                <Star size={24} className={ (answer || 0) >= rating ? "text-yellow-400 fill-current" : "text-gray-300"} />
                            </button>
                        ))}
                    </div>
                );
            case 'Yes/No':
                return (
                    <div className="flex gap-2">
                        <button onClick={() => onAnswerChange(question.id, 'Yes')} className={`px-4 py-2 rounded-lg font-semibold text-sm ${answer === 'Yes' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Yes</button>
                        <button onClick={() => onAnswerChange(question.id, 'No')} className={`px-4 py-2 rounded-lg font-semibold text-sm ${answer === 'No' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}>No</button>
                    </div>
                );
            case 'Text':
            default:
                return <textarea value={answer || ''} onChange={(e) => onAnswerChange(question.id, e.target.value)} rows="4" className="w-full border border-gray-300 rounded-md shadow-sm p-2" />;
        }
    };

    return (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start">
                <div className="mr-3 pt-1">{getQuestionIcon(question.type)}</div>
                <p className="font-semibold text-gray-800 flex-1">{question.text}</p>
            </div>
            <div className="mt-4 pl-8">
                {renderAnswerInput()}
            </div>
        </div>
    );
};


function TakeReview() {
  const { reviewId } = useParams();
  const [review, setReview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reviewId) { setLoading(false); return; }
    
    const reviewRef = doc(db, 'reviews', reviewId);
    const unsubReview = onSnapshot(reviewRef, (docSnap) => {
      if (docSnap.exists()) {
        const reviewData = { id: docSnap.id, ...docSnap.data() };
        setReview(reviewData);
        if (reviewData.answers) {
            setAnswers(reviewData.answers);
        }

        // Fetch questions once we have the template ID
        const questionsQuery = query(collection(db, 'reviewTemplates', reviewData.templateId, 'questions'), orderBy('createdAt', 'asc'));
        const unsubQuestions = onSnapshot(questionsQuery, (snap) => {
            setQuestions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubQuestions();
      } else {
        setLoading(false);
      }
    });

    return () => unsubReview();
  }, [reviewId]);

  const handleAnswerChange = useCallback(async (questionId, answer) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    
    // Auto-save the answers to the database
    const reviewRef = doc(db, 'reviews', reviewId);
    await setDoc(reviewRef, { answers: newAnswers }, { merge: true });
  }, [answers, reviewId]);

  if (loading) { return <div className="p-8">Loading Review...</div>; }
  if (!review) { return <div className="p-8">Review not found.</div>; }

  return (
    <div className="p-8">
      <header className="mb-8">
        <Link to="/performance" className="text-sm text-blue-600 font-semibold inline-block hover:underline mb-2">&larr; Back to Performance</Link>
        <h1 className="text-3xl font-bold text-gray-800">{review.title}</h1>
        <p className="text-gray-500">Due Date: {review.dueDate}</p>
      </header>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="space-y-4">
            {questions.map(q => (
                <ReviewQuestion 
                    key={q.id} 
                    question={q}
                    answer={answers[q.id]}
                    onAnswerChange={handleAnswerChange}
                />
            ))}
        </div>
      </div>
    </div>
  );
}

export default TakeReview;
