import React from 'react';
import { User, Bell } from 'lucide-react';

// Reusable component for a settings section
const SettingsSection = ({ icon, title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="flex items-center mb-4 border-b border-gray-200 pb-4">
            {React.cloneElement(icon, { className: "w-6 h-6 mr-3 text-blue-600"})}
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

// Reusable component for a single setting item
const SettingItem = ({ label, description, control }) => (
    <div className="flex justify-between items-center py-2">
        <div>
            <p className="font-semibold text-gray-700">{label}</p>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
        {control}
    </div>
);

// A simple toggle switch component
const ToggleSwitch = ({ enabled }) => (
    <div className={`w-12 h-6 rounded-full p-1 flex items-center cursor-pointer transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${enabled ? 'translate-x-6' : ''}`}></div>
    </div>
);


function Settings() {
  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
      </header>
      
      <div className="max-w-4xl mx-auto">
        <SettingsSection icon={<User />} title="Profile Settings">
            <SettingItem 
                label="Public Profile" 
                description="Your profile is visible to everyone in the company."
                control={<ToggleSwitch enabled={true} />}
            />
            <SettingItem 
                label="Change Password" 
                description="Update your login password."
                control={<button className="font-semibold text-sm text-blue-600 hover:underline">Change</button>}
            />
        </SettingsSection>

        <SettingsSection icon={<Bell />} title="Notifications">
            <SettingItem 
                label="Email Notifications" 
                description="Receive updates and alerts in your email inbox."
                control={<ToggleSwitch enabled={true} />}
            />
            <SettingItem 
                label="Push Notifications" 
                description="Get notifications directly on your desktop."
                control={<ToggleSwitch enabled={false} />}
            />
             <SettingItem 
                label="Weekly Summary" 
                description="Get a weekly summary of company activity."
                control={<ToggleSwitch enabled={false} />}
            />
        </SettingsSection>
      </div>
    </div>
  );
}

export default Settings;
