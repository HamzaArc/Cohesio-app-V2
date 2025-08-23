import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Trash2, Award, Calendar, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

function SkillsAndCerts({ employeeId }) {
  const { companyId } = useAppContext();
  const [items, setItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const [newItemType, setNewItemType] = useState('Skill');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId || !companyId) return;
    const itemsColRef = collection(db, "companies", companyId, "employees", employeeId, "skillsAndCerts");
    const unsubscribe = onSnapshot(itemsColRef, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [employeeId, companyId]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemText.trim() || !companyId) return;
    const itemsColRef = collection(db, "companies", companyId, "employees", employeeId, "skillsAndCerts");
    const newItem = {
        text: newItemText,
        type: newItemType,
        addedDate: new Date().toISOString().split('T')[0],
        ...(newItemType === 'Certification' && { expiryDate })
    };
    await addDoc(itemsColRef, newItem);
    setNewItemText('');
    setExpiryDate('');
  };

  const handleDeleteItem = async (itemId) => {
    if (!companyId) return;
    const itemRef = doc(db, "companies", companyId, "employees", employeeId, "skillsAndCerts", itemId);
    await deleteDoc(itemRef);
  };
  
  const isExpired = (dateStr) => {
      if (!dateStr) return false;
      return new Date(dateStr) < new Date();
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Skills & Certifications</h3>
        
        {/* Item List */}
        <div className="space-y-3">
            {items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-md bg-gray-50 border">
                    <div className="flex items-center">
                        <Award size={20} className={`mr-3 ${item.type === 'Certification' ? 'text-yellow-500' : 'text-blue-500'}`} />
                        <div>
                            <p className="font-semibold text-gray-800">{item.text}</p>
                            {item.type === 'Certification' && (
                                <p className={`text-xs flex items-center ${isExpired(item.expiryDate) ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                    <Calendar size={14} className="mr-1.5"/>
                                    Expires: {item.expiryDate || 'N/A'}
                                    {isExpired(item.expiryDate) && <AlertTriangle size={14} className="ml-1.5"/>}
                                </p>
                            )}
                        </div>
                    </div>
                    <button onClick={() => handleDeleteItem(item.id)} className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
             {items.length === 0 && !loading && <p className="text-center text-gray-500 py-4">No skills or certifications have been added.</p>}
        </div>

        {/* Add Item Form */}
        <form onSubmit={handleAddItem} className="mt-4 pt-4 border-t">
            <div className="flex flex-col md:flex-row gap-2">
                <select value={newItemType} onChange={e => setNewItemType(e.target.value)} className="border border-gray-300 rounded-md shadow-sm p-2 text-sm">
                    <option>Skill</option>
                    <option>Certification</option>
                </select>
                <input
                    type="text"
                    value={newItemText}
                    onChange={e => setNewItemText(e.target.value)}
                    placeholder={newItemType === 'Skill' ? 'e.g., Public Speaking' : 'e.g., Project Management Professional (PMP)'}
                    className="flex-grow border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                />
                {newItemType === 'Certification' && (
                    <input
                        type="date"
                        value={expiryDate}
                        onChange={e => setExpiryDate(e.target.value)}
                        className="border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                    />
                )}
                <button type="submit" className="bg-blue-600 text-white font-semibold p-2 rounded-lg hover:bg-blue-700">
                    <Plus size={20} />
                </button>
            </div>
        </form>
    </div>
  );
}

export default SkillsAndCerts;