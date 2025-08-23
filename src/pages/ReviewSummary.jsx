import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { Star, MessageSquare, GitBranch, Send, CheckCircle, XCircle } from 'lucide-react';

const ReviewQuestion = ({ question, answer }) => {
    const getQuestionIcon = (type) => {
        switch(type) {
            case 'Rating': return <Star size={20} className="text-yellow-500" />;
            case 'Yes/No': return <GitBranch size={20} className="text-purple-500" />;
            default: return <MessageSquare size={20} className="text-blue-500" />;
        }
    };

    const renderAnswer = () => {
        switch(question.type) {
            case 'Rating':
                return <div className="flex gap-1">{[1, 2, 3, 4, 5].map(rating => <Star key={rating} size={24} className={ (answer || 0) >= rating ? "text-yellow-400 fill-current" : "text-gray-300"} />)}</div>;
            case 'Yes/No':
                return <p className={`font-semibold ${answer === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>{answer}</p>;
            case 'Text':
            default:
                return <p className="text-gray-700 whitespace-pre-wrap">{answer || 'No answer provided.'}</p>;
        }
    };

    return (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start"><div className="mr-3 pt-1">{getQuestionIcon(question.type)}</div><p className="font-semibold text-gray-800 flex-1">{question.text}</p></div>
            <div className="mt-4 pl-8">{renderAnswer()}</div>
        </div>
    );
};

const HistoryItem = ({ icon, title, date, isLast }) => (
    <div className="relative pl-8">
        {!isLast && <div className="absolute left-[7px] top-5 h-full w-0.5 bg-gray-200"></div>}
        <div className="absolute left-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-white">{icon}</div>
        <p className="font-semibold text-gray-700">{title}</p>
        <p className="text-xs text-gray-500">{date}</p>
    </div>
);

function ReviewSummary() {
  const { reviewId } = useParams();
  const [review, setReview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reviewId) { setLoading(false); return; }
    
    const reviewRef = doc(db, 'reviews', reviewId);
    const unsubReview = onSnapshot(reviewRef, (docSnap) => {
      if (docSnap.exists()) {
        const reviewData = { id: docSnap.id, ...docSnap.data() };
        setReview(reviewData);
        const questionsQuery = query(collection(db, 'reviewTemplates', reviewData.templateId, 'questions'), orderBy('createdAt', 'asc'));
        const unsubQuestions = onSnapshot(questionsQuery, (snap) => {
            setQuestions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubQuestions();
      } else { setLoading(false); }
    });

    const historyQuery = query(collection(db, 'reviews', reviewId, 'history'), orderBy('timestamp', 'asc'));
    const unsubHistory = onSnapshot(historyQuery, (snap) => {
        setHistory(snap.docs.map(doc => ({ ...doc.data(), timestamp: doc.data().timestamp?.toDate().toLocaleString() })));
    });

    return () => { unsubReview(); unsubHistory(); };
  }, [reviewId]);

  const getHistoryIcon = (action) => {
      switch(action) {
          case 'Created': return <Send size={16} className="text-blue-500" />;
          case 'Completed': return <CheckCircle size={16} className="text-green-500" />;
          default: return <XCircle size={16} className="text-gray-500" />;
      }
  }

  if (loading) { return <div className="p-8">Loading Review Summary...</div>; }
  if (!review) { return <div className="p-8">Review not found.</div>; }

  return (
    <div className="p-8">
      <header className="mb-8">
        <Link to="/performance" className="text-sm text-blue-600 font-semibold inline-block hover:underline mb-2">&larr; Back to Performance</Link>
        <h1 className="text-3xl font-bold text-gray-800">{review.title}</h1>
        <p className="text-gray-500">Completed Review</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
            {questions.map(q => (
                <ReviewQuestion key={q.id} question={q} answer={review.answers?.[q.id]} />
            ))}
        </div>
        <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-8">
                <h3 className="font-bold text-gray-800 mb-4">History</h3>
                <div className="space-y-4">
                    {history.map((item, index) => (
                        <HistoryItem 
                            key={index}
                            icon={getHistoryIcon(item.action)}
                            title={item.action}
                            date={item.timestamp}
                            isLast={index === history.length - 1}
                        />
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewSummary;
