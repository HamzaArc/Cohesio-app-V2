import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Plus, DollarSign, ArrowUp, Briefcase, User, Users, Home, Phone, Shield, Plane, Heart, Sun } from 'lucide-react';
import { db } from '../firebase';
import { doc, onSnapshot, deleteDoc, collection, query, orderBy } from 'firebase/firestore';
import { useAppContext } from '../contexts/AppContext';
import EditEmployeeModal from '../components/EditEmployeeModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import AddJourneyEventModal from '../components/AddJourneyEventModal';
import OnboardingPlan from '../components/OnboardingPlan';
import SkillsAndCerts from '../components/SkillsAndCerts';
import PrivateNotes from '../components/PrivateNotes';

const ProfileTab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`py-3 px-4 text-sm font-semibold whitespace-nowrap transition-colors ${
      active
        ? 'border-b-2 border-blue-600 text-blue-600'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    {label}
  </button>
);

const InfoSection = ({ title, children, onEdit }) => ( <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-800">{title}</h3>{onEdit && <button onClick={onEdit} className="text-sm font-semibold text-blue-600 hover:underline">Edit</button>}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">{children}</div></div> );
const InfoField = ({ icon, label, value }) => ( <div className="flex items-start"><div className="flex-shrink-0 w-6 text-gray-400 pt-0.5">{icon}</div><div><p className="text-xs text-gray-500">{label}</p><p className="font-semibold text-gray-800">{value || 'N/A'}</p></div></div> );

function EmployeeProfile() {
  const { companyId } = useAppContext();
  const [activeTab, setActiveTab] = useState('Job');
  const [employee, setEmployee] = useState(null);
  const [journey, setJourney] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { employeeId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!employeeId || !companyId) return;

    setLoading(true);
    const docRef = doc(db, 'companies', companyId, 'employees', employeeId);
    const unsubscribeEmployee = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) setEmployee({ id: docSnap.id, ...docSnap.data() });
      else setEmployee(null);
      setLoading(false);
    });

    const journeyColRef = collection(db, 'companies', companyId, 'employees', employeeId, 'journey');
    const q = query(journeyColRef, orderBy('date', 'desc'));
    const unsubscribeJourney = onSnapshot(q, (snapshot) => {
      setJourney(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeEmployee();
      unsubscribeJourney();
    };
  }, [employeeId, companyId]);

  const handleDelete = async () => {
    if (!companyId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'companies', companyId, 'employees', employeeId));
      navigate('/people');
    } catch (err) {
      console.error('Error deleting employee:', err);
      setIsDeleting(false);
    }
  };

  const getJourneyIcon = (type) => {
    switch (type) {
      case 'Salary Change': return <DollarSign size={16} className="text-green-500" />;
      case 'Promotion': return <ArrowUp size={16} className="text-purple-500" />;
      case 'Title Change':
      case 'Department Change':
        return <Briefcase size={16} className="text-blue-500" />;
      default: return <Plus size={16} className="text-gray-500" />;
    }
  };

  if (loading) return <div className="p-8">Loading profile...</div>;
  if (!employee) return <div className="p-8">Employee not found.</div>;

  return (
    <>
      <EditEmployeeModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} employee={employee} onEmployeeUpdated={() => setIsEditModalOpen(false)} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDelete} employeeName={employee.name} loading={isDeleting} />
      <AddJourneyEventModal isOpen={isJourneyModalOpen} onClose={() => setIsJourneyModalOpen(false)} onEventAdded={() => setIsJourneyModalOpen(false)} employeeId={employee.id} />

      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <Link to="/people" className="text-sm text-blue-600 font-semibold inline-block hover:underline">&larr; Back to People</Link>
          <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center text-sm text-red-600 bg-red-100 hover:bg-red-200 font-semibold py-2 px-4 rounded-lg"><Trash2 size={16} className="mr-2" />Delete Employee</button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/4">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center border border-gray-200 sticky top-8">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <img src={`https://placehold.co/100x100/E2E8F0/4A5568?text=${employee.name.charAt(0)}`} alt={employee.name} className="w-24 h-24 rounded-full" />
                <button onClick={() => setIsEditModalOpen(true)} className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 border border-gray-200"><Edit2 size={16} className="text-gray-600" /></button>
              </div>
              <h2 className="text-xl font-bold text-gray-800">{employee.name}</h2>
              <p className="text-gray-500 mb-4">{employee.position}</p>
              <div className="text-sm text-gray-600 space-y-2 text-left border-t border-gray-100 pt-4">
                <p><span className="font-semibold">Status:</span> <span className={`capitalize font-medium ${employee.status === 'active' ? 'text-green-700' : 'text-yellow-700'}`}>{employee.status}</span></p>
                <p><span className="font-semibold">Email:</span> <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">{employee.email || 'N/A'}</a></p>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-3/4">
            <div className="border-b border-gray-200 bg-white rounded-t-lg shadow-sm">
              <div className="flex items-center px-2 overflow-x-auto">
                <ProfileTab label="Job" active={activeTab === 'Job'} onClick={() => setActiveTab('Job')} />
                <ProfileTab label="Personal" active={activeTab === 'Personal'} onClick={() => setActiveTab('Personal')} />
                <ProfileTab label="Time Off" active={activeTab === 'Time Off'} onClick={() => setActiveTab('Time Off')} />
                <ProfileTab label="Onboarding" active={activeTab === 'Onboarding'} onClick={() => setActiveTab('Onboarding')} />
                <ProfileTab label="Skills" active={activeTab === 'Skills'} onClick={() => setActiveTab('Skills')} />
                <ProfileTab label="Notes" active={activeTab === 'Notes'} onClick={() => setActiveTab('Notes')} />
                <ProfileTab label="Journey" active={activeTab === 'Journey'} onClick={() => setActiveTab('Journey')} />
              </div>
            </div>

            <div className="mt-6">
              {activeTab === 'Job' && (
                <div className="space-y-6">
                  <InfoSection title="Employment Details" onEdit={() => setIsEditModalOpen(true)}>
                    <InfoField icon={<Briefcase size={16} />} label="Position" value={employee.position} />
                    <InfoField icon={<Users size={16} />} label="Department" value={employee.department} />
                    <InfoField icon={<Briefcase size={16} />} label="Employment Type" value={employee.employmentType} />
                    <InfoField icon={<Users size={16} />} label="Reports To" value={employee.managerEmail} />
                  </InfoSection>
                  <InfoSection title="Compensation" onEdit={() => setIsEditModalOpen(true)}>
                    <InfoField icon={<DollarSign size={16} />} label="Pay Rate" value={employee.compensation} />
                  </InfoSection>
                </div>
              )}
              {activeTab === 'Personal' && (
                <div className="space-y-6">
                  <InfoSection title="Contact Information" onEdit={() => setIsEditModalOpen(true)}>
                    <InfoField icon={<Phone size={16} />} label="Phone (Work)" value={employee.phone} />
                    <InfoField icon={<Home size={16} />} label="Address" value={employee.address} />
                  </InfoSection>
                  <InfoSection title="Emergency Contact" onEdit={() => setIsEditModalOpen(true)}>
                    <InfoField icon={<User size={16} />} label="Contact Name" value={employee.emergencyContactName} />
                    <InfoField icon={<Shield size={16} />} label="Relationship" value={employee.emergencyContactRelationship} />
                    <InfoField icon={<Phone size={16} />} label="Contact Phone" value={employee.emergencyContactPhone} />
                  </InfoSection>
                </div>
              )}
              {activeTab === 'Time Off' && (
                <div className="space-y-6">
                  <InfoSection title="Time Off Balances" onEdit={() => setIsEditModalOpen(true)}>
                    <InfoField icon={<Plane size={16} />} label="Vacation" value={`${employee.vacationBalance} days`} />
                    <InfoField icon={<Heart size={16} />} label="Sick Days" value={`${employee.sickBalance} days`} />
                    <InfoField icon={<Sun size={16} />} label="Personal Days" value={`${employee.personalBalance} days`} />
                  </InfoSection>
                </div>
              )}
              {activeTab === 'Onboarding' && (
                <div>
                  <OnboardingPlan employeeId={employee.id} />
                </div>
              )}
              {activeTab === 'Skills' && (
                <div>
                  <SkillsAndCerts employeeId={employee.id} />
                </div>
              )}
              {activeTab === 'Notes' && (
                <div>
                  <PrivateNotes employeeId={employee.id} />
                </div>
              )}
              {activeTab === 'Journey' && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Career Journey</h3>
                    <button onClick={() => setIsJourneyModalOpen(true)} className="flex items-center text-sm text-white bg-blue-600 hover:bg-blue-700 font-semibold py-2 px-3 rounded-lg shadow-sm"><Plus size={16} className="mr-2" />Add Event</button>
                  </div>
                  <div className="relative border-l-2 border-gray-200 pl-6 space-y-6">
                    {journey.length > 0 ? journey.map(event => (
                      <div key={event.id} className="relative">
                        <div className="absolute -left-[34px] top-1 w-4 h-4 bg-white border-2 border-blue-600 rounded-full"></div>
                        <p className="text-sm text-gray-500">{event.date}</p>
                        <div className="flex items-center mt-1">
                          <div className="p-1.5 bg-gray-100 rounded-full mr-3">{getJourneyIcon(event.type)}</div>
                          <div><p className="font-bold text-gray-800">{event.type}</p><p className="text-gray-600">{event.details}</p></div>
                        </div>
                      </div>
                    )) : <p className="text-gray-500">No journey events have been logged for this employee.</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default EmployeeProfile;